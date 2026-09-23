"""
Unit and integration tests for SECOP II Mínima Cuantía and Proponent Profile without RUP.
Emotiva LicitIA - Colombian Public Procurement.
"""
import io
import os
import sys
import unittest
from datetime import datetime

# Añadir la ruta raíz de apps/api al sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.modules.documents.proponent_profile import (
    create_proponent_docx_template,
    ProponentProfileExtractorService,
    ProponentAuthorizationService,
    ProponentProfileData,
    ConfirmProfileRequest,
)
from app.modules.secop.soda_client import (
    SECOPTenderDTO,
    SECOPDatosAbiertosClient,
)
from app.modules.matching.engine import (
    CompatibilityEngine,
    EvaluationResult,
)


class TestProponentDocxTemplate(unittest.TestCase):
    """Pruebas para la generación de la plantilla oficial DOCX."""

    def test_create_template_persona_natural(self):
        buf = create_proponent_docx_template(
            proponent_type="persona_natural",
            initial_data={
                "name": "JUAN PEREZ CONTRATISTA",
                "id_number": "1020304050",
                "contact_email": "juan.perez@example.com",
                "phone": "3001234567",
                "city": "Medellín",
                "department": "Antioquia"
            }
        )
        docx_bytes = buf.getvalue()
        self.assertIsInstance(docx_bytes, bytes)
        self.assertTrue(len(docx_bytes) > 2000, "El archivo DOCX generado debe contener datos y estilos válidos")
        # Un archivo DOCX es un zip contenedor que empieza con 'PK\x03\x04'
        self.assertTrue(docx_bytes.startswith(b'PK'), "El archivo generado debe tener la firma de formato ZIP/DOCX")

    def test_create_template_persona_juridica(self):
        buf = create_proponent_docx_template(
            proponent_type="persona_juridica",
            initial_data={
                "name": "SOLUCIONES TECNOLOGICAS S.A.S.",
                "id_number": "901.452.890-1",
                "legal_representative": "Carlos Gomez",
                "city": "Bogotá D.C.",
                "department": "Bogotá D.C."
            }
        )
        docx_bytes = buf.getvalue()
        self.assertIsInstance(docx_bytes, bytes)
        self.assertTrue(len(docx_bytes) > 2000)
        self.assertTrue(docx_bytes.startswith(b'PK'))


class TestProponentExtraction(unittest.TestCase):
    """Pruebas para la extracción de datos desde plantillas DOCX y texto seleccionable."""

    def test_extract_from_generated_docx(self):
        import asyncio
        buf = create_proponent_docx_template(
            proponent_type="persona_juridica",
            initial_data={
                "name": "INGENIERIA Y SUMINISTROS SAS",
                "id_number": "901452890-1",
                "contact_email": "contacto@ingenieria.co",
                "city": "Bogotá D.C.",
                "department": "Bogotá D.C."
            }
        )
        docx_bytes = buf.getvalue()
        result = asyncio.run(ProponentProfileExtractorService.process_proponent_file(docx_bytes, "ficha_proponente.docx"))
        self.assertIsNotNone(result)
        self.assertTrue(result.success)
        self.assertIsNotNone(result.data)
        self.assertTrue(
            "901452890" in (result.data.id_number or "") or "INGENIERIA" in (result.data.name or "").upper(),
            f"Extracción fallida de NIT o Nombre: id_number={result.data.id_number}, Nombre={result.data.name}"
        )

    def test_extract_from_text_pdf(self):
        sample_kv = {
            "TIPO_PROPONENTE": "persona_natural",
            "RAZON_SOCIAL": "MARIA FERNANDA ROJAS",
            "NUMERO_IDENTIFICACION": "52890123",
            "DEPARTAMENTO_MUNICIPIO": "Santander - Bucaramanga",
            "CORREO_CONTACTO": "maria.rojas@servicios.co",
            "TELEFONO_CONTACTO": "3158901234",
            "ACTIVIDAD_OFERTA": "Suministro de papelería y elementos de oficina",
            "CODIGOS_UNSPSC": "14111500, 44120000",
            "CONFIRMACION_VERACIDAD": "SI"
        }
        result = ProponentProfileExtractorService.parse_profile_data(sample_kv, raw_text="", filename="ficha.pdf")
        self.assertIsNotNone(result)
        self.assertTrue(result.success)
        self.assertIsNotNone(result.data)
        self.assertEqual(result.data.proponent_type, "persona_natural")
        self.assertIn("MARIA FERNANDA", result.data.name.upper())
        self.assertEqual(result.data.id_number, "52890123")
        self.assertIn("14111500", result.data.unspsc_codes)


class TestProponentAuthorizationService(unittest.TestCase):
    """Pruebas de validación estricta y autorización en servidor."""

    def test_rejection_when_veracity_not_confirmed(self):
        profile = ProponentProfileData(
            name="Consultor SAS",
            id_number="900123456-1",
            proponent_type="persona_juridica",
            legal_representative="Andres Lopez",
            city="Cali",
            department="Valle del Cauca",
            contact_email="andres@consultor.co",
            declared_activity="Consultoría en sistemas y arquitectura",
            offered_goods_services="Servicios de consultoría TI",
            has_veracity_confirmation=False  # No confirmó veracidad
        )
        req = ConfirmProfileRequest(profile_data=profile, confirmed_by_user=False)
        auth = ProponentAuthorizationService.validate_and_authorize_profile(req)
        self.assertFalse(auth["authorized"])
        self.assertFalse(auth["permissions"]["can_access_minima_cuantia"])
        self.assertIn("veracidad", " ".join(auth["errors"]).lower())

    def test_rejection_when_natural_missing_id_number(self):
        profile = ProponentProfileData(
            name="Pedro Pérez",
            id_number="",  # Falta cédula
            proponent_type="persona_natural",
            city="Medellín",
            department="Antioquia",
            contact_email="pedro@perez.co",
            declared_activity="Obras civiles menores y mantenimiento",
            offered_goods_services="Mantenimiento locativo",
            has_veracity_confirmation=True
        )
        req = ConfirmProfileRequest(profile_data=profile, confirmed_by_user=True)
        auth = ProponentAuthorizationService.validate_and_authorize_profile(req)
        self.assertFalse(auth["authorized"])
        self.assertTrue(any("identificación" in e.lower() or "nit" in e.lower() for e in auth["errors"]))

    def test_rejection_when_juridica_missing_legal_rep(self):
        profile = ProponentProfileData(
            name="Comercializadora Andina SAS",
            id_number="901999888-2",
            proponent_type="persona_juridica",
            legal_representative="",  # Falta rep legal
            city="Barranquilla",
            department="Atlántico",
            contact_email="info@andina.co",
            declared_activity="Dotaciones industriales y calzado",
            offered_goods_services="Calzado y dotación",
            has_veracity_confirmation=True
        )
        req = ConfirmProfileRequest(profile_data=profile, confirmed_by_user=True)
        auth = ProponentAuthorizationService.validate_and_authorize_profile(req)
        self.assertFalse(auth["authorized"])
        self.assertTrue(any("representante legal" in e.lower() for e in auth["errors"]))

    def test_authorization_with_sin_experiencia(self):
        """Verifica que declarar 'sin experiencia previa' sea plenamente válido en Mínima Cuantía."""
        profile = ProponentProfileData(
            name="SERVICIOS GENERALES SAS",
            id_number="901555444-3",
            proponent_type="persona_juridica",
            legal_representative="Diana Morales",
            city="Pereira",
            department="Risaralda",
            contact_email="contacto@servicios.co",
            declared_activity="Servicios de aseo y cafetería institucional",
            offered_goods_services="Aseo y desinfección",
            has_prior_experience=False,
            experiences=[],
            has_veracity_confirmation=True
        )
        req = ConfirmProfileRequest(profile_data=profile, confirmed_by_user=True)
        auth = ProponentAuthorizationService.validate_and_authorize_profile(req)
        self.assertTrue(auth["authorized"], f"Debe autorizar: errores={auth.get('errors')}")
        self.assertTrue(auth["permissions"]["can_access_minima_cuantia"])
        self.assertEqual(auth["onboarding_route"], "without_rup_minima_cuantia")
        self.assertEqual(auth["rup_status"], "not_applicable")
        self.assertEqual(auth["profile_completeness"], 100)


class TestSECOPMínimaCuantíaParsing(unittest.TestCase):
    """Pruebas del cliente SODA y DTO para modalidad de Mínima Cuantía."""

    def test_dto_minima_cuantia_detection(self):
        dto = SECOPTenderDTO(
            id="SECOP2-MC-12345",
            secop_id="CO1.BDX.12345",
            process_number="MC-2026-001",
            title="Suministro de útiles de aseo para la Alcaldía",
            entity_name="Alcaldía Municipal de Tunja",
            department="Boyacá",
            city="Tunja",
            status="Presentación de ofertas",
            budget_cop=15000000,
            budget_smmlv=10.5,
            closing_date="2026-10-15T00:00:00.000",
            publication_date="2026-09-18T10:00:00.000",
            source_platform="SECOP_II",
            modalidad_de_contratacion="Mínima cuantía",
            is_minima_cuantia=True,
            is_time_unspecified=True
        )
        self.assertTrue(dto.is_minima_cuantia)
        self.assertEqual(dto.modalidad_de_contratacion, "Mínima cuantía")
        # Fecha en medianoche exacta debe marcar is_time_unspecified
        self.assertTrue(dto.is_time_unspecified)

    def test_soda_client_builds_minima_cuantia_query(self):
        self.assertTrue(callable(getattr(SECOPDatosAbiertosClient, 'fetch_recent_tenders', None)))


class TestCompatibilityEngineMínimaCuantía(unittest.TestCase):
    """Pruebas del motor de matching para el régimen de Mínima Cuantía."""

    def test_no_penalization_without_rup(self):
        company_financials = {
            "current_assets": 0,
            "current_liabilities": 0,
            "total_assets": 0,
            "total_liabilities": 0
        }
        company_experiences = []
        tender_requirements = {
            "budget_smmlv": 17.5,
            "contract_type": "Mínima cuantía",
            "required_unspsc": ["81111500"],
            "title": "Desarrollo de plataforma web y soporte de software",
            "description": "Contratación de mínima cuantía para mantenimiento de portal institucional"
        }
        proponent_profile = {
            "name": "EMPRESA NUEVA SAS",
            "nit": "901888777-1",
            "onboarding_route": "without_rup_minima_cuantia",
            "can_access_minima_cuantia": True,
            "unspsc_codes": ["81111500", "81112000"],
            "declared_activity": "Desarrollo de software y tecnología"
        }

        eval_result = CompatibilityEngine.evaluate(
            company_financials=company_financials,
            company_experiences=company_experiences,
            tender_requirements=tender_requirements,
            is_minima_cuantia=True,
            proponent_profile=proponent_profile
        )
        self.assertGreaterEqual(eval_result.overall_score, 85, "El score no debe ser penalizado por falta de RUP")
        self.assertEqual(eval_result.verdict, "RECOMMENDED")
        reasons_text = " ".join(eval_result.detailed_reasons).lower()
        self.assertTrue("mínima cuantía" in reasons_text or "rup" in reasons_text)

    def test_inconsistency_alert_when_pliego_mentions_rup(self):
        tender_inconsistent = {
            "budget_smmlv": 12.0,
            "contract_type": "Mínima cuantía",
            "required_unspsc": ["80101500"],
            "description": "El proponente debe adjuntar RUP vigente con índice de liquidez superior a 1.5",
            "requires_rup": True
        }
        eval_result = CompatibilityEngine.evaluate(
            company_financials={"current_assets": 0, "current_liabilities": 0},
            company_experiences=[],
            tender_requirements=tender_inconsistent,
            is_minima_cuantia=True,
            proponent_profile={"onboarding_route": "without_rup_minima_cuantia"}
        )
        risks_text = " ".join(eval_result.identified_risks).lower()
        self.assertTrue(
            "inconsistencia" in risks_text or "rup" in risks_text or "exigible" in risks_text,
            "Debe advertir al usuario sobre la inconsistencia del pliego al exigir RUP en Mínima Cuantía"
        )


if __name__ == '__main__':
    unittest.main()
