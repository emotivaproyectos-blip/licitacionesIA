"""
Worker de Ingesta Asíncrona SECOP II (Cron Job de 15 minutos)
Ejecuta tareas en segundo plano para sincronizar las licitaciones públicas de Colombia Compra Eficiente.
"""

import asyncio
import logging
from app.modules.secop.soda_client import SECOPDatosAbiertosClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SECOPIngestionWorker")

class SECOPIngestionWorker:
    INTERVAL_SECONDS = 900  # 15 Minutos

    @classmethod
    async def run_periodic_ingestion(cls):
        """Loop asíncrono infinito que ejecuta la ingesta cada 15 minutos."""
        logger.info("[SECOP Worker] Iniciando Worker de Ingesta Asíncrona (Intervalo: 15 minutos)...")
        while True:
            try:
                logger.info("[SECOP Worker] Ejecutando sincronización de licitaciones SECOP II en vivo...")
                result = await SECOPDatosAbiertosClient.sync_and_store_tenders(limit=50)
                logger.info(f"[SECOP Worker] Sincronización exitosa: {result}")
            except Exception as e:
                logger.error(f"[SECOP Worker Error] Fallo en el ciclo de ingesta: {str(e)}")

            await asyncio.sleep(cls.INTERVAL_SECONDS)

if __name__ == "__main__":
    asyncio.run(SECOPIngestionWorker.run_periodic_ingestion())
