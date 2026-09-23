/**
 * Frontend Unit Tests for SECOP II Mínima Cuantía and Proponent Profile without RUP.
 * Run with: node --experimental-strip-types apps/web/src/__tests__/minimaCuantia.test.ts
 */
import assert from 'node:assert';
import { test } from 'node:test';
import { getTenderRequiredDocuments } from '../services/dossierGenerator.ts';
import type { RequiredDossierDoc } from '../services/dossierGenerator.ts';
import { formatFriendlyDate } from '../services/api.ts';
import type { TenderDTO } from '../services/api.ts';

test('Mínima Cuantía - Persona Natural: RUP and Guarantee Policy do NOT apply, Cedula is mandatory', () => {
  const tenderMC: Partial<TenderDTO> = {
    id: 'MC-TEST-001',
    process_number: 'MC-2026-ALC-01',
    title: 'Suministro de papelería y útiles',
    is_minima_cuantia: true,
    contract_type: 'Mínima cuantía',
    modalidad_de_contratacion: 'Mínima cuantía',
    budget_cop: 20000000,
    budget_smmlv: 14.0
  };

  const companyNatural = {
    name: 'JUAN VALENCIA',
    nit: '1020304050',
    sector: 'Comercio',
    current_assets: 0,
    current_liabilities: 0,
    total_assets: 0,
    total_liabilities: 0,
    operating_income: 0,
    interest_expense: 0,
    smmlv_experience: 0,
    unspsc_codes: ['14111500'],
    onboarding_route: 'without_rup_minima_cuantia' as const,
    proponent_type: 'natural' as const,
    has_rup: false,
    veracity_confirmed: true
  };

  const docs = getTenderRequiredDocuments(tenderMC as TenderDTO, companyNatural);
  assert.ok(Array.isArray(docs), 'Debe retornar un arreglo de documentos');
  assert.ok(docs.length >= 5, 'Debe generar al menos 5 documentos para el expediente');

  // 1. RUP no debe ser obligatorio y debe tener preliminary_status 'no aplica'
  const rupDoc = docs.find(d => d.id === 'rup_cert');
  assert.ok(rupDoc, 'Debe existir el documento rup_cert en el checklist');
  assert.strictEqual(rupDoc.mandatory, false, 'En Mínima Cuantía el RUP no es obligatorio');
  assert.strictEqual(rupDoc.preliminary_status, 'no aplica', 'El estado preliminar del RUP debe ser "no aplica"');
  assert.ok(rupDoc.source_reference?.includes('Ley 1150'), 'Debe citar la Ley 1150 de 2007');

  // 2. Póliza de seriedad debe ser no obligatoria / no aplica
  const policyDoc = docs.find(d => d.id === 'guarantee_policy');
  assert.ok(policyDoc, 'Debe existir guarantee_policy en el checklist');
  assert.strictEqual(policyDoc.mandatory, false, 'La póliza de seriedad no es obligatoria en mínima cuantía');
  assert.strictEqual(policyDoc.preliminary_status, 'no aplica', 'El estado preliminar de la póliza debe ser "no aplica"');

  // 3. Documento de identidad de Persona Natural
  const idDoc = docs.find(d => d.id === 'cedula_natural' || d.id === 'camara_comercio');
  assert.ok(idDoc, 'Debe existir documento de capacidad jurídica');
  assert.strictEqual(idDoc.id, 'cedula_natural', 'Para Persona Natural debe requerir cédula de ciudadanía');
  assert.strictEqual(idDoc.mandatory, true, 'La cédula es obligatoria');
  assert.strictEqual(idDoc.preliminary_status, 'cumple preliminarmente', 'Si tiene Cédula declarada debe cumplir preliminarmente');

  // 4. Verificación de campos estructurados exigidos
  docs.forEach(d => {
    assert.ok(typeof d.source_reference === 'string', `Doc ${d.id} debe tener source_reference`);
    assert.ok(typeof d.proponent_evidence === 'string', `Doc ${d.id} debe tener proponent_evidence`);
    assert.ok(typeof d.missing_info === 'string', `Doc ${d.id} debe tener missing_info`);
    assert.ok(['cumple preliminarmente', 'pendiente de soporte', 'no aplica', 'requiere validación manual'].includes(d.preliminary_status || ''), `Doc ${d.id} tiene estado inválido: ${d.preliminary_status}`);
  });
});

test('Proceso Ordinario (Licitación Pública) - RUP and Policy ARE mandatory', () => {
  const tenderLP: Partial<TenderDTO> = {
    id: 'LP-TEST-002',
    process_number: 'LP-2026-MIN-02',
    title: 'Construcción y adecuación de vías terciarias',
    is_minima_cuantia: false,
    contract_type: 'Licitación pública',
    modalidad_de_contratacion: 'Licitación pública',
    budget_cop: 500000000,
    budget_smmlv: 350.0
  };

  const companyWithRup = {
    name: 'CONSTRUCTORA ANDINA SAS',
    nit: '900.123.456-7',
    sector: 'Construcción',
    current_assets: 200000000,
    current_liabilities: 80000000,
    total_assets: 500000000,
    total_liabilities: 150000000,
    operating_income: 50000000,
    interest_expense: 5000000,
    smmlv_experience: 500,
    unspsc_codes: ['72101500'],
    onboarding_route: 'with_rup' as const,
    proponent_type: 'juridica' as const,
    has_rup: true
  };

  const docs = getTenderRequiredDocuments(tenderLP as TenderDTO, companyWithRup);

  // En Licitación Pública el RUP y la póliza son estrictamente obligatorios
  const rupDoc = docs.find(d => d.id === 'rup_cert');
  assert.ok(rupDoc);
  assert.strictEqual(rupDoc.mandatory, true, 'En Licitación Pública el RUP sí es obligatorio');

  const policyDoc = docs.find(d => d.id === 'guarantee_policy');
  assert.ok(policyDoc);
  assert.strictEqual(policyDoc.mandatory, true, 'En Licitación Pública la garantía sí es obligatoria');

  const camaraDoc = docs.find(d => d.id === 'camara_comercio');
  assert.ok(camaraDoc);
  assert.strictEqual(camaraDoc.mandatory, true, 'Para Persona Jurídica la Cámara de Comercio es obligatoria');
});

test('formatFriendlyDate handles ISO dates and invalid values gracefully', () => {
  const formatted = formatFriendlyDate('2026-10-15T15:30:00.000');
  assert.ok(typeof formatted === 'string' && formatted.length > 5);
  assert.strictEqual(formatFriendlyDate(''), 'Vigente');
});
