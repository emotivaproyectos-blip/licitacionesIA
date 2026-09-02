"""
Extractor y Auditor Especializado de Certificados RUP (Registro Único de Proponentes - Colombia)
Soporta formatos de Cámaras de Comercio (Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, etc.)
según Decreto 1082 de 2015 y Ley 1150 de 2007.
"""

import os
import re
import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import httpx

class ExtractedRupData(BaseModel):
    company_name: Optional[str] = None
    nit: Optional[str] = None
    chamber_of_commerce: Optional[str] = None
    matricula_rup: Optional[str] = None
    expedition_date: Optional[str] = None
    
    # Capacidad Financiera
    current_assets: float = 0.0
    current_liabilities: float = 0.0
    total_assets: float = 0.0
    total_liabilities: float = 0.0
    patrimony: float = 0.0
    operating_income: float = 0.0
    interest_expense: float = 0.0
    
    # Indicadores Financieros y Organizacionales
    liquidity: float = 0.0
    debt_ratio: float = 0.0
    coverage_ratio: float = 0.0
    roe: Optional[float] = None
    roa: Optional[float] = None
    
    # Experiencia y Clasificaciones
    smmlv_experience: float = 0.0
    contracts_count: int = 0
    unspsc_codes: List[str] = []
    
    # Metadatos de auditoría
    raw_text_length: int = 0
    extracted_with_ai: bool = False
    notes: Optional[str] = None


class RUPExtractorService:
    @classmethod
    def extract_text_from_pdf_bytes(cls, file_bytes: bytes) -> str:
        """Extrae texto ordenado preservando saltos de línea con PyMuPDF (fitz)."""
        full_text = []
        try:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text")
                if text:
                    full_text.append(f"--- PÁGINA {page_num + 1} ---\n" + text)
            doc.close()
        except Exception as e:
            full_text.append(f"[Error PyMuPDF]: {str(e)}")
        
        return "\n".join(full_text)

    @classmethod
    async def extract_rup_data_with_ai(cls, text: str, filename: Optional[str] = None) -> ExtractedRupData:
        """
        Analiza el texto completo de un Certificado RUP colombiano mediante IA
        para extraer únicamente datos 100% reales y fidedignos sin inventar valores.
        """
        gemini_key = os.getenv("GEMINI_API_KEY2") or os.getenv("GEMINI_API_KEY")
        
        # Si no hay clave de Gemini o el texto es muy corto, usar parser heurístico
        if not gemini_key or len(text.strip()) < 50:
            return cls.parse_rup_heuristics(text, filename)

        prompt = f"""
Eres un auditor experto en contratación pública en Colombia y análisis de certificados del Registro Único de Proponentes (RUP) emitidos por Cámaras de Comercio según la Ley 1150 de 2007 y Decreto 1082 de 2015.

Analiza el siguiente texto extraído directamente de un Certificado RUP oficial y extrae los datos reales con máxima precisión.
NO INVENTES NINGÚN DATO. Si un dato no está en el documento, déjalo en 0 o null.

TEXTO DEL CERTIFICADO RUP:
\"\"\"
{text[:25000]}
\"\"\"

NOMBRE DEL ARCHIVO: {filename or 'Certificado_RUP.pdf'}

Devuelve EXCLUSIVAMENTE un objeto JSON válido (sin markdown, sin explicaciones adicionales) con esta estructura exacta:
{{
  "company_name": "Razón Social o Nombre del Proponente (ej: VISION & MARKETING S.A.S.)",
  "nit": "NIT del Proponente con o sin DV (ej: 800.144.934-4)",
  "chamber_of_commerce": "Nombre de la Cámara de Comercio emisora (ej: Cámara de Comercio de Bogotá)",
  "matricula_rup": "Número de inscripción RUP",
  "expedition_date": "Fecha de expedición o renovación si aparece",
  "current_assets": 0, /* Activo Corriente en Pesos Colombianos (COP) numérico puro sin puntos */
  "current_liabilities": 0, /* Pasivo Corriente en Pesos Colombianos (COP) numérico puro */
  "total_assets": 0, /* Activo Total en Pesos Colombianos (COP) numérico puro */
  "total_liabilities": 0, /* Pasivo Total en Pesos Colombianos (COP) numérico puro */
  "patrimony": 0, /* Patrimonio Total en Pesos Colombianos (COP) numérico puro */
  "operating_income": 0, /* Utilidad Operacional en Pesos Colombianos (COP) numérico puro */
  "interest_expense": 0, /* Gastos de Intereses en Pesos Colombianos (COP) numérico puro */
  "liquidity": 0.0, /* Índice de Liquidez (Activo Cte / Pasivo Cte) */
  "debt_ratio": 0.0, /* Nivel de Endeudamiento en porcentaje (ej: 34.4 o 45.0) */
  "coverage_ratio": 0.0, /* Cobertura de Intereses (Utilidad Op / Gastos Intereses) */
  "smmlv_experience": 0.0, /* Sumatoria total de SMMLV acreditada en contratos de experiencia */
  "contracts_count": 0, /* Número de contratos de experiencia registrados */
  "unspsc_codes": ["80101500", "81111500"], /* Lista de códigos UNSPSC de 8 dígitos REALES acreditados en el RUP (segmentos válidos 10-95). Excluye números de folio, cédulas o radicados */
  "notes": "Observaciones breves del estado financiero y experiencia del proponente"
}}
"""

        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                response = await client.post(
                    url,
                    headers={"x-goog-api-key": gemini_key},
                    json=payload
                )
            
            if response.status_code == 200:
                resp_json = response.json()
                parts = resp_json.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                raw_ai_text = "".join(p.get("text", "") for p in parts).strip()
                
                # Limpiar posibles bloques markdown si los hay
                cleaned_json = raw_ai_text
                if cleaned_json.startswith("```json"):
                    cleaned_json = cleaned_json[7:]
                if cleaned_json.startswith("```"):
                    cleaned_json = cleaned_json[3:]
                if cleaned_json.endswith("```"):
                    cleaned_json = cleaned_json[:-3]
                
                parsed_dict = json.loads(cleaned_json.strip())
                
                # Validar y calcular consistencia
                current_assets = float(parsed_dict.get("current_assets") or 0.0)
                current_liabilities = float(parsed_dict.get("current_liabilities") or 0.0)
                total_assets = float(parsed_dict.get("total_assets") or 0.0)
                total_liabilities = float(parsed_dict.get("total_liabilities") or 0.0)
                operating_income = float(parsed_dict.get("operating_income") or 0.0)
                interest_expense = float(parsed_dict.get("interest_expense") or 0.0)
                
                liquidity = float(parsed_dict.get("liquidity") or 0.0)
                if liquidity == 0.0 and current_liabilities > 0:
                    liquidity = round(current_assets / current_liabilities, 2)
                    
                debt_ratio = float(parsed_dict.get("debt_ratio") or 0.0)
                if debt_ratio == 0.0 and total_assets > 0:
                    debt_ratio = round((total_liabilities / total_assets) * 100, 1)
                elif debt_ratio > 0 and debt_ratio <= 1.0: # Si vino en decimal 0.344 -> 34.4%
                    debt_ratio = round(debt_ratio * 100, 1)

                coverage_ratio = float(parsed_dict.get("coverage_ratio") or 0.0)
                if coverage_ratio == 0.0 and interest_expense > 0:
                    coverage_ratio = round(operating_income / interest_expense, 2)

                raw_unspsc = parsed_dict.get("unspsc_codes") or []
                filtered_unspsc = cls._clean_and_filter_unspsc(raw_unspsc, text)

                return ExtractedRupData(
                    company_name=parsed_dict.get("company_name"),
                    nit=parsed_dict.get("nit"),
                    chamber_of_commerce=parsed_dict.get("chamber_of_commerce") or "Cámara de Comercio",
                    matricula_rup=parsed_dict.get("matricula_rup"),
                    expedition_date=parsed_dict.get("expedition_date"),
                    current_assets=current_assets,
                    current_liabilities=current_liabilities,
                    total_assets=total_assets,
                    total_liabilities=total_liabilities,
                    patrimony=float(parsed_dict.get("patrimony") or 0.0),
                    operating_income=operating_income,
                    interest_expense=interest_expense,
                    liquidity=liquidity,
                    debt_ratio=debt_ratio,
                    coverage_ratio=coverage_ratio,
                    smmlv_experience=float(parsed_dict.get("smmlv_experience") or 0.0),
                    contracts_count=int(parsed_dict.get("contracts_count") or 0),
                    unspsc_codes=filtered_unspsc,
                    raw_text_length=len(text),
                    extracted_with_ai=True,
                    notes=parsed_dict.get("notes")
                )
        except Exception as e:
            print(f"[RUPExtractor AI Error]: {str(e)}, aplicando parser heurístico avanzado")

        # Fallback si falla Gemini
        return cls.parse_rup_heuristics(text, filename)

    @classmethod
    def parse_rup_heuristics(cls, text: str, filename: Optional[str] = None) -> ExtractedRupData:
        """Parser heurístico local especializado para certificados RUP colombianos."""
        # 1. NIT
        nit = None
        nit_patterns = [
            r'(?:NIT|N\.I\.T\.|Identificaci[oó]n|Tributaria)[:\s]*([0-9]{2,3}[\.\s]?[0-9]{3}[\.\s]?[0-9]{3}(?:-[0-9kK])?)',
            r'\b([89]\d{2}[\.\s]?\d{3}[\.\s]?\d{3}(?:-\d)?)\b'
        ]
        for pat in nit_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                nit = m.group(1).replace(" ", "").strip()
                break

        # 2. Nombre / Razón Social
        company_name = None
        name_patterns = [
            r'(?:Nombre o Razón Social|Razón Social|Nombre del Proponente|Proponente|Organización)[:\s]+([^\n\r]{4,75})',
            r'\b([A-Z0-9\s.,&áéíóúÁÉÍÓÚÑñ]{4,50}\s+(?:S\.A\.S\.|SAS|LTDA|LIMITADA|S\.A\.|S\.C\.S\.|E\.U\.))\b'
        ]
        for pat in name_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                cand = m.group(1).split('\n')[0]
                cand = re.sub(r'\bNIT\b.*$', '', cand, flags=re.IGNORECASE).strip()
                if "cámara de comercio" not in cand.lower() and len(cand) > 3:
                    company_name = cand
                    break

        if not company_name and filename:
            fn_clean = re.sub(r'\.pdf$', '', filename, flags=re.IGNORECASE)
            fn_clean = re.sub(r'^(?:ficha_rup_|certificado_rup_|rup_)', '', fn_clean, flags=re.IGNORECASE)
            if len(fn_clean) >= 3:
                company_name = fn_clean.replace('_', ' ').upper().replace('SAS', 'S.A.S.').replace('LTDA', 'LTDA.')

        # 3. Cámara de Comercio
        chamber = "Cámara de Comercio"
        ch_m = re.search(r'Cámara de Comercio de\s+([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+?)(?:[\n\r,.\-]|\s{2,})', text, re.IGNORECASE)
        if ch_m:
            chamber = f"Cámara de Comercio de {ch_m.group(1).strip()}"

        # 4. Cifras Financieras
        def extract_number(pattern: str) -> float:
            m = re.search(pattern, text, re.IGNORECASE)
            if not m:
                return 0.0
            val_str = m.group(1)
            # Limpiar formato colombiano: $ 1.250.000.000,00 -> 1250000000
            val_str = re.sub(r'[\$\sCOP%]', '', val_str)
            if '.' in val_str and ',' in val_str:
                val_str = val_str.replace('.', '').replace(',', '.')
            elif val_str.count('.') > 1:
                val_str = val_str.replace('.', '')
            elif ',' in val_str:
                val_str = val_str.replace(',', '.')
            try:
                return float(val_str)
            except:
                return 0.0

        current_assets = extract_number(r'(?:Activo\s+Corriente|Activos\s+Corrientes)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]+)')
        current_liabilities = extract_number(r'(?:Pasivo\s+Corriente|Pasivos\s+Corrientes)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]+)')
        total_assets = extract_number(r'(?:Activo\s+Total|Activos\s+Totales|Total\s+Activo)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]+)')
        total_liabilities = extract_number(r'(?:Pasivo\s+Total|Pasivos\s+Totales|Total\s+Pasivo)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]+)')
        patrimony = extract_number(r'(?:Patrimonio\s+Total|Total\s+Patrimonio|Patrimonio)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]+)')
        operating_income = extract_number(r'(?:Utilidad\s+Operacional|Resultado\s+Operacional)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]+)')
        interest_expense = extract_number(r'(?:Gastos\s+de\s+Intereses?|Gastos\s+Financieros)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]+)')

        # Indicadores explícitos o calculados
        exp_liq = extract_number(r'(?:[IÍ]ndice\s+de\s+Liquidez|Liquidez)[^\d]{0,20}([0-9]+[.,][0-9]+)')
        liquidity = exp_liq if exp_liq > 0 else (round(current_assets / current_liabilities, 2) if current_liabilities > 0 else 0.0)

        exp_debt = extract_number(r'(?:[IÍ]ndice\s+de\s+Endeudamiento|Endeudamiento|Nivel\s+de\s+Endeudamiento)[^\d]{0,20}([0-9]+[.,]?[0-9]*)')
        debt_ratio = exp_debt if exp_debt > 0 else (round((total_liabilities / total_assets) * 100, 1) if total_assets > 0 else 0.0)

        coverage_ratio = round(operating_income / interest_expense, 2) if interest_expense > 0 else 0.0

        # Experiencia en SMMLV
        smmlv_exp = extract_number(r'(?:Total\s+SMMLV|Experiencia\s+en\s+SMMLV|Cuant[ií]a\s+Total\s+en\s+SMMLV|Total\s+Experiencia\s+Acreditada)[^\d]{0,20}([0-9]+(?:[.,][0-9]+)?)')
        if smmlv_exp == 0.0:
            # Sumar cuantías individuales de contratos
            smmlv_matches = re.findall(r'(?:Cuant[ií]a|Valor|SMMLV)[:\s]*([0-9]+(?:[.,][0-9]+)?)\s*SMMLV', text, re.IGNORECASE)
            if smmlv_matches:
                total_s = sum(float(x.replace(',', '.')) for x in smmlv_matches if x.replace(',', '').replace('.', '').isdigit())
                smmlv_exp = round(total_s, 1)

        # Códigos UNSPSC filtrados
        unspsc_codes = cls._extract_unspsc_from_text(text)

        return ExtractedRupData(
            company_name=company_name,
            nit=nit,
            chamber_of_commerce=chamber,
            current_assets=current_assets,
            current_liabilities=current_liabilities,
            total_assets=total_assets,
            total_liabilities=total_liabilities,
            patrimony=patrimony,
            operating_income=operating_income,
            interest_expense=interest_expense,
            liquidity=liquidity,
            debt_ratio=debt_ratio,
            coverage_ratio=coverage_ratio,
            smmlv_experience=smmlv_exp,
            unspsc_codes=unspsc_codes,
            raw_text_length=len(text),
            extracted_with_ai=False
        )

    @staticmethod
    def _clean_and_filter_unspsc(codes: List[Any], context_text: str) -> List[str]:
        """Filtra y valida que los códigos correspondan a la taxonomía real de UNSPSC (segmentos 10-95)."""
        valid_codes = []
        for c in codes:
            c_str = re.sub(r'[^0-9]', '', str(c).strip())
            if len(c_str) == 8:
                seg = int(c_str[:2])
                if 10 <= seg <= 95:
                    if c_str not in valid_codes:
                        valid_codes.append(c_str)
        return valid_codes

    @classmethod
    def _extract_unspsc_from_text(cls, text: str) -> List[str]:
        """Extrae códigos UNSPSC de secciones delimitadas del RUP descartando folios y radicados."""
        found = []
        # Buscar en secciones de clasificación
        sections = re.findall(
            r'(?:CLASIFICACI[ÓO]N|BIENES\s+Y\s+SERVICIOS|C[ÓO]DIGOS\s+UNSPSC|EXPERIENCIA).*?(?:---|\n\n\n|\Z)',
            text,
            re.IGNORECASE | re.DOTALL
        )
        search_text = "\n".join(sections) if sections else text

        raw_candidates = re.findall(r'\b([1-9][0-9]{7})\b', search_text)
        for c in raw_candidates:
            seg = int(c[:2])
            # Segmentos válidos UNSPSC (10..95) y evitar años como 199x, 202x
            if 10 <= seg <= 95 and not c.startswith(('199', '202')):
                if c not in found:
                    found.append(c)

        return found
