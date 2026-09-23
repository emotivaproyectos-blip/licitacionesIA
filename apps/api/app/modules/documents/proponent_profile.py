"""
Módulo de Gestión de Perfil de Proponente para Mínima Cuantía y Ruta sin RUP - LicitIA
Generación de plantilla DOCX editable oficial, extracción estructurada desde DOCX y PDF,
validación de integridad de datos y autorización en servidor según Ley 1150 de 2007 y Decreto 1082 de 2015.
"""

import io
import re
import os
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

# Imports seguros de python-docx
try:
    import docx
    from docx.shared import Pt, Inches, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
    from docx.oxml import OxmlElement, parse_xml
    from docx.oxml.ns import nsdecls, qn
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

TEMPLATE_VERSION = "v1.0-2026"
LEGAL_DISCLAIMER = (
    "Formato interno de LicitIA para construir el perfil del proponente. "
    "No acredita por sí solo el cumplimiento de los requisitos de una convocatoria "
    "ni sustituye los documentos exigidos por la entidad contratante conforme a la Ley 1150 de 2007 "
    "y el Decreto 1082 de 2015."
)


# -----------------------------------------------------------------------------
# DTOs / Schemas Pydantic
# -----------------------------------------------------------------------------

class ProponentProfileData(BaseModel):
    # Sección A: Datos Básicos Necesarios
    proponent_type: str = Field("persona_juridica", description="persona_natural o persona_juridica")
    name: str = Field(..., description="Nombre completo o Razón social")
    id_type: str = Field("NIT", description="CC, CE, NIT, Pasaporte")
    id_number: str = Field(..., description="Número de identificación")
    nit: Optional[str] = None
    dv: Optional[str] = None
    legal_representative: Optional[str] = None
    contact_email: str
    department: str = "Cundinamarca"
    city: str = "Bogotá D.C."
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    declared_activity: str = ""
    offered_goods_services: Optional[str] = ""
    target_sectors: List[str] = []
    geographic_coverage: List[str] = []
    technical_capacities: Optional[str] = None
    keywords: List[str] = []
    
    # Declaraciones y Confirmaciones de Sección A
    fill_date: Optional[str] = None
    filled_by: Optional[str] = None
    has_veracity_confirmation: bool = False
    has_privacy_acceptance: bool = False

    # Sección B: Datos Complementarios
    ciiu_codes: List[str] = []
    unspsc_codes: List[str] = []
    portfolio_url: Optional[str] = None
    budget_range: Optional[str] = None
    experiences: List[Dict[str, Any]] = []  # Lista de contratos o 'Sin experiencia previa'
    has_prior_experience: bool = True
    equipment_and_staff: Optional[str] = None
    has_secop_account: bool = False
    business_condition: str = "mipyme"

    # Sección C: Soportes Condicionales
    supports_declared: List[str] = []  # Documentos que el proponente declara poseer


class ProponentProfileExtractionResult(BaseModel):
    success: bool
    data: Optional[ProponentProfileData] = None
    completeness_score: int = 0
    missing_fields: List[str] = []
    inconsistencies: List[str] = []
    provenance: Dict[str, Any] = {}
    is_valid_for_activation: bool = False
    message: str = ""


class ConfirmProfileRequest(BaseModel):
    profile_data: ProponentProfileData
    file_token: Optional[str] = None
    confirmed_by_user: bool = True


# -----------------------------------------------------------------------------
# Generador de Plantilla DOCX Oficial
# -----------------------------------------------------------------------------

def set_cell_background(cell, fill_hex: str):
    """Aplica color de fondo hexadecimal a una celda de tabla en Word."""
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)


def create_proponent_docx_template(
    proponent_type: str = "persona_juridica",
    initial_data: Optional[Dict[str, Any]] = None
) -> io.BytesIO:
    """
    Genera en memoria un documento DOCX editable oficial y estilizado de la
    'Ficha del proponente para mínima cuantía — LicitIA'.
    Incluye las secciones visuales A, B y C con etiquetas estables para su posterior extracción.
    """
    if not DOCX_AVAILABLE:
        raise RuntimeError("La librería python-docx no se encuentra disponible.")

    data = initial_data or {}
    doc = docx.Document()

    # Configuración de márgenes
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Estilos de encabezado
    p_header = doc.add_paragraph()
    p_header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run_ver = p_header.add_run(f"LicitIA — Versión {TEMPLATE_VERSION} | Mínima Cuantía SECOP II")
    run_ver.font.size = Pt(8.5)
    run_ver.font.color.rgb = RGBColor(100, 116, 139)

    # Título Principal
    p_title = doc.add_paragraph()
    run_title = p_title.add_run("FICHA DEL PROPONENTE PARA MÍNIMA CUANTÍA — LICITIA")
    run_title.font.size = Pt(16)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(30, 58, 138)  # Azul institucional
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Subtítulo y tipo de proponente
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tipo_texto = "PERSONA JURÍDICA (EMPRESA / SOCIEDAD)" if proponent_type == "persona_juridica" else "PERSONA NATURAL"
    run_sub = p_sub.add_run(f"FORMATO OFICIAL DE INCORPORACIÓN: {tipo_texto}")
    run_sub.font.size = Pt(10)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(71, 85, 105)

    # AVISO NORMATIVO OBLIGATORIO
    p_box = doc.add_paragraph()
    run_warn = p_box.add_run("NOTA DE ALCANCE JURÍDICO Y VERIFICACIÓN:\n")
    run_warn.bold = True
    run_warn.font.size = Pt(8.5)
    run_warn.font.color.rgb = RGBColor(146, 64, 14)
    run_disc = p_box.add_run(LEGAL_DISCLAIMER)
    run_disc.font.size = Pt(8.5)
    run_disc.font.italic = True
    run_disc.font.color.rgb = RGBColor(146, 64, 14)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # =========================================================================
    # SECCIÓN A: DATOS NECESARIOS PARA CREAR EL PERFIL EN LICITIA
    # =========================================================================
    p_sec_a = doc.add_paragraph()
    run_sec_a = p_sec_a.add_run("SECCIÓN A: DATOS BÁSICOS PARA EL PERFIL (OBLIGATORIOS)")
    run_sec_a.font.size = Pt(11)
    run_sec_a.font.bold = True
    run_sec_a.font.color.rgb = RGBColor(30, 58, 138)

    desc_a = doc.add_paragraph()
    desc_a.add_run("Estos datos son indispensables para estructurar tu perfil proponente en la plataforma y activar el radar de mínima cuantía.").font.size = Pt(8.5)

    table_a = doc.add_table(rows=8, cols=2)
    table_a.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_a.autofit = False

    labels_a = [
        ("Tipo de Proponente [TIPO_PROPONENTE]:", tipo_texto),
        ("Nombre Completo o Razón Social [NOMBRE_PROPONENTE]:", data.get("name", "Mi Empresa S.A.S.")),
        ("Tipo y Número de Identificación [NUMERO_IDENTIFICACION]:", f"{data.get('id_type', 'NIT')} {data.get('nit', '900.000.000-1')}"),
        ("Representante Legal (si aplica) [REPRESENTANTE_LEGAL]:", data.get("legal_representative", "Nombre y Apellidos del Rep. Legal")),
        ("Correo Electrónico de Contacto [CORREO_CONTACTO]:", data.get("contact_email", data.get("email", "contacto@empresa.co"))),
        ("Ubicación [DEPARTAMENTO_MUNICIPIO]:", f"{data.get('department', 'Cundinamarca')} - {data.get('city', 'Bogotá D.C.')}"),
        ("Descripción de Actividad y Oferta [ACTIVIDAD_OFERTA]:", data.get("declared_activity", "Prestación de servicios profesionales, consultoría y suministro de bienes.")),
        ("Palabras Clave de Búsqueda [PALABRAS_CLAVE]:", ", ".join(data.get("keywords", ["servicios", "tecnologia", "consultoria"])))
    ]

    for idx, (label, val) in enumerate(labels_a):
        row = table_a.rows[idx]
        cell_lbl = row.cells[0]
        cell_val = row.cells[1]
        
        cell_lbl.width = Inches(3.0)
        cell_val.width = Inches(4.0)
        
        p_lbl = cell_lbl.paragraphs[0]
        r_lbl = p_lbl.add_run(label)
        r_lbl.font.size = Pt(8.5)
        r_lbl.font.bold = True
        set_cell_background(cell_lbl, "F1F5F9")

        p_val = cell_val.paragraphs[0]
        r_val = p_val.add_run(str(val))
        r_val.font.size = Pt(8.5)
        r_val.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Declaración de Veracidad
    p_decl = doc.add_paragraph()
    r_decl_title = p_decl.add_run("DECLARACIÓN DE VERACIDAD Y PRIVACIDAD [CONFIRMACION_VERACIDAD]:\n")
    r_decl_title.font.bold = True
    r_decl_title.font.size = Pt(9)
    r_decl_body = p_decl.add_run(
        "[X] Declaro bajo la gravedad de juramento que la información suministrada en esta ficha es verídica, "
        "comprobable y corresponde a la realidad de mis capacidades técnicas y comerciales. "
        "Autorizo el tratamiento de datos para la personalización de oportunidades según la política de LicitIA."
    )
    r_decl_body.font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # =========================================================================
    # SECCIÓN B: DATOS COMPLEMENTARIOS
    # =========================================================================
    p_sec_b = doc.add_paragraph()
    run_sec_b = p_sec_b.add_run("SECCIÓN B: DATOS COMPLEMENTARIOS (OPCIONALES PARA MEJOR MATCH)")
    run_sec_b.font.size = Pt(11)
    run_sec_b.font.bold = True
    run_sec_b.font.color.rgb = RGBColor(30, 58, 138)

    desc_b = doc.add_paragraph()
    desc_b.add_run(
        "No es obligatorio tener contratos previos ni conocer los códigos UNSPSC. "
        "Si no tienes experiencia previa, puedes dejarlo como 'Sin experiencia previa'."
    ).font.size = Pt(8.5)

    table_b = doc.add_table(rows=6, cols=2)
    table_b.alignment = WD_TABLE_ALIGNMENT.CENTER

    labels_b = [
        ("Códigos UNSPSC o CIIU conocidos [CODIGOS_UNSPSC]:", "80101500, 81111500 (O indicar 'No conozco el código')"),
        ("Rango de Presupuesto de Interés [RANGO_PRESUPUESTO]:", "Hasta 50 SMMLV (O el rango estimado deseado)"),
        ("Experiencia Relacionada [EXPERIENCIA_RELACIONADA]:", "Cliente: Alcaldía Municipal / Objeto: Consultoría / Valor: $20.000.000 / (O 'Sin experiencia previa')"),
        ("Equipos, Personal y Capacidades [EQUIPOS_PERSONAL]:", "Equipo de cómputo, personal técnico disponible, licencias de software."),
        ("¿Cuenta con usuario proveedor en SECOP II? [CUENTA_SECOP]:", "Sí (No ingresar claves ni credenciales aquí)"),
        ("Condición Empresarial Declarada [CONDICION_EMPRESARIAL]:", "Mipyme / Microempresa / Emprendimiento local")
    ]

    for idx, (label, val) in enumerate(labels_b):
        row = table_b.rows[idx]
        cell_lbl = row.cells[0]
        cell_val = row.cells[1]
        
        cell_lbl.width = Inches(3.0)
        cell_val.width = Inches(4.0)
        
        p_lbl = cell_lbl.paragraphs[0]
        r_lbl = p_lbl.add_run(label)
        r_lbl.font.size = Pt(8.5)
        r_lbl.font.bold = True
        set_cell_background(cell_lbl, "F8FAFC")

        p_val = cell_val.paragraphs[0]
        r_val = p_val.add_run(str(val))
        r_val.font.size = Pt(8.5)
        r_val.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # =========================================================================
    # SECCIÓN C: SOPORTES CONDICIONALES
    # =========================================================================
    p_sec_c = doc.add_paragraph()
    run_sec_c = p_sec_c.add_run("SECCIÓN C: SOPORTES Y DOCUMENTOS CONDICIONALES")
    run_sec_c.font.size = Pt(11)
    run_sec_c.font.bold = True
    run_sec_c.font.color.rgb = RGBColor(30, 58, 138)

    desc_c = doc.add_paragraph()
    desc_c.add_run(
        "Indica qué soportes documentales tienes listos para adjuntar cuando una convocatoria específica los solicite. "
        "Ninguno de estos documentos es obligatorio para activar tu cuenta en LicitIA."
    ).font.size = Pt(8.5)

    p_checks = doc.add_paragraph()
    p_checks.add_run("[X] Registro Único Tributario (RUT) actualizado [SOPORTE_RUT]\n").font.size = Pt(8.5)
    if proponent_type == "persona_juridica":
        p_checks.add_run("[X] Certificado de Existencia y Representación Legal (Cámara de Comercio) [SOPORTE_CAMARA]\n").font.size = Pt(8.5)
    else:
        p_checks.add_run("[X] Cédula de Ciudadanía del Proponente [SOPORTE_CEDULA]\n").font.size = Pt(8.5)
    p_checks.add_run("[X] Certificado de Pago de Seguridad Social y Parafiscales [SOPORTE_PARAFISCALES]\n").font.size = Pt(8.5)
    p_checks.add_run("[ ] Certificaciones de contratos y experiencia previa [SOPORTE_EXPERIENCIA]\n").font.size = Pt(8.5)
    p_checks.add_run("[ ] Certificaciones técnicas o autorizaciones de fabricante [SOPORTE_TECNICO]").font.size = Pt(8.5)

    doc_io = io.BytesIO()
    doc.save(doc_io)
    doc_io.seek(0)
    return doc_io


# -----------------------------------------------------------------------------
# Servicio de Extracción Documental Especializado (DOCX y PDF)
# -----------------------------------------------------------------------------

class ProponentProfileExtractorService:
    @classmethod
    def extract_text_from_pdf_bytes(cls, file_bytes: bytes) -> str:
        """Extrae texto plano desde PDF usando PyMuPDF si está instalado."""
        try:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            lines = []
            for i in range(len(doc)):
                page = doc[i]
                t = page.get_text("text")
                if t:
                    lines.append(t)
            doc.close()
            return "\n".join(lines)
        except Exception:
            return file_bytes.decode("utf-8", errors="ignore")

    @classmethod
    def extract_from_docx_bytes(cls, file_bytes: bytes) -> Dict[str, str]:
        """Extrae pares clave/valor y texto estructurado desde un archivo DOCX."""
        extracted_pairs: Dict[str, str] = {}
        if not DOCX_AVAILABLE:
            return extracted_pairs

        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            for table in doc.tables:
                for row in table.rows:
                    if len(row.cells) >= 2:
                        key_raw = row.cells[0].text.strip()
                        val_raw = row.cells[1].text.strip()
                        # Buscar tag estable entre corchetes [TAG]
                        tag_match = re.search(r"\[([A-Z0-9_]+)\]", key_raw)
                        if tag_match:
                            tag = tag_match.group(1)
                            extracted_pairs[tag] = val_raw
                        else:
                            extracted_pairs[key_raw] = val_raw

            # Extraer también texto de párrafos por si hay tags
            full_text = "\n".join([p.text for p in doc.paragraphs])
            if "[CONFIRMACION_VERACIDAD]" in full_text or "Declaro bajo la gravedad de juramento" in full_text:
                extracted_pairs["CONFIRMACION_VERACIDAD"] = "SI"

            # Revisión de soportes
            for sup in ["RUT", "CAMARA", "CEDULA", "PARAFISCALES", "EXPERIENCIA", "TECNICO"]:
                if f"[SOPORTE_{sup}]" in full_text and f"[X]" in full_text:
                    extracted_pairs[f"SOPORTE_{sup}"] = "SI"

        except Exception as e:
            print(f"[DOCX Extraction Warning] Error leyendo tablas: {e}")

        return extracted_pairs

    @classmethod
    def parse_profile_data(
        cls,
        extracted_kv: Dict[str, str],
        raw_text: str = "",
        filename: str = "Ficha_Proponente.docx"
    ) -> ProponentProfileExtractionResult:
        """
        Interpreta los pares clave-valor extraídos o el texto plano
        y construye un objeto ProponentProfileData validado.
        """
        missing: List[str] = []
        inconsistencies: List[str] = []

        # 1. Tipo de proponente
        raw_tipo = extracted_kv.get("TIPO_PROPONENTE", "").lower()
        if "natural" in raw_tipo:
            proponent_type = "persona_natural"
        else:
            proponent_type = "persona_juridica"

        # 2. Nombre o razón social
        name = extracted_kv.get("NOMBRE_PROPONENTE") or extracted_kv.get("RAZON_SOCIAL") or extracted_kv.get("NOMBRE_COMPLETO") or ""
        if not name and raw_text:
            m = re.search(r"(?:Razón Social|Nombre Proponente|Nombre Completo)[:\s]+([^\n\r]+)", raw_text, re.IGNORECASE)
            if m:
                name = m.group(1).strip()
        if not name:
            missing.append("Nombre completo o razón social")

        # 3. Identificación / NIT
        raw_id = extracted_kv.get("NUMERO_IDENTIFICACION") or extracted_kv.get("NIT_O_CEDULA") or extracted_kv.get("NIT") or ""
        if not raw_id and raw_text:
            m_id = re.search(r"(?:NIT|Cédula|Identificación)[:\s]+([0-9\.\-]+)", raw_text, re.IGNORECASE)
            if m_id:
                raw_id = m_id.group(1).strip()
        
        nit_clean = re.sub(r"[^0-9\-]", "", raw_id) or "900.000.000-1"
        dv = ""
        if "-" in nit_clean:
            parts = nit_clean.split("-")
            nit_clean = parts[0]
            dv = parts[1][:1]
        
        if not raw_id:
            missing.append("Número de identificación o NIT")

        # 4. Representante legal (obligatorio solo para persona jurídica)
        rep_legal = extracted_kv.get("REPRESENTANTE_LEGAL", "")
        if proponent_type == "persona_juridica" and (not rep_legal or "nombre y apellidos" in rep_legal.lower()):
            # Permitir que el usuario lo diligencie en la revisión editable
            inconsistencies.append("Representante legal pendiente de confirmar para Persona Jurídica")

        # 5. Correo de contacto
        email = extracted_kv.get("CORREO_CONTACTO") or ""
        if not email and raw_text:
            m_em = re.search(r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", raw_text)
            if m_em:
                email = m_em.group(1)
        if not email or "@" not in email:
            missing.append("Correo electrónico de contacto válido")

        # 6. Departamento y municipio
        raw_loc = extracted_kv.get("DEPARTAMENTO_MUNICIPIO") or ""
        dept = "Cundinamarca"
        city = "Bogotá D.C."
        if "-" in raw_loc:
            parts = raw_loc.split("-")
            dept = parts[0].strip()
            city = parts[1].strip()
        elif raw_loc:
            city = raw_loc.strip()

        # 7. Actividad y bienes/servicios
        activity = extracted_kv.get("ACTIVIDAD_OFERTA") or "Actividades comerciales y de prestación de servicios"
        if len(activity.strip()) < 5:
            missing.append("Descripción de la actividad o bienes ofrecidos")

        # 8. Palabras clave
        raw_kw = extracted_kv.get("PALABRAS_CLAVE", "")
        keywords = [k.strip() for k in re.split(r"[,;\n]", raw_kw) if k.strip()]
        if not keywords:
            keywords = ["servicios", "suministro", "general"]

        # 9. Verificación de veracidad
        has_veracity = "CONFIRMACION_VERACIDAD" in extracted_kv or "Declaro bajo la gravedad de juramento" in raw_text

        # 10. Datos complementarios
        raw_unspsc = extracted_kv.get("CODIGOS_UNSPSC", "")
        unspsc = [re.sub(r'[^0-9]', '', u)[:8] for u in re.split(r"[,;\s]", raw_unspsc) if len(re.sub(r'[^0-9]', '', u)) >= 6]

        raw_exp = extracted_kv.get("EXPERIENCIA_RELACIONADA", "")
        has_prior_exp = "sin experiencia" not in raw_exp.lower()

        # Cálculo de puntaje de completitud
        total_checks = 6
        passed_checks = 6 - len(missing)
        completeness = int((max(0, passed_checks) / total_checks) * 100)

        # Hash SHA256 para procedencia
        file_hash = hashlib.sha256((raw_text or str(extracted_kv)).encode("utf-8")).hexdigest()[:16]

        profile_obj = ProponentProfileData(
            proponent_type=proponent_type,
            name=name or "Proponente por Confirmar",
            id_type="NIT" if proponent_type == "persona_juridica" else "CC",
            id_number=nit_clean,
            nit=nit_clean,
            dv=dv,
            legal_representative=rep_legal,
            contact_email=email or "contacto@licitia.co",
            department=dept,
            city=city,
            declared_activity=activity,
            offered_goods_services=activity,
            target_sectors=["Servicios", "Tecnología", "General"],
            geographic_coverage=[dept, "Nacional"],
            keywords=keywords,
            fill_date=datetime.now().strftime("%Y-%m-%d"),
            has_veracity_confirmation=has_veracity,
            has_privacy_acceptance=True,
            unspsc_codes=unspsc,
            has_prior_experience=has_prior_exp,
            business_condition=extracted_kv.get("CONDICION_EMPRESARIAL", "mipyme")
        )

        is_valid = len(missing) == 0 and has_veracity

        return ProponentProfileExtractionResult(
            success=True,
            data=profile_obj,
            completeness_score=completeness,
            missing_fields=missing,
            inconsistencies=inconsistencies,
            provenance={
                "filename": filename,
                "file_hash": file_hash,
                "extracted_at": datetime.now().isoformat(),
                "template_version": TEMPLATE_VERSION,
                "extractor": "LicitIA-DOCX-Parser" if extracted_kv else "LicitIA-PDF-Parser"
            },
            is_valid_for_activation=is_valid,
            message="Ficha extraída satisfactoriamente. Revisa y confirma la información." if is_valid else "Faltan algunos campos indispensables por completar."
        )

    @classmethod
    async def process_proponent_file(
        cls,
        file_bytes: bytes,
        filename: str
    ) -> ProponentProfileExtractionResult:
        """Punto de entrada principal para procesar una Ficha en DOCX o PDF."""
        if not file_bytes or len(file_bytes) < 30:
            return ProponentProfileExtractionResult(
                success=False,
                message="El archivo cargado está vacío o no es legible.",
                missing_fields=["Archivo completo no vacío"]
            )

        fn_lower = filename.lower()
        if fn_lower.endswith(".docx"):
            kv = cls.extract_from_docx_bytes(file_bytes)
            return cls.parse_profile_data(kv, raw_text="", filename=filename)
        elif fn_lower.endswith(".pdf"):
            text = cls.extract_text_from_pdf_bytes(file_bytes)
            if len(text.strip()) < 30:
                return ProponentProfileExtractionResult(
                    success=False,
                    message="El archivo PDF no contiene texto seleccionable (parece ser una imagen escaneada). Por favor sube el archivo DOCX diligenciado o un PDF con texto seleccionable.",
                    missing_fields=["Texto digital seleccionable"]
                )
            # Para PDF, intentar extraer tags si existen o parsing semántico
            kv: Dict[str, str] = {}
            for line in text.split("\n"):
                m = re.search(r"\[([A-Z0-9_]+)\][:\s]*(.*)", line)
                if m:
                    kv[m.group(1)] = m.group(2).strip()
            return cls.parse_profile_data(kv, raw_text=text, filename=filename)
        else:
            return ProponentProfileExtractionResult(
                success=False,
                message="Formato no admitido. Solo se admiten archivos en formato DOCX editable o PDF con texto seleccionable.",
                missing_fields=["Formato válido (.docx o .pdf)"]
            )


# -----------------------------------------------------------------------------
# Servicio de Autorización en Servidor para Ruta sin RUP
# -----------------------------------------------------------------------------

class ProponentAuthorizationService:
    @staticmethod
    def validate_and_authorize_profile(
        payload: ConfirmProfileRequest,
        organization_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Comprueba en el servidor que la información indispensable esté completa,
        que el usuario haya confirmado expresamente la veracidad y otorga el acceso al módulo de Mínima Cuantía.
        """
        data = payload.profile_data

        errors = []
        if not data.name or len(data.name.strip()) < 3:
            errors.append("El nombre completo o razón social es obligatorio.")
        if not data.id_number or len(data.id_number.strip()) < 4:
            errors.append("El número de identificación o NIT es obligatorio.")
        if not data.contact_email or "@" not in data.contact_email:
            errors.append("El correo de contacto debe ser válido.")
        if not data.department or not data.city:
            errors.append("El departamento y municipio de ubicación son obligatorios.")
        if not data.declared_activity or len(data.declared_activity.strip()) < 5:
            errors.append("La descripción de la actividad u oferta es obligatoria.")
        if not payload.confirmed_by_user or not data.has_veracity_confirmation:
            errors.append("Debe existir confirmación explícita de veracidad de la información declarada.")

        # Regla de diferencia entre Persona Natural y Jurídica
        if data.proponent_type == "persona_juridica" and not data.legal_representative:
            errors.append("Para Persona Jurídica es obligatorio indicar el Representante Legal.")

        if errors:
            return {
                "authorized": False,
                "status": "requires_correction",
                "errors": errors,
                "permissions": {
                    "can_access_minima_cuantia": False,
                    "can_access_general_tenders": False
                }
            }

        # Autorización satisfactoria en servidor
        return {
            "authorized": True,
            "status": "confirmed",
            "onboarding_route": "without_rup_minima_cuantia",
            "rup_status": "not_applicable",
            "ficha_status": "confirmed",
            "profile_completeness": 100,
            "permissions": {
                "can_access_minima_cuantia": True,
                "can_access_general_tenders": False
            },
            "confirmed_at": datetime.now().isoformat(),
            "confirmation_source": "user_declared_and_confirmed",
            "notice": "Acceso a Mínima Cuantía habilitado. Cada convocatoria evalúa sus propios requisitos con sus pliegos definitivos."
        }
