"""
Hybrid Cache System (L1 In-Memory + L2 Distributed Redis) for Emotiva LicitIA.
Diseñado para alta concurrencia y tolerancia a fallos.
Si Redis está activo (Docker / producción), comparte el estado global entre workers.
Si Redis está inactivo o en mantenimiento, conmuta de forma transparente y sin errores
a una caché L1 en memoria de ultra-alta velocidad (< 1ms).
"""

import json
import time
import asyncio
import logging
from typing import Any, Optional, Callable, Dict
from functools import wraps
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("licitia.cache")

# Intento de importar redis asíncrono
try:
    import redis.asyncio as aioredis
    HAS_REDIS = True
except ImportError:
    aioredis = None
    HAS_REDIS = False


class InMemoryCache:
    """Caché L1 en memoria RAM de ultra-alta velocidad con expiración TTL."""
    def __init__(self, max_items: int = 2000):
        self._store: Dict[str, Dict[str, Any]] = {}
        self._max_items = max_items
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        item = self._store.get(key)
        if not item:
            self._misses += 1
            return None
        
        # Verificar expiración TTL
        if item["expires_at"] is not None and time.time() > item["expires_at"]:
            del self._store[key]
            self._misses += 1
            return None
            
        self._hits += 1
        return item["value"]

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        # Eviccion básica si se supera el tamaño máximo
        if len(self._store) >= self._max_items and key not in self._store:
            # Eliminar la clave con expiración más cercana o la primera encontrada
            oldest_key = next(iter(self._store))
            del self._store[oldest_key]

        expires_at = time.time() + ttl_seconds if ttl_seconds else None
        self._store[key] = {
            "value": value,
            "expires_at": expires_at,
            "created_at": time.time()
        }

    def delete(self, key: str) -> bool:
        if key in self._store:
            del self._store[key]
            return True
        return False

    def clear_prefix(self, prefix: str) -> int:
        keys_to_del = [k for k in self._store if k.startswith(prefix)]
        for k in keys_to_del:
            del self._store[k]
        return len(keys_to_del)

    def stats(self) -> Dict[str, Any]:
        now = time.time()
        active_keys = sum(1 for item in self._store.values() if item["expires_at"] is None or item["expires_at"] > now)
        return {
            "type": "in_memory_l1",
            "active_keys": active_keys,
            "total_slots": len(self._store),
            "max_items": self._max_items,
            "hits": self._hits,
            "misses": self._misses,
            "hit_ratio": round(self._hits / (self._hits + self._misses) if (self._hits + self._misses) > 0 else 0.0, 3)
        }


class CacheManager:
    """
    Gestor Híbrido L1 (Memoria) + L2 (Redis).
    Garantiza cero caídas: si Redis no responde en 200ms o está apagado, opera en L1 sin bloquear.
    """
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.l1 = InMemoryCache()
        self._redis_client = None
        self._redis_connected = False
        self._redis_checked = False
        self._lock = asyncio.Lock()
        self._last_redis_retry = 0

    async def _get_redis(self):
        """Obtiene el cliente Redis con inicialización diferida y timeout ultra-corto."""
        if not HAS_REDIS:
            return None

        now = time.time()
        # Si falló la conexión recientemente, no insistir cada milisegundo (reintentar cada 30s)
        if not self._redis_connected and (now - self._last_redis_retry < 30) and self._redis_checked:
            return None

        if self._redis_client is not None and self._redis_connected:
            return self._redis_client

        async with self._lock:
            if self._redis_client is not None and self._redis_connected:
                return self._redis_client

            self._redis_checked = True
            self._last_redis_retry = now
            try:
                client = aioredis.from_url(
                    self.redis_url, 
                    socket_connect_timeout=0.3, 
                    socket_timeout=0.3,
                    decode_responses=True
                )
                # Test de conexión rápido
                await asyncio.wait_for(client.ping(), timeout=0.4)
                self._redis_client = client
                self._redis_connected = True
                logger.info(f"[LicitIA Cache] Conexión exitosa a Redis L2 en {self.redis_url}")
                return self._redis_client
            except Exception as e:
                self._redis_connected = False
                self._redis_client = None
                logger.debug(f"[LicitIA Cache] Redis no disponible ({e}). Operando con caché L1 en memoria.")
                return None

    async def get(self, key: str) -> Optional[Any]:
        """Obtiene un valor. Consulta primero L1 (RAM local), luego L2 (Redis)."""
        # 1. Consulta L1 (ultrarrápida < 0.1ms)
        cached = self.l1.get(key)
        if cached is not None:
            return cached

        # 2. Consulta L2 (Redis) si está disponible
        redis = await self._get_redis()
        if redis:
            try:
                raw = await asyncio.wait_for(redis.get(key), timeout=0.25)
                if raw:
                    parsed = json.loads(raw)
                    # Poblamos L1 para próximas peticiones en este mismo worker
                    self.l1.set(key, parsed, ttl_seconds=60)
                    return parsed
            except Exception as e:
                logger.debug(f"[Cache L2 Error] {e}")

        return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """Guarda en L1 y en L2 de forma asíncrona."""
        # Siempre guarda en L1
        self.l1.set(key, value, ttl_seconds=ttl_seconds)

        # Guarda en L2 si está disponible
        redis = await self._get_redis()
        if redis:
            try:
                raw = json.dumps(value, default=str)
                await asyncio.wait_for(redis.setex(key, ttl_seconds, raw), timeout=0.3)
            except Exception as e:
                logger.debug(f"[Cache L2 Set Error] {e}")

    async def delete(self, key: str) -> None:
        """Elimina de L1 y L2."""
        self.l1.delete(key)
        redis = await self._get_redis()
        if redis:
            try:
                await asyncio.wait_for(redis.delete(key), timeout=0.2)
            except Exception:
                pass

    async def clear_prefix(self, prefix: str) -> int:
        """Limpia claves por prefijo."""
        count = self.l1.clear_prefix(prefix)
        redis = await self._get_redis()
        if redis:
            try:
                keys = await asyncio.wait_for(redis.keys(f"{prefix}*"), timeout=0.5)
                if keys:
                    await asyncio.wait_for(redis.delete(*keys), timeout=0.5)
                    count = max(count, len(keys))
            except Exception:
                pass
        return count

    async def get_stats(self) -> Dict[str, Any]:
        """Auditoría y telemetría del estado de la caché."""
        stats = self.l1.stats()
        redis = await self._get_redis()
        stats["redis_connected"] = bool(self._redis_connected and redis is not None)
        stats["redis_url"] = self.redis_url if stats["redis_connected"] else "disconnected (fallback a L1 activo)"
        return stats


# Instancia singleton global
cache_manager = CacheManager()


def cached(ttl_seconds: int = 300, prefix: str = "cache"):
    """
    Decorador para cachear respuestas de endpoints y funciones asíncronas de FastAPI.
    Construye una clave basada en los argumentos de la función.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Filtrar argumentos no serializables como BackgroundTasks o Request
            clean_kwargs = {
                k: v for k, v in kwargs.items() 
                if not hasattr(v, "headers") and not k.startswith("background")
            }
            cache_key = f"{prefix}:{func.__name__}:{str(args)}:{json.dumps(clean_kwargs, sort_keys=True, default=str)}"
            
            # Buscar en caché
            cached_data = await cache_manager.get(cache_key)
            if cached_data is not None:
                return cached_data

            # Ejecutar función
            result = await func(*args, **kwargs)
            
            # Guardar en caché si el resultado es válido
            if result is not None:
                serialized = _serialize_for_cache(result)
                await cache_manager.set(cache_key, serialized, ttl_seconds=ttl_seconds)

            return result
        return wrapper
    return decorator


def _serialize_for_cache(val: Any) -> Any:
    """Convierte modelos Pydantic, listas y objetos a tipos serializables en JSON."""
    if hasattr(val, "model_dump"):
        return val.model_dump()
    if hasattr(val, "dict"):
        return val.dict()
    if isinstance(val, list):
        return [_serialize_for_cache(item) for item in val]
    if isinstance(val, dict):
        return {k: _serialize_for_cache(v) for k, v in val.items()}
    return val

