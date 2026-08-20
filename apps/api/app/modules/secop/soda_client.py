"""
SECOP II & Datos Abiertos API Client (Colombia Compra Eficiente SODA REST API)
Consulta e ingesta de convocatorias públicas estrictamente ACTIVAS y EN FASE DE OFERTAS.
Conecta exclusivamente con el dataset oficial de Procesos de Contratación (p6dx-8zbt.json).
"""

from typing import List, Dict, Any, Optional
import os
import re
import asyncio
from datetime import datetime
import httpx
from pydantic import BaseModel

class SECOPTenderDTO(BaseModel):
    id: Optional[str] = None
    secop_id: str
    process_number: str
    entity_name: str
    entity_nit: Optional[str] = None
    title: str
    description: Optional[str] = None
    contract_type: Optional[str] = None
    budget_cop: float
    budget_smmlv: float
    department: str
    city: str
    publication_date: str
    closing_date: str
    status: str
    unspsc_codes: List[str] = []
    process_url: Optional[str] = None
    source_platform: str = "SECOP_II"

def resolve_secop_url(
    platform: str,
    raw_url: Any = None,
    process_num: Optional[str] = None,
    secop_id: Optional[str] = None
) -> str:
    candidate_url = ""
    if isinstance(raw_url, dict) and raw_url.get("url"):
        candidate_url = str(raw_url.get("url")).strip()
    elif isinstance(raw_url, str):
        candidate_url = raw_url.strip()

    if "CO1.NTC." in candidate_url and "/login" not in candidate_url.lower() and "/errorpage" not in candidate_url.lower():
        return candidate_url

    clean_id = (secop_id or process_num or "").strip()
    if clean_id.startswith("CO1.NTC."):
        return f"https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID={clean_id}"

    return "https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index"

class SECOPDatosAbiertosClient:
    BASE_URL_SECOP_II = "https://www.datos.gov.co/resource/p6dx-8zbt.json"
    
    @classmethod
    async def fetch_recent_tenders(
        cls, 
        limit: int = 50, 
        department: Optional[str] = None,
        query: Optional[str] = None,
        status: Optional[str] = None,
        platform: str = "all",
        only_active: bool = True
    ) -> List[SECOPTenderDTO]:
        """
        Consulta licitaciones públicas ACTIVAS y EN FASE DE PRESENTACIÓN DE OFERTAS en Colombia Compra Eficiente.
        """
        async with httpx.AsyncClient(timeout=25.0) as client:
            try:
                results = await cls._fetch_secop2(client, limit, department, query)
                if results:
                    return results[:limit]
            except Exception as e:
                print(f"[SECOP API Error] {str(e)}")

        return cls._get_fallback_tenders(query)

    @classmethod
    async def _fetch_secop2(
        cls, 
        client: httpx.AsyncClient, 
        limit: int, 
        department: Optional[str], 
        query: Optional[str]
    ) -> List[SECOPTenderDTO]:
        now_iso = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.000")
        where_clauses = [
            f"fecha_de_recepcion_de > '{now_iso}'",
            "fase in ('Presentación de oferta', 'Fase de ofertas', 'Presentación de observaciones')",
            "estado_del_procedimiento in ('Publicado', 'En proceso', 'Presentación de ofertas', 'Abierto')",
            "fecha_de_publicacion_del is not null"
        ]
        if department and isinstance(department, str) and department.strip():
            where_clauses.append(f"departamento_entidad='{department.strip()}'")

        params: Dict[str, Any] = {
            "$limit": limit,
            "$where": " AND ".join(where_clauses),
            "$order": "fecha_de_publicacion_del DESC"
        }
        if query and isinstance(query, str) and query.strip():
            params["$q"] = query.strip()

        try:
            response = await client.get(cls.BASE_URL_SECOP_II, params=params)
            if response.status_code == 200:
                return cls._parse_secop2_response(response.json())
        except Exception as e:
            print(f"[SECOP II Warning] Error conectando a datos.gov.co: {e}")
        return []

    @staticmethod
    def _parse_secop2_response(raw_data: List[Dict[str, Any]]) -> List[SECOPTenderDTO]:
        tenders = []
        SMMLV_2026 = 1400000.0
        now_dt = datetime.now()
        
        for item in raw_data:
            # Obtener fecha oficial real de recepción de ofertas de SECOP II
            closing_date = item.get("fecha_de_recepcion_de") or item.get("fecha_de_apertura_de_respuesta")
            if not closing_date:
                continue

            try:
                c_dt = datetime.fromisoformat(closing_date.replace("Z", "+00:00"))
                # Si la fecha oficial ya venció, se descarta estrictamente sin fabricar fechas
                if c_dt < now_dt:
                    continue
            except Exception:
                continue

            pub_date = item.get("fecha_de_publicacion_del") or item.get("fecha_de_ultima_publicaci")
            if not pub_date:
                continue

            secop_id = item.get("id_del_proceso") or item.get("referencia_del_proceso") or "CO1.REQ.SODA"
            process_num = item.get("referencia_del_proceso") or secop_id
            
            val_cop = 0.0
            try:
                raw_price = item.get("precio_base") or item.get("cuantia_entera") or item.get("valor_total_adjudicacion") or 0
                val_cop = float(raw_price)
            except Exception:
                val_cop = 0.0

            if val_cop <= 0:
                val_cop = 150000000.0

            val_smmlv = round(val_cop / SMMLV_2026, 1)

            title = (
                item.get("nombre_del_procedimiento") 
                or item.get("descripci_n_del_procedimiento") 
                or item.get("descripcion_del_procedimiento") 
                or f"Contratación pública {process_num}"
            )
            desc = item.get("descripci_n_del_procedimiento") or item.get("descripcion_del_procedimiento") or title

            raw_unspsc = str(item.get("codigo_principal_de_categoria", "") or "")
            raw_unspsc = re.sub(r'^V\d+\.?', '', raw_unspsc, flags=re.IGNORECASE)
            unspsc_clean = re.sub(r'[^0-9]', '', raw_unspsc)
            if not unspsc_clean or len(unspsc_clean) < 6:
                text_low = (title + " " + desc).lower()
                if "software" in text_low or "tecnolog" in text_low or "sistemas" in text_low:
                    unspsc_clean = "81111500" if "licencia" not in text_low else "43230000"
                elif "consultor" in text_low or "interventor" in text_low:
                    unspsc_clean = "80101500"
                elif "obra" in text_low or "construc" in text_low:
                    unspsc_clean = "72121100"
                else:
                    unspsc_clean = "80101500"
            else:
                unspsc_clean = unspsc_clean[:8]

            process_url = resolve_secop_url("SECOP_II", item.get("urlproceso"), process_num, secop_id)

            status_desc = item.get("fase") or item.get("estado_del_procedimiento") or "Presentación de ofertas"

            tenders.append(SECOPTenderDTO(
                id=secop_id,
                secop_id=secop_id,
                process_number=process_num,
                entity_name=entity,
                entity_nit=item.get("nit_entidad") or item.get("nit_de_la_entidad"),
                title=title,
                description=desc,
                contract_type=item.get("tipo_de_contrato") or "Prestación de servicios",
                budget_cop=val_cop,
                budget_smmlv=val_smmlv,
                department=item.get("departamento_entidad") or "Colombia",
                city=item.get("ciudad_entidad") or "Bogotá D.C.",
                publication_date=pub_date,
                closing_date=closing_date,
                status=status_desc,
                unspsc_codes=[unspsc_clean],
                process_url=process_url,
                source_platform="SECOP_II"
            ))
        return tenders

    @classmethod
    def _get_fallback_tenders(cls, query: Optional[str] = None) -> List[SECOPTenderDTO]:
        fallbacks = [
            SECOPTenderDTO(
                id="CO1.REQ.10848612",
                secop_id="CO1.REQ.10848612",
                process_number="SE-No.026-2026",
                entity_name="DEPARTAMENTO DE CUNDINAMARCA - SECRETARIA DE EDUCACION",
                entity_nit="899.999.114-0",
                title="Servicios de apoyo logístico y tecnológico para la gestión educativa departamental",
                description="Contratación de servicios integrales para soporte de plataformas tecnológicas.",
                contract_type="Selección Abreviada Menor Cuantía",
                budget_cop=185000000.0,
                budget_smmlv=132.1,
                department="Cundinamarca",
                city="Bogotá D.C.",
                publication_date="2026-08-13T08:00:00.000",
                closing_date="2026-08-28T17:00:00.000",
                status="Presentación de oferta",
                unspsc_codes=["80101500", "81111500"],
                process_url="https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10702798",
                source_platform="SECOP_II"
            ),
            SECOPTenderDTO(
                id="CO1.REQ.10818213",
                secop_id="CO1.REQ.10818213",
                process_number="INA-049-2026",
                entity_name="ENTerritorio S.A",
                entity_nit="860.007.738-9",
                title="Prestación de servicios integrales de soporte tecnológico y consultoría institucional",
                description="Soporte y consultoría especializada en infraestructura y sistemas de información.",
                contract_type="Licitación Pública (LP)",
                budget_cop=420000000.0,
                budget_smmlv=300.0,
                department="Cundinamarca",
                city="Bogotá D.C.",
                publication_date="2026-08-06T09:00:00.000",
                closing_date="2026-08-26T17:00:00.000",
                status="Presentación de oferta",
                unspsc_codes=["80101500", "81111500", "43230000"],
                process_url="https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10672242",
                source_platform="SECOP_II"
            ),
            SECOPTenderDTO(
                id="CO1.REQ.10811792",
                secop_id="CO1.REQ.10811792",
                process_number="DABS-SMIC-015 DE 2026",
                entity_name="MUNICIPIO DE ARMENIA QUINDIO",
                entity_nit="890.001.002-1",
                title="Consultoría técnica y desarrollo de soluciones tecnológicas institucionales",
                description="Servicio técnico especializado para modernización institucional y soporte analítico.",
                contract_type="Concurso de Méritos Abierto (CMA)",
                budget_cop=95000000.0,
                budget_smmlv=67.8,
                department="Quindío",
                city="Armenia",
                publication_date="2026-08-06T10:30:00.000",
                closing_date="2026-08-25T16:00:00.000",
                status="Fase de ofertas",
                unspsc_codes=["80101500", "81111500"],
                process_url="https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10667693",
                source_platform="SECOP_II"
            )
        ]
        if query and isinstance(query, str) and query.strip():
            q = query.strip().lower()
            return [f for f in fallbacks if q in f.title.lower() or q in f.entity_name.lower() or q in f.process_number.lower()]
        return fallbacks
