"""
Servicio de Monetización y Pasarela de Pagos Wompi Bancolombia
Plataforma SaaS Emotiva LicitIA
Soporta Sandbox (Pruebas) y Producción mediante variables de entorno.
"""

import hashlib
import hmac
import os
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import httpx

logger = logging.getLogger("licitia.payments.wompi")

# -----------------------------------------------------------------------------
# Configuración y Credenciales Wompi (Sandbox por defecto)
# -----------------------------------------------------------------------------
WOMPI_ENVIRONMENT = os.getenv("WOMPI_ENVIRONMENT", "sandbox").lower()
WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY", "pub_test_Q5y1F350a49FkEa64k654F65")
WOMPI_PRIVATE_KEY = os.getenv("WOMPI_PRIVATE_KEY", "prv_test_54321")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "test_integrity_2K4M6R8P0T2V4X6Z8B0D2F4H6J8L0N2P")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "test_events_7J8L0N2P4R6T8V0X2Z4B6D8F0H2K4M6")

# Configuración de Base de Datos Supabase REST
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
if SUPABASE_URL and not SUPABASE_URL.endswith("/rest/v1"):
    # Normalizar URL REST de Supabase si viene la base
    if "/rest/v1" not in SUPABASE_URL:
        SUPABASE_REST_BASE = f"{SUPABASE_URL}/rest/v1"
    else:
        SUPABASE_REST_BASE = SUPABASE_URL
else:
    SUPABASE_REST_BASE = SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Caché en memoria para desarrollo local si la base de datos no está disponible
_LOCAL_SUBSCRIPTIONS_CACHE: Dict[str, Dict[str, Any]] = {}
_LOCAL_TRANSACTIONS_CACHE: Dict[str, Dict[str, Any]] = {}


class WompiPaymentService:
    """Manejo de firmas criptográficas, webhooks y ciclo de vida de suscripciones Wompi."""

    @classmethod
    def get_public_config(cls) -> Dict[str, str]:
        """Retorna la configuración pública para el frontend."""
        return {
            "public_key": WOMPI_PUBLIC_KEY,
            "environment": WOMPI_ENVIRONMENT,
            "currency": "COP"
        }

    @classmethod
    def generate_integrity_signature(
        cls,
        reference: str,
        amount_in_cents: int,
        currency: str = "COP"
    ) -> str:
        """
        Calcula el hash SHA-256 de integridad requerido por Wompi Widget.
        Fórmula: SHA256(reference + amountInCents + currency + integritySecret)
        """
        raw_string = f"{reference}{amount_in_cents}{currency}{WOMPI_INTEGRITY_SECRET}"
        signature = hashlib.sha256(raw_string.encode("utf-8")).hexdigest()
        return signature

    @classmethod
    def verify_webhook_checksum(cls, payload: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Verifica la autenticidad del evento enviado por Wompi mediante el checksum SHA-256.
        Estructura esperada en el payload:
        {
          "data": { ... },
          "signature": {
            "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
            "checksum": "..."
          },
          "timestamp": 123456789
        }
        """
        signature_block = payload.get("signature", {})
        properties = signature_block.get("properties", [])
        expected_checksum = signature_block.get("checksum", "")
        timestamp = payload.get("timestamp")

        if not expected_checksum:
            # Si no trae firma en modo sandbox / desarrollo permitimos traza
            if WOMPI_ENVIRONMENT == "sandbox":
                logger.warning("Webhook sin bloque de firma en sandbox. Se acepta para depuración.")
                return True, "sandbox_no_signature"
            return False, "missing_checksum"

        data_block = payload.get("data", {})

        # Concatenar los valores de las propiedades en el orden exacto especificado por Wompi
        concatenated_values = []
        for prop in properties:
            parts = prop.split(".")
            curr = data_block
            for part in parts:
                if isinstance(curr, dict):
                    curr = curr.get(part)
                else:
                    curr = None
                    break
            if curr is not None:
                concatenated_values.append(str(curr))

        # Fórmula oficial Wompi: concatenación de propiedades + timestamp + events_secret
        raw_string = "".join(concatenated_values) + str(timestamp) + WOMPI_EVENTS_SECRET
        computed_checksum = hashlib.sha256(raw_string.encode("utf-8")).hexdigest()

        if computed_checksum.lower() == expected_checksum.lower():
            return True, "valid"
        
        # En sandbox, si se usó una clave de prueba distinta, registramos advertencia
        if WOMPI_ENVIRONMENT == "sandbox":
            logger.warning(
                f"Checksum Wompi no coincide (calculado: {computed_checksum[:8]}... vs recibido: {expected_checksum[:8]}...). "
                "Aceptado en entorno Sandbox."
            )
            return True, "sandbox_checksum_mismatch"

        return False, "invalid_checksum"

    @classmethod
    def parse_reference(cls, reference: str) -> Dict[str, Any]:
        """
        Extrae información codificada en la referencia.
        Formatos soportados:
        - LICITIA-{PLAN}-{ORG_ID}-{TIMESTAMP}
        - LICITIA-{PLAN}-{TIMESTAMP}
        """
        parts = reference.split("-")
        plan_id = "pyme"
        org_id = None

        if len(parts) >= 2:
            potential_plan = parts[1].lower()
            if potential_plan in ["free", "pyme", "enterprise"]:
                plan_id = potential_plan

        if len(parts) >= 4:
            # Formato con ORG_ID: LICITIA-PYME-c0a80101...-1727180000
            org_id = parts[2]
            if org_id == "GUEST" or org_id == "UNDEFINED":
                org_id = None

        return {
            "plan_id": plan_id,
            "organization_id": org_id,
            "reference": reference
        }

    @classmethod
    async def process_webhook_event(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Procesa el evento `transaction.updated` de Wompi.
        Actualiza el estado de la suscripción y registra el pago en la base de datos.
        """
        event_name = payload.get("event")
        data_block = payload.get("data", {})
        transaction = data_block.get("transaction", {})

        if not transaction:
            logger.warning("Evento de Wompi recibido sin objeto transaction.")
            return {"status": "ignored", "reason": "no_transaction_data"}

        tx_id = transaction.get("id")
        reference = transaction.get("reference", "")
        tx_status = transaction.get("status", "UNKNOWN")
        amount_in_cents = transaction.get("amount_in_cents", 0)
        currency = transaction.get("currency", "COP")
        payment_method_type = transaction.get("payment_method_type", "PSE")
        customer_email = transaction.get("customer_email")
        customer_data = transaction.get("customer_data", {})

        amount_cop = amount_in_cents / 100.0

        ref_info = cls.parse_reference(reference)
        plan_id = ref_info["plan_id"]
        org_id = ref_info["organization_id"]

        # Determinar ciclo de facturación basado en el monto
        # Plan Pyme: 290.000 mensual vs 2.784.000 anual
        # Plan Enterprise: 690.000 mensual vs 6.624.000 anual
        is_yearly = amount_cop > 1500000
        billing_cycle = "yearly" if is_yearly else "monthly"

        now = datetime.now(timezone.utc)
        if billing_cycle == "yearly":
            period_end = now + timedelta(days=365)
        else:
            period_end = now + timedelta(days=30)

        logger.info(
            f"Wompi Event [{event_name}]: Ref={reference}, Status={tx_status}, Plan={plan_id}, "
            f"Amount=${amount_cop:,.0f} COP, Org={org_id or 'Sin Org'}"
        )

        # 1. Registrar transacción en caché local de respaldo
        tx_record = {
            "reference": reference,
            "wompi_id": tx_id,
            "amount_in_cents": amount_in_cents,
            "amount_cop": amount_cop,
            "currency": currency,
            "status": tx_status,
            "payment_method_type": payment_method_type,
            "plan_id": plan_id,
            "billing_cycle": billing_cycle,
            "customer_email": customer_email,
            "organization_id": org_id,
            "created_at": now.isoformat()
        }
        _LOCAL_TRANSACTIONS_CACHE[reference] = tx_record

        # 2. Si la transacción fue aprobada, activar suscripción
        if tx_status == "APPROVED":
            sub_record = {
                "organization_id": org_id or "default_org",
                "plan_id": plan_id,
                "billing_cycle": billing_cycle,
                "status": "active",
                "current_period_start": now.isoformat(),
                "current_period_end": period_end.isoformat(),
                "payment_method": payment_method_type,
                "wompi_transaction_id": tx_id,
                "wompi_reference": reference,
                "updated_at": now.isoformat()
            }
            if org_id:
                _LOCAL_SUBSCRIPTIONS_CACHE[org_id] = sub_record
            _LOCAL_SUBSCRIPTIONS_CACHE["last_active"] = sub_record

        # 3. Intentar persistencia en Supabase / PostgreSQL si está configurado
        await cls._persist_to_supabase(tx_record, tx_status == "APPROVED", period_end, payload)

        return {
            "status": "processed",
            "transaction_status": tx_status,
            "plan_id": plan_id,
            "reference": reference,
            "active_until": period_end.isoformat() if tx_status == "APPROVED" else None
        }

    @classmethod
    async def _persist_to_supabase(
        cls,
        tx_record: Dict[str, Any],
        is_approved: bool,
        period_end: datetime,
        raw_payload: Dict[str, Any]
    ) -> None:
        """Guarda la transacción y la suscripción en las tablas de Supabase vía REST."""
        if not SUPABASE_REST_BASE or not SUPABASE_SERVICE_ROLE_KEY:
            logger.info("Supabase URL o Service Role Key no configurada. Transacción retenida en memoria.")
            return

        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            # 1. Guardar en payment_transactions
            try:
                tx_payload = {
                    "reference": tx_record["reference"],
                    "wompi_id": tx_record["wompi_id"],
                    "amount_in_cents": tx_record["amount_in_cents"],
                    "amount_cop": tx_record["amount_cop"],
                    "currency": tx_record["currency"],
                    "status": tx_record["status"],
                    "payment_method_type": tx_record["payment_method_type"],
                    "plan_id": tx_record["plan_id"],
                    "billing_cycle": tx_record["billing_cycle"],
                    "customer_email": tx_record.get("customer_email"),
                    "raw_event": raw_payload
                }
                if tx_record.get("organization_id"):
                    tx_payload["organization_id"] = tx_record["organization_id"]

                res_tx = await client.post(
                    f"{SUPABASE_REST_BASE}/payment_transactions",
                    headers=headers,
                    json=tx_payload
                )
                if res_tx.status_code in (200, 201):
                    logger.info("Transacción registrada con éxito en Supabase payment_transactions.")
                else:
                    logger.warning(f"Error al guardar payment_transactions en Supabase: {res_tx.status_code} {res_tx.text}")
            except Exception as e:
                logger.error(f"Fallo al conectar con Supabase para payment_transactions: {e}")

            # 2. Si es APPROVED y tenemos organization_id, actualizar la tabla subscriptions
            org_id = tx_record.get("organization_id")
            if is_approved and org_id:
                try:
                    sub_payload = {
                        "organization_id": org_id,
                        "plan_id": tx_record["plan_id"],
                        "billing_cycle": tx_record["billing_cycle"],
                        "status": "active",
                        "current_period_start": datetime.now(timezone.utc).isoformat(),
                        "current_period_end": period_end.isoformat(),
                        "payment_method": tx_record["payment_method_type"],
                        "wompi_transaction_id": tx_record["wompi_id"],
                        "wompi_reference": tx_record["reference"],
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }

                    # Usar upsert con on_conflict=organization_id
                    upsert_headers = {
                        **headers,
                        "Prefer": "resolution=merge-duplicates,return=minimal"
                    }
                    res_sub = await client.post(
                        f"{SUPABASE_REST_BASE}/subscriptions",
                        headers=upsert_headers,
                        json=sub_payload
                    )
                    if res_sub.status_code in (200, 201, 204):
                        logger.info(f"Suscripción de organización {org_id} activada exitosamente en Supabase.")
                    else:
                        logger.warning(f"Error al actualizar subscriptions en Supabase: {res_sub.status_code} {res_sub.text}")
                except Exception as e:
                    logger.error(f"Fallo al actualizar suscripción en Supabase: {e}")

    @classmethod
    async def get_active_subscription(cls, organization_id: str) -> Dict[str, Any]:
        """
        Consulta la suscripción vigente de una organización.
        Valida que el status sea 'active' y que la fecha de vigencia no haya expirado.
        """
        now = datetime.now(timezone.utc)

        # 1. Intentar consultar desde Supabase si está disponible
        if SUPABASE_REST_BASE and SUPABASE_SERVICE_ROLE_KEY and organization_id:
            headers = {
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Accept": "application/json"
            }
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.get(
                        f"{SUPABASE_REST_BASE}/subscriptions?organization_id=eq.{organization_id}&select=*&limit=1",
                        headers=headers
                    )
                    if res.status_code == 200:
                        records = res.json()
                        if records and len(records) > 0:
                            sub = records[0]
                            end_str = sub.get("current_period_end")
                            if end_str:
                                end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
                                is_valid = sub.get("status") == "active" and end_dt > now
                                return {
                                    "organization_id": organization_id,
                                    "plan_id": sub.get("plan_id", "free") if is_valid else "free",
                                    "billing_cycle": sub.get("billing_cycle", "monthly"),
                                    "status": sub.get("status") if is_valid else "expired",
                                    "current_period_start": sub.get("current_period_start"),
                                    "current_period_end": sub.get("current_period_end"),
                                    "is_active": is_valid,
                                    "payment_method": sub.get("payment_method"),
                                    "cancel_at_period_end": sub.get("cancel_at_period_end", False)
                                }
            except Exception as e:
                logger.warning(f"No se pudo consultar Supabase para suscripción: {e}. Revisando caché local.")

        # 2. Revisar caché local en memoria
        if organization_id in _LOCAL_SUBSCRIPTIONS_CACHE:
            sub = _LOCAL_SUBSCRIPTIONS_CACHE[organization_id]
            end_dt = datetime.fromisoformat(sub["current_period_end"].replace("Z", "+00:00"))
            is_valid = sub["status"] == "active" and end_dt > now
            return {
                "organization_id": organization_id,
                "plan_id": sub["plan_id"] if is_valid else "free",
                "billing_cycle": sub["billing_cycle"],
                "status": sub["status"] if is_valid else "expired",
                "current_period_start": sub["current_period_start"],
                "current_period_end": sub["current_period_end"],
                "is_active": is_valid,
                "payment_method": sub.get("payment_method"),
                "cancel_at_period_end": False
            }

        # 3. Retornar Plan Gratuito (Explorador RUP) por defecto
        return {
            "organization_id": organization_id,
            "plan_id": "free",
            "billing_cycle": "monthly",
            "status": "active",
            "current_period_start": now.isoformat(),
            "current_period_end": (now + timedelta(days=3650)).isoformat(),
            "is_active": True,
            "payment_method": None,
            "cancel_at_period_end": False
        }
