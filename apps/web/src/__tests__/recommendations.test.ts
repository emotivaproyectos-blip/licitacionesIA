import { 
  computeTenderSimilarity, 
  findSimilarTenders, 
  getPersonalizedRecommendations,
  tokenizeText
} from '../services/recommendationService.ts';
import type { TenderDTO } from '../services/api.ts';

console.log('=== INICIANDO PRUEBAS DEL MOTOR DE SIMILITUD Y RECOMENDACIÓN ===');

// 1. Probar Tokenizador y Stopwords en español
console.log('\n--- 1. Prueba de Tokenización ---');
const sampleText = 'Suministro e instalación de equipos de cómputo y software para la alcaldía';
const tokens = tokenizeText(sampleText);
console.log('Texto original:', sampleText);
console.log('Tokens procesados:', tokens);
if (!tokens.has('suministro') || !tokens.has('computo') || !tokens.has('software') || tokens.has('de') || tokens.has('la')) {
  console.error('FAIL: Tokenizer did not properly normalize or filter stop words!');
  process.exit(1);
} else {
  console.log('PASS: Tokenizer filtra stopwords en español y normaliza tildes correctamente.');
}

// 2. Probar Similitud entre dos licitaciones muy afines (mismos códigos UNSPSC, palabras clave similares)
console.log('\n--- 2. Prueba de Similitud Alta ---');
const baseTender: TenderDTO = {
  id: 'tender-001',
  process_number: 'CO1.BDOS.001',
  title: 'Mantenimiento preventivo y correctivo de infraestructura tecnológica y servidores',
  description: 'Servicio de soporte técnico para data center',
  entity_name: 'Ministerio de Tecnologías de la Información y las Comunicaciones',
  budget_cop: 150000000,
  unspsc_codes: ['81111801', '81111802', '43211500'],
  is_minima_cuantia: false,
  source_platform: 'SECOP_II'
} as any;

const highMatchTender: TenderDTO = {
  id: 'tender-002',
  process_number: 'CO1.BDOS.002',
  title: 'Mantenimiento y soporte de servidores y equipos de cómputo para la entidad',
  description: 'Soporte preventivo a servidores',
  entity_name: 'Superintendencia de Industria y Comercio',
  budget_cop: 160000000,
  unspsc_codes: ['81111801', '43211500'],
  is_minima_cuantia: false,
  source_platform: 'SECOP_II'
} as any;

const highSim = computeTenderSimilarity(baseTender, highMatchTender);
console.log('Similitud Alta Calculada:', highSim.score, '%');
console.log('Motivos identificados:', highSim.reasons);
if (highSim.score < 60) {
  console.error('FAIL: High match tender expected score >= 60, got', highSim.score);
  process.exit(1);
} else {
  console.log('PASS: Puntuación de similitud alta coherente (>=60%).');
}

// 3. Probar Similitud con licitación no relacionada (ej: obras viales vs TI)
console.log('\n--- 3. Prueba de Similitud Baja / Dispersa ---');
const lowMatchTender: TenderDTO = {
  id: 'tender-003',
  process_number: 'CO1.BDOS.003',
  title: 'Construcción de placa huella y pavimento rígido en vereda rural',
  description: 'Obras civiles viales',
  entity_name: 'Alcaldía Municipal de Fredonia',
  budget_cop: 2500000000,
  unspsc_codes: ['72141001', '72141103'],
  is_minima_cuantia: false,
  source_platform: 'SECOP_II'
} as any;

const lowSim = computeTenderSimilarity(baseTender, lowMatchTender);
console.log('Similitud Baja Calculada:', lowSim.score, '%');
if (lowSim.score > 35) {
  console.error('FAIL: Low match tender expected score < 35, got', lowSim.score);
  process.exit(1);
} else {
  console.log('PASS: Puntuación de licitaciones no afines descartada (<35%).');
}

// 4. Probar Ranking de findSimilarTenders
console.log('\n--- 4. Prueba de Ranking de Similares ---');
const allCandidates = [lowMatchTender, highMatchTender, baseTender];
const similarRanked = findSimilarTenders(baseTender, allCandidates, 5);
console.log('Licitaciones similares encontradas:', similarRanked.length);
if (similarRanked.length === 0 || (similarRanked[0].tender.id !== 'tender-002' && similarRanked[0].tender.process_number !== 'CO1.BDOS.002')) {
  console.error('FAIL: Expected tender-002 to be top ranked similar tender');
  process.exit(1);
} else {
  console.log('PASS: findSimilarTenders excluye la licitación base y posiciona la más afín en primer lugar.');
}

// 5. Probar Recomendaciones Personalizadas (Personalized Recommendations)
console.log('\n--- 5. Prueba de Recomendaciones Personalizadas ---');
const savedTenders = [baseTender];
const recentSearches = ['servidores data center'];
const candidatePool = [highMatchTender, lowMatchTender];

const personalized = getPersonalizedRecommendations(
  candidatePool,
  savedTenders,
  recentSearches,
  [],
  3
);

console.log('Recomendaciones generadas:', personalized.length);
personalized.forEach(p => {
  console.log(`- [${p.matchScore}%] ${p.tender.title}`);
  console.log(`  Etiqueta: ${p.sourceTag}`);
  console.log(`  Motivos: ${p.matchReasons.join(', ')}`);
});

if (personalized.length === 0 || (personalized[0].tender.id !== 'tender-002' && personalized[0].tender.process_number !== 'CO1.BDOS.002')) {
  console.error('FAIL: Expected personalized recommendations to prioritize tender-002');
  process.exit(1);
} else {
  console.log('PASS: Recomendaciones personalizadas priorizan correctamente afines a guardadas y búsquedas.');
}

console.log('\n=== TODAS LAS PRUEBAS DE SIMILITUD PASARON EXITOSAMENTE ===');
