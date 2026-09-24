"""
Rate Limiter & Concurrency Guard for Emotiva LicitIA API.
Implementa limitación de tasa por ventana deslizante (Sliding Window).
Soporta Redis distribuido con fallback automático a memoria RAM local por IP.
Evita saturación del servidor, abusos, scrapers descontrolados y ataques DoS.
"""

import time
import asyncio
from typing import Optional, Dict, List
from collections import deque
from fastapi import Request, HTTPException, Response
from app.core.cache import cache_manager, HAS_REDIS


class InMemoryRateLimiter:
    """Limitador en memoria local por IP usando deque de marcas de tiempo."""
    def __init__(self):
        # Mapeo: ip -> deque([timestamp, timestamp, ...])
        self._clients: Dict[str, deque] = {}
        self._cleanup_counter = 0

    def check(self, client_id: str, limit: int, window_seconds: int) -> tuple[bool, int, int]:
        """
        Retorna (allowed: bool, remaining: int, reset_seconds: int).
        """
        now = time.time()
        window_start = now - window_seconds

        if client_id not in self._clients:
            self._clients[client_id] = deque()

        queue = self._clients[client_id]

        # Eliminar timestamps fuera de la ventana
        while queue and queue[0] < window_start:
            queue.popleft()

        # Limpieza periódica para evitar fugas de memoria
        self._cleanup_counter += 1
        if self._cleanup_counter > 500:
            self._cleanup_counter = 0
            to_remove = [k for k, q in self._clients.items() if not q or q[-1] < window_start]
            for k in to_remove:
                del self._clients[k]

        current_count = len(queue)
        if current_count >= limit:
            oldest = queue[0] if queue else now
            reset_seconds = max(1, int(oldest + window_seconds - now))
            return False, 0, reset_seconds

        queue.append(now)
        remaining = max(0, limit - len(queue))
        reset_seconds = window_seconds
        return True, remaining, reset_seconds


in_memory_limiter = InMemoryRateLimiter()


class RateLimiter:
    """
    Dependencia de FastAPI para proteger endpoints.
    Uso:
        @app.get("/endpoint", dependencies=[Depends(RateLimiter(times=60, seconds=60))])
    """
    def __init__(self, times: int = 120, seconds: int = 60, tag: str = "default"):
        self.times = times
        self.seconds = seconds
        self.tag = tag

    async def __call__(self, request: Request, response: Response):
        # Obtener IP del cliente (soporta proxies / Cloudflare / Nginx)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        client_key = f"{self.tag}:{client_ip}"

        allowed = True
        remaining = self.times
        reset_seconds = self.seconds

        # 1. Intentar con Redis si está conectado
        redis = await cache_manager._get_redis()
        used_redis = False
        if redis:
            try:
                now = time.time()
                redis_key = f"ratelimit:{client_key}"
                pipe = redis.pipeline()
                window_start = now - self.seconds

                # Sliding window en sorted set de Redis
                pipe.zremrangebyscore(redis_key, 0, window_start)
                pipe.zadd(redis_key, {str(now): now})
                pipe.zcard(redis_key)
                pipe.expire(redis_key, self.seconds + 5)
                results = await asyncio.wait_for(pipe.execute(), timeout=0.25)

                current_count = results[2]
                used_redis = True

                if current_count > self.times:
                    allowed = False
                    remaining = 0
                    reset_seconds = self.seconds
                else:
                    allowed = True
                    remaining = max(0, self.times - current_count)
                    reset_seconds = self.seconds
            except Exception:
                used_redis = False

        # 2. Fallback a limitador en memoria si Redis no está disponible
        if not used_redis:
            allowed, remaining, reset_seconds = in_memory_limiter.check(
                client_id=client_key,
                limit=self.times,
                window_seconds=self.seconds
            )

        # Inyectar cabeceras estándar de Rate Limiting
        response.headers["X-RateLimit-Limit"] = str(self.times)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_seconds)

        if not allowed:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Demasiadas peticiones (Rate Limit Exceeded)",
                    "message": f"Has alcanzado el límite de {self.times} peticiones por minuto. Por favor espera {reset_seconds} segundos antes de reintentar.",
                    "retry_after_seconds": reset_seconds
                },
                headers={"Retry-After": str(reset_seconds)}
            )
        return True
