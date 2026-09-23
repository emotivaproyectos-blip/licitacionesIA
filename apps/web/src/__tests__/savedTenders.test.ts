// Test para el servicio de licitaciones guardadas
import { 
  getSavedTenders, 
  getSavedTenderIds, 
  isTenderSaved, 
  saveTender, 
  removeSavedTender, 
  toggleSaveTender 
} from '../services/savedTendersService.ts';
import type { TenderDTO } from '../services/api.ts';

// Mock simple de localStorage y window para Node
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, val),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear()
};
(globalThis as any).window = {
  localStorage: (globalThis as any).localStorage,
  dispatchEvent: () => true
};

console.log('=== INICIANDO PRUEBAS DE SERVICIO DE LICITACIONES GUARDADAS ===');

const testTender: TenderDTO = {
  id: 'tender-abc-123',
  secop_id: 'SECOP-999',
  process_number: 'CO1.BDOS.12345',
  title: 'Adquisición de licencias de software',
  entity_name: 'MinTIC',
  budget_cop: 50000000,
  unspsc_codes: ['43231500'],
  is_minima_cuantia: true,
  source_platform: 'SECOP_II'
} as any;

// 1. Guardar licitación
const savedOk = saveTender(testTender, '900123456');
console.log('1. saveTender:', savedOk);
if (!savedOk) {
  console.error('FAIL: Could not save tender');
  process.exit(1);
}

// 2. Verificar que se reconoce por cualquiera de sus 3 identificadores
const savedById = isTenderSaved(testTender.id, '900123456');
const savedBySecop = isTenderSaved(testTender.secop_id, '900123456');
const savedByProcess = isTenderSaved(testTender.process_number, '900123456');
const savedByObject = isTenderSaved(testTender, '900123456');

console.log('2. isTenderSaved checks:', { savedById, savedBySecop, savedByProcess, savedByObject });
if (!savedById || !savedBySecop || !savedByProcess || !savedByObject) {
  console.error('FAIL: isTenderSaved failed for one of the identifiers');
  process.exit(1);
}

// 3. Verificar Set de IDs
const idsSet = getSavedTenderIds('900123456');
console.log('3. Set de IDs contiene:', Array.from(idsSet));
if (!idsSet.has(testTender.id) || !idsSet.has(testTender.secop_id) || !idsSet.has(testTender.process_number)) {
  console.error('FAIL: getSavedTenderIds does not index all 3 identifiers');
  process.exit(1);
}

// 4. Toggle: debe desguardar al invocar de nuevo
const toggledOff = toggleSaveTender(testTender, '900123456');
console.log('4. toggleSaveTender (debe ser false tras quitar):', toggledOff);
if (toggledOff !== false) {
  console.error('FAIL: Expected toggle to remove tender (return false)');
  process.exit(1);
}
if (isTenderSaved(testTender, '900123456')) {
  console.error('FAIL: Tender should no longer be saved');
  process.exit(1);
}

// 5. Toggle: debe guardar de nuevo al invocar
const toggledOn = toggleSaveTender(testTender, '900123456');
console.log('5. toggleSaveTender (debe ser true tras guardar):', toggledOn);
if (toggledOn !== true) {
  console.error('FAIL: Expected toggle to save tender (return true)');
  process.exit(1);
}
if (!isTenderSaved(testTender, '900123456')) {
  console.error('FAIL: Tender should be saved again');
  process.exit(1);
}

console.log('=== TODAS LAS PRUEBAS DE GUARDADO PASARON EXITOSAMENTE ===');
