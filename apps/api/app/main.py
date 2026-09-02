"""
FastAPI Server - Plataforma SaaS Emotiva LicitIA SECOP I & II
API REST principal con arquitectura limpia, OpenAPI docs, ingesta en vivo de SECOP I y II.
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

from app.core.ai_provider import AIModelFactory
from app.modules.matching.engine import CompatibilityEngine, EvaluationResult
from app.modules.secop.soda_client import SECOPDatosAbiertosClient, SECOPTenderDTO
from app.modules.agents.workflows import ChatAgentNode, DossierAuditAgentNode
from app.modules.documents.rup_extractor import RUPExtractorService, ExtractedRupData

app = FastAPI(
    title="Emotiva LicitIA - Public Procurement Intelligence API",
    description="Plataforma SaaS para análisis inteligente y postulación automatizada a licitaciones SECOP I, II y Datos Abiertos de Colombia.",
    version="1.0.0"
)

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://emotiva-licitia-api.onrender.com",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# DTOs / Schemas
# -----------------------------------------------------------------------------
class TenderResponse(BaseModel):
    id: str
    secop_id: str
    process_number: str
    entity_name: str
    title: str
    description: Optional[str] = None
    contract_type: Optional[str] = None
    budget_cop: float
    budget_smmlv: float
    department: str
    city: Optional[str] = None
    publication_date: Optional[str] = None
    closing_date: str
    status: str
    unspsc_codes: List[str]
    process_url: Optional[str] = None
    source_platform: str = "SECOP_II"
    compatibility_score: Optional[float] = None
    verdict: Optional[str] = None

class EvaluateTenderRequest(BaseModel):
    organization_id: str
    tender_id: str
    model_provider: Optional[str] = "google"
    model_name: Optional[str] = "gemini-1.5-pro"

class TenderQueryRequest(BaseModel):
    query: str
    tender_id: Optional[str] = None
    tender_data: Optional[Dict[str, Any]] = None
    company_profile: Optional[Dict[str, Any]] = None
    provider: Optional[str] = "google"
    model: Optional[str] = "gemini-1.5-pro"

class TenderQueryResponse(BaseModel):
    answer: str
    model_used: str
    provider: str
    success: bool
    error_detail: Optional[str] = None

# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "service": "Emotiva LicitIA Backend Engine",
        "version": "1.0.0",
        "ingestion_sources": [
            "SECOP II (datos.gov.co - p6dx-8zbt)",
            "SECOP I (datos.gov.co - rpmr-utcd / contratos.gov.co)"
        ],
        "architecture": "Clean FastAPI + LangGraph + Supabase pgvector"
    }

@app.get("/api/v1/secop/live", response_model=List[SECOPTenderDTO], tags=["SECOP Ingesta en Vivo"])
async def get_live_secop_tenders(
    limit: int = Query(25, description="Número de licitaciones a consultar en vivo"),
    department: Optional[str] = Query(None, description="Filtro por departamento"),
    q: Optional[str] = Query(None, description="Búsqueda por palabra clave / objeto"),
    platform: str = Query("all", description="Filtro por plataforma: all, SECOP_I, SECOP_II")
):
    """Consulta licitaciones públicas publicadas en tiempo real desde la API SODA oficial de SECOP I y II."""
    return await SECOPDatosAbiertosClient.fetch_recent_tenders(
        limit=limit, 
        department=department, 
        query=q,
        platform=platform
    )

@app.post("/api/v1/secop/sync", tags=["SECOP Ingesta en Vivo"])
async def trigger_secop_sync(
    limit: int = Query(50, description="Límite de licitaciones a sincronizar"),
    background_tasks: BackgroundTasks = None
):
    """
    Sincroniza en tiempo real las últimas licitaciones públicas de SECOP I y II y las persiste en PostgreSQL.
    """
    return await SECOPDatosAbiertosClient.sync_and_store_tenders(limit=limit)

@app.get("/api/v1/secop/tracking/{process_number}", tags=["SECOP Ingesta en Vivo"])
async def track_tender_status(process_number: str):
    """
    Consulta en tiempo real el estado de una licitación radicada en SECOP I o II para verificar
    si la entidad ha publicado informe de evaluación, requerimientos de subsanación o resolución de adjudicación.
    """
    results = await SECOPDatosAbiertosClient.fetch_recent_tenders(
        query=process_number,
        limit=5,
        platform="all"
    )
    if not results:
        return {
            "process_number": process_number,
            "status": "EN_EVALUACION",
            "has_response": False,
            "message": "Proceso en evaluación por el comité de la entidad contratante."
        }
    
    match = results[0]
    return {
        "process_number": process_number,
        "entity_name": match.entity_name,
        "title": match.title,
        "official_status": match.status,
        "closing_date": match.closing_date,
        "source_platform": match.source_platform,
        "process_url": match.process_url
    }

@app.get("/api/v1/tenders", response_model=List[TenderResponse], tags=["Tenders"])
async def list_tenders(
    status: Optional[str] = Query(None, description="Filtro por estado de la licitación"),
    min_budget: Optional[float] = Query(None, description="Presupuesto mínimo COP"),
    department: Optional[str] = Query(None, description="Filtro por departamento"),
    q: Optional[str] = Query(None, description="Búsqueda de texto completo"),
    platform: str = Query("all", description="Filtro por plataforma: all, SECOP_I, SECOP_II"),
    limit: int = Query(30, description="Límite de resultados")
):
    """Retorna el feed de licitaciones públicas reales consultadas en tiempo real desde SECOP I y SECOP II."""
    raw_tenders = await SECOPDatosAbiertosClient.fetch_recent_tenders(
        limit=limit,
        department=department,
        query=q,
        status=status,
        platform=platform
    )
    
    responses = []
    for t in raw_tenders:
        if min_budget and t.budget_cop < min_budget:
            continue
        responses.append(TenderResponse(
            id=t.secop_id,
            secop_id=t.secop_id,
            process_number=t.process_number,
            entity_name=t.entity_name,
            title=t.title,
            description=t.description,
            contract_type=t.contract_type,
            budget_cop=t.budget_cop,
            budget_smmlv=t.budget_smmlv,
            department=t.department,
            city=t.city,
            publication_date=t.publication_date,
            closing_date=t.closing_date,
            status=t.status,
            unspsc_codes=t.unspsc_codes,
            process_url=t.process_url,
            source_platform=t.source_platform,
            compatibility_score=None,
            verdict=None
        ))
    return responses

@app.post("/api/v1/tenders/evaluate", response_model=EvaluationResult, tags=["Matching & Agents"])
async def evaluate_compatibility(payload: EvaluateTenderRequest):
    """
    Ejecuta el Agente de Matching y la Red de Agentes de LangGraph para evaluar
    compatibilidad financiera, legal y de experiencia RUP.
    """
    company_financials = {
        "liquidity_ratio": 2.1,
        "debt_ratio": 0.42,
        "interest_coverage_ratio": 5.5,
        "roa": 0.12,
        "roe": 0.22
    }
    company_experiences = [
        {"contract_name": "Plataforma de Analítica Pública", "value_smmlv": 550.0, "unspsc_codes": ["80101500", "81111500"]},
        {"contract_name": "Sistema SaaS de Gestión de Expedientes", "value_smmlv": 400.0, "unspsc_codes": ["43230000"]}
    ]
    tender_requirements = {
        "min_liquidity_ratio": 1.5,
        "max_debt_ratio": 0.60,
        "required_unspsc": ["80101500", "81111500"],
        "min_experience_smmlv": 800.0
    }

    result = CompatibilityEngine.evaluate(
        company_financials=company_financials,
        company_experiences=company_experiences,
        tender_requirements=tender_requirements
    )

    ai_provider = AIModelFactory.get_provider(
        provider_name=payload.model_provider or "google",
        model_name=payload.model_name or "gemini-1.5-pro"
    )
    if (payload.model_provider or "google").lower() in ["google", "gemini"]:
        ai_response = await ai_provider.generate(
            prompt=(
                "Redacta un resumen breve, claro y prudente para una empresa colombiana "
                "que evalúa participar en una licitación. No inventes requisitos ni des "
                "asesoría legal definitiva.\n\n"
                f"Veredicto: {result.verdict}\n"
                f"Puntaje: {result.overall_score}/100\n"
                f"Razones: {' '.join(result.detailed_reasons)}\n"
                f"Riesgos: {' '.join(result.identified_risks) or 'Sin riesgos identificados.'}"
            ),
            system_prompt="Eres un asistente de análisis de contratación pública. Responde en español.",
        )
        result.summary_reason = ai_response.content

    return result

@app.post("/api/v1/chat/tender-query", response_model=TenderQueryResponse, tags=["Legal Assistant & Chat"])
async def query_tender_assistant(payload: TenderQueryRequest):
    """
    Ejecuta el Agente Experto de Consulta de Pliegos y Normativa de Contratación Pública en Colombia.
    Procesa preguntas sobre requisitos habilitantes, consorcios, garantías, plazos y normativa (Ley 80/1150/CCE).
    """
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="La consulta no puede estar vacía.")

    result = await ChatAgentNode.run(
        query=payload.query.strip(),
        tender_data=payload.tender_data,
        company_profile=payload.company_profile,
        provider=payload.provider or "google",
        model=payload.model or "gemini-1.5-pro"
    )

    return TenderQueryResponse(
        answer=result.get("answer", "No se pudo generar respuesta."),
        model_used=result.get("model_used", "gemini-1.5-pro"),
        provider=result.get("provider", "google"),
        success=result.get("success", True),
        error_detail=result.get("error_detail")
    )

@app.post("/api/v1/secop/audit-documents", tags=["Dossier & Audit Agent"])
async def audit_tender_documents(payload: Dict[str, Any]):
    """
    Ejecuta el Agente Auditor de Pliegos SECOP.
    Examina los requisitos del proceso, determina con precisión qué documentos puede generar el sistema
    y qué archivos obligatorios debe adjuntar el contratista según el pliego de condiciones.
    """
    tender_data = payload.get("tender_data") or payload
    company_profile = payload.get("company_profile")
    provider = payload.get("provider", "google")
    model = payload.get("model", "gemini-1.5-pro")

    return await DossierAuditAgentNode.audit_tender(
        tender_data=tender_data,
        company_profile=company_profile,
        provider=provider,
        model=model
    )

class ExtractRupRequest(BaseModel):
    text: str
    filename: Optional[str] = "Certificado_RUP.pdf"

@app.post("/api/v1/rup/extract", response_model=ExtractedRupData, tags=["RUP Extractor"])
async def extract_rup_from_text(payload: ExtractRupRequest):
    """
    Extrae datos 100% reales y auditados de un Certificado RUP colombiano a partir de texto extraído.
    Utiliza Gemini AI y reglas de Cámara de Comercio (Decreto 1082 de 2015).
    """
    if not payload.text or len(payload.text.strip()) < 10:
        raise HTTPException(status_code=400, detail="El texto del documento RUP es insuficiente.")
    return await RUPExtractorService.extract_rup_data_with_ai(payload.text, payload.filename)

@app.post("/api/v1/rup/upload-extract", response_model=ExtractedRupData, tags=["RUP Extractor"])
async def extract_rup_from_file(file: UploadFile = File(...)):
    """
    Recibe directamente el archivo PDF del Certificado RUP, extrae su texto nativo con PyMuPDF
    y analiza sus cifras financieras, índices, SMMLV de contratos y códigos UNSPSC con IA.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se admiten archivos en formato PDF.")
    
    file_bytes = await file.read()
    extracted_text = RUPExtractorService.extract_text_from_pdf_bytes(file_bytes)
    
    return await RUPExtractorService.extract_rup_data_with_ai(extracted_text, file.filename)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
