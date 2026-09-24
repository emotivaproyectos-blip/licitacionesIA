"""
FastAPI Router: Pasarela de Pagos y Suscripciones SaaS Wompi Bancolombia
Emotiva LicitIA
"""

import logging
from fastapi import APIRouter, HTTPException, Request, Header, Query
from typing import Optional, Dict, Any

from app.modules.payments.schemas import (
    IntegritySignatureRequest,
    IntegritySignatureResponse,
    WompiConfigResponse,
    SubscriptionDTO
)
from app.modules.payments.wompi_service import (
    WompiPaymentService,
    WOMPI_PUBLIC_KEY,
    WOMPI_ENVIRONMENT
)

logger = logging.getLogger("licitia.payments.router")

router = APIRouter(prefix="/api/v1/payments", tags=["Pagos y Suscripciones Wompi"])


@router.get("/wompi/config", response_model=WompiConfigResponse)
def get_wompi_public_config():
    """
    Entrega la llave pública y el entorno (sandbox/production) configurados en el servidor.
    Permite al frontend inicializar el checkout de Wompi de forma dinámica sin quemar claves.
    """
    return WompiPaymentService.get_public_config()


@router.post("/wompi/integrity-signature", response_model=IntegritySignatureResponse)
def generate_integrity_signature(payload: IntegritySignatureRequest):
    """
    Genera la firma SHA-256 de integridad para el WidgetCheckout oficial de Wompi.
    Wompi exige esta firma en el servidor para garantizar que nadie altere el monto en el navegador.
    Fórmula: SHA256(reference + amountInCents + currency + integritySecret)
    """
    try:
        signature = WompiPaymentService.generate_integrity_signature(
            reference=payload.reference,
            amount_in_cents=payload.amount_in_cents,
            currency=payload.currency
        )
        return IntegritySignatureResponse(
            signature=signature,
            reference=payload.reference,
            amount_in_cents=payload.amount_in_cents,
            currency=payload.currency,
            public_key=WOMPI_PUBLIC_KEY,
            environment=WOMPI_ENVIRONMENT
        )
    except Exception as e:
        logger.error(f"Error generando firma de integridad: {e}")
        raise HTTPException(status_code=500, detail="Error interno al generar firma de integridad.")


@router.post("/wompi/webhook")
async def wompi_webhook_handler(
    request: Request,
    x_event_checksum: Optional[str] = Header(None, alias="x-event-checksum")
):
    """
    Endpoint Webhook oficial para recibir notificaciones en tiempo real desde Wompi (transacción aprobada, rechazada, etc.).
    Valida la firma criptográfica del evento y activa la suscripción en la base de datos.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Cuerpo de petición JSON inválido.")

    # 1. Validar autenticidad de la notificación
    is_valid, reason = WompiPaymentService.verify_webhook_checksum(body)
    if not is_valid:
        logger.warning(f"Webhook de Wompi rechazado por firma inválida: {reason}")
        raise HTTPException(status_code=403, detail="Firma de evento Wompi no autorizada o manipulada.")

    # 2. Procesar evento de la transacción
    try:
        result = await WompiPaymentService.process_webhook_event(body)
        return {"received": True, "result": result}
    except Exception as e:
        logger.error(f"Error procesando evento webhook de Wompi: {e}")
        return {"received": True, "status": "error_handled", "detail": str(e)}


@router.get("/subscription/{organization_id}", response_model=SubscriptionDTO)
async def get_organization_subscription(organization_id: str):
    """
    Consulta el estado y vigencia de la suscripción SaaS activa de una organización.
    Si expiró o no cuenta con suscripción paga, retorna automáticamente el Plan Explorador RUP (free).
    """
    if not organization_id or organization_id.strip() == "":
        raise HTTPException(status_code=400, detail="organization_id es requerido.")

    sub = await WompiPaymentService.get_active_subscription(organization_id)
    return sub


@router.post("/wompi/test-simulate-approval", tags=["Utilidad Sandbox"])
async def simulate_sandbox_approval(
    reference: str = Query(..., description="Referencia de la transacción (ej. LICITIA-PYME-ORG1-1727180000)"),
    amount_in_cents: int = Query(29000000, description="Monto en centavos ($290.000 COP)"),
    customer_email: str = Query("empresa.prueba@licitia.co", description="Email del comprador"),
    payment_method: str = Query("PSE", description="PSE, CARD, NEQUI o BANCOLOMBIA")
):
    """
    Endpoint de utilidad para pruebas locales en entorno Sandbox.
    Permite simular la recepción exitosa de un Webhook de Wompi sin necesidad de exponer un túnel público (ngrok).
    """
    if WOMPI_ENVIRONMENT != "sandbox":
        raise HTTPException(status_code=403, detail="La simulación solo está disponible en modo Sandbox.")

    ref_info = WompiPaymentService.parse_reference(reference)
    simulated_payload = {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": f"SIM-WOMPI-{reference.replace('LICITIA-', '')}",
                "reference": reference,
                "status": "APPROVED",
                "amount_in_cents": amount_in_cents,
                "currency": "COP",
                "payment_method_type": payment_method,
                "customer_email": customer_email,
                "customer_data": {
                    "legal_id": "901234567",
                    "full_name": "Empresa Contratista de Pruebas"
                }
            }
        },
        "environment": "test",
        "timestamp": 1727180000,
        "signature": {
            "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
            "checksum": "sandbox_simulated_checksum"
        }
    }

    result = await WompiPaymentService.process_webhook_event(simulated_payload)
    return {
        "message": "Transacción simulada procesada con éxito",
        "result": result
    }
