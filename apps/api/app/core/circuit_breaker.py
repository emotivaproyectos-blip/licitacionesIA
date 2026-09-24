"""
Circuit Breaker Pattern for External API Integration (Colombia Compra Eficiente / SODA).
Previene fallos en cascada y bloqueos cuando los servicios gubernamentales (datos.gov.co)
entran en mantenimiento, sufren caídas, lentitud o límites de tasa (HTTP 429/504).

Estados:
- CLOSED: Operación normal. Las peticiones viajan a SODA con timeout estricto.
- OPEN: Circuito abierto. Se detectaron 3 fallos consecutivos. Se bloquean las peticiones
  a SODA y se retorna instantáneamente (< 2ms) el snapshot o respaldo de alta disponibilidad.
- HALF_OPEN: Periodo de prueba tras 45s de enfriamiento. Se envía una sola petición de sondeo.
  Si responde exitosamente, el circuito se cierra (CLOSED); si falla, vuelve a OPEN.
"""

import time
import asyncio
import logging
from enum import Enum
from typing import Callable, Any, Optional, Dict

logger = logging.getLogger("licitia.circuit_breaker")


class CircuitState(str, Enum):
    CLOSED = "CLOSED"          # Normal
    OPEN = "OPEN"              # Abierto (Fallo externo detectado)
    HALF_OPEN = "HALF_OPEN"    # Enfriando / Sondeo


class CircuitBreakerOpenException(Exception):
    """Excepción lanzada cuando el circuito está abierto."""
    pass


class CircuitBreaker:
    def __init__(
        self,
        name: str = "SECOP_SODA",
        failure_threshold: int = 3,
        recovery_timeout: float = 45.0,
        call_timeout: float = 4.5
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.call_timeout = call_timeout

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[float] = None
        self.last_success_time: Optional[float] = None
        self.tripped_count = 0
        self._lock = asyncio.Lock()

    def is_available(self) -> bool:
        """Determina si se puede intentar una llamada externa o si se debe saltar de inmediato."""
        if self.state == CircuitState.CLOSED:
            return True

        now = time.time()
        if self.state == CircuitState.OPEN:
            if self.last_failure_time and (now - self.last_failure_time >= self.recovery_timeout):
                logger.info(f"[Circuit Breaker: {self.name}] Tiempo de enfriamiento cumplido. Pasando a HALF_OPEN.")
                self.state = CircuitState.HALF_OPEN
                return True
            return False

        if self.state == CircuitState.HALF_OPEN:
            return True

        return False

    async def call(self, coroutine_func: Callable, fallback_func: Callable, *args, **kwargs) -> Any:
        """
        Ejecuta la corutina externa con protección de timeout y control de circuito.
        Si el circuito está abierto o la llamada falla, ejecuta el fallback en 0ms.
        """
        if not self.is_available():
            logger.warning(f"[Circuit Breaker: {self.name}] CIRCUITO ABIERTO (OPEN). Saltando llamada externa y activando Modo Alta Disponibilidad.")
            return await fallback_func(*args, **kwargs)

        try:
            # Ejecutar con timeout estricto para evitar bloqueos
            result = await asyncio.wait_for(coroutine_func(*args, **kwargs), timeout=self.call_timeout)
            
            # Si el resultado es vacío o nulo y venía de un fallo previo, validamos
            if result:
                await self.record_success()
                return result
            else:
                # Si retorna lista vacía sin excepción pero estamos en HALF_OPEN
                if self.state == CircuitState.HALF_OPEN:
                    await self.record_failure("Respuesta vacía durante sondeo")
                return await fallback_func(*args, **kwargs)

        except asyncio.TimeoutError:
            await self.record_failure(f"Timeout excedido ({self.call_timeout}s)")
            logger.warning(f"[Circuit Breaker: {self.name}] Timeout excedido en llamada a API externa.")
            return await fallback_func(*args, **kwargs)
        except Exception as e:
            await self.record_failure(str(e))
            logger.warning(f"[Circuit Breaker: {self.name}] Error en llamada a API externa: {e}")
            return await fallback_func(*args, **kwargs)

    async def record_success(self):
        async with self._lock:
            self.success_count += 1
            self.last_success_time = time.time()
            if self.state in [CircuitState.HALF_OPEN, CircuitState.OPEN]:
                logger.info(f"[Circuit Breaker: {self.name}] Sondeo exitoso. Circuito restaurado a CLOSED (Normal).")
                self.state = CircuitState.CLOSED
                self.failure_count = 0

    async def record_failure(self, reason: str = "Error desconocido"):
        async with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            logger.warning(f"[Circuit Breaker: {self.name}] Fallo #{self.failure_count}/{self.failure_threshold}: {reason}")

            if self.state == CircuitState.HALF_OPEN or self.failure_count >= self.failure_threshold:
                if self.state != CircuitState.OPEN:
                    self.tripped_count += 1
                    logger.error(f"[Circuit Breaker: {self.name}] Umbral alcanzado. ¡CIRCUITO DISPARADO A OPEN! Activando protección.")
                self.state = CircuitState.OPEN

    def reset(self):
        """Reinicia manualmente el circuito."""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None

    def get_telemetry(self) -> Dict[str, Any]:
        """Telemetría para monitor de salud y métricas."""
        now = time.time()
        time_since_failure = round(now - self.last_failure_time, 1) if self.last_failure_time else None
        time_to_recovery = max(0.0, round(self.recovery_timeout - (time_since_failure or 0), 1)) if self.state == CircuitState.OPEN else 0.0

        return {
            "name": self.name,
            "state": self.state.value,
            "is_operational": self.state == CircuitState.CLOSED,
            "failure_count": self.failure_count,
            "failure_threshold": self.failure_threshold,
            "tripped_count": self.tripped_count,
            "call_timeout_seconds": self.call_timeout,
            "recovery_timeout_seconds": self.recovery_timeout,
            "seconds_until_probe": time_to_recovery,
            "last_failure_seconds_ago": time_since_failure,
            "mode": "High Availability Fallback" if self.state != CircuitState.CLOSED else "Live Government API"
        }


# Instancia global para SECOP / SODA
secop_circuit_breaker = CircuitBreaker(
    name="SECOP_SODA_Client",
    failure_threshold=3,
    recovery_timeout=45.0,
    call_timeout=4.5
)
