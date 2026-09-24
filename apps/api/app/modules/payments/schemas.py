from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class IntegritySignatureRequest(BaseModel):
    reference: str = Field(..., description="Referencia única de la transacción (ej. LICITIA-PYME-ORG1-1727180000)")
    amount_in_cents: int = Field(..., description="Monto total en centavos de COP (ej. $290.000 COP -> 29000000)")
    currency: str = Field("COP", description="Moneda de la transacción (por defecto COP)")
    plan_id: Optional[str] = Field(None, description="Identificador del plan: free, pyme, enterprise")
    billing_cycle: Optional[str] = Field("monthly", description="monthly o yearly")
    organization_id: Optional[str] = Field(None, description="ID de la organización compradora")

class IntegritySignatureResponse(BaseModel):
    signature: str = Field(..., description="Hash SHA-256 de integridad para el WidgetCheckout de Wompi")
    reference: str
    amount_in_cents: int
    currency: str
    public_key: str
    environment: str

class WompiConfigResponse(BaseModel):
    public_key: str
    environment: str
    currency: str = "COP"

class SubscriptionDTO(BaseModel):
    organization_id: str
    plan_id: str
    billing_cycle: str
    status: str
    current_period_start: str
    current_period_end: str
    is_active: bool
    payment_method: Optional[str] = None
    cancel_at_period_end: bool = False

class TransactionItemDTO(BaseModel):
    id: Optional[str] = None
    reference: str
    wompi_id: Optional[str] = None
    amount_cop: float
    currency: str
    status: str
    payment_method_type: Optional[str] = None
    plan_id: str
    billing_cycle: str
    created_at: str
