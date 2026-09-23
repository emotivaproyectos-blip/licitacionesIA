import assert from 'node:assert';
import { 
  healSecopGlitch, 
  formatProcurementTitle, 
  formatEntityName,
  formatProcurementDescription 
} from '../lib/procurementTextFormatter.ts';

console.log('=== TEST 1: Sana la cadena exacta reportada por el usuario ===');
const rawUserInput = 'PRESTACIoN DE SERVICIOS LOGiSTICOS PARA LA ORGANIZACIoN Y REALIZACIoN DE LAS ACTIVIDADES CULTURALES Y ARTiSTICAS EN EL MARCO DE LA CONMEMORACIoN DE LAS FESTIVIDADES DEL BARRIO SAN MIGUEL EN HONOR A SAN MIGUEL ARCaNGEL EN EL MUNICIPIO DE RiO DE ORO CESAR';

const healed = healSecopGlitch(rawUserInput);
console.log('Original: ', rawUserInput);
console.log('Healed:   ', healed);

assert(healed.includes('PRESTACIÓN'), 'Debe contener PRESTACIÓN');
assert(healed.includes('LOGÍSTICOS'), 'Debe contener LOGÍSTICOS');
assert(healed.includes('ORGANIZACIÓN'), 'Debe contener ORGANIZACIÓN');
assert(healed.includes('REALIZACIÓN'), 'Debe contener REALIZACIÓN');
assert(healed.includes('ARTÍSTICAS'), 'Debe contener ARTÍSTICAS');
assert(healed.includes('CONMEMORACIÓN'), 'Debe contener CONMEMORACIÓN');
assert(healed.includes('ARCÁNGEL'), 'Debe contener ARCÁNGEL');
assert(healed.includes('RÍO DE ORO'), 'Debe contener RÍO DE ORO');
assert(!/[A-ZÁÉÍÓÚÑ]+[a-z]+[A-ZÁÉÍÓÚÑ]+/.test(healed), 'No deben quedar letras minúsculas en palabras mayúsculas');

const formatted = formatProcurementTitle(rawUserInput);
console.log('Formatted:', formatted);
assert(formatted.startsWith('Prestación de servicios'), 'Debe iniciar con mayúscula inicial');
assert(formatted.includes('Río de Oro'), 'Debe preservar Río de Oro');
assert(formatted.includes('San Miguel'), 'Debe preservar San Miguel');
assert(formatted.includes('Arcángel'), 'Debe preservar Arcángel');
assert(formatted.includes('Cesar'), 'Debe preservar Cesar');

console.log('=== TEST 2: Preserva acrónimos colombianos ===');
const acronymInput = 'ADQUISICIoN DE LICENCIAS DE SOFTWARE PARA EL SECOP II SEGUN ESTANDARES DEL DNP Y SMMLV';
const formattedAcronym = formatProcurementTitle(acronymInput);
console.log('Formatted:', formattedAcronym);
assert(formattedAcronym.includes('SECOP II'), 'Debe incluir SECOP II en mayúsculas');
assert(formattedAcronym.includes('DNP'), 'Debe incluir DNP en mayúsculas');
assert(formattedAcronym.includes('SMMLV'), 'Debe incluir SMMLV en mayúsculas');

console.log('=== TEST 3: Entidades públicas ===');
const entity = 'ALCALDiA MUNICIPAL DE RiO DE ORO CESAR';
const formattedEntity = formatEntityName(entity);
console.log('Entity:   ', formattedEntity);
assert(formattedEntity === 'Alcaldía Municipal de Río de Oro Cesar', `Esperado Alcaldía Municipal de Río de Oro Cesar, obtenido ${formattedEntity}`);

console.log('=== TEST 4: Mojibake y separadores ===');
const mojibakeInput = 'INTERVENTORiA TÃ‰CNICA; ADMINISTRATIVA; FINANCIERA Y AMBIENTAL';
const healedMoji = healSecopGlitch(mojibakeInput);
console.log('Moji:     ', healedMoji);
assert(healedMoji.includes('INTERVENTORÍA'), 'Debe contener INTERVENTORÍA');
assert(healedMoji.includes('TÉCNICA, ADMINISTRATIVA, FINANCIERA'), 'Debe corregir comas y mojibake');

console.log('=== TEST 5: Eliminación de barras e iconos en párrafos y ordinales romanos ===');
const userCase2 = 'Prestación de servicios logísticos para la realizacion del I torneo gastronomico del campo a la mesa, como estrategia de promoción y posicionamiento turistico en el municipio de Córdoba Nariño.';
const formattedCase2 = formatProcurementTitle(userCase2);
console.log('Case 2 Input: ', userCase2);
console.log('Case 2 Output:', formattedCase2);
assert(formattedCase2.includes('primer torneo') || formattedCase2.includes('1er torneo'), 'Debe convertir "I torneo" para no parecer una barra vertical');
assert(!formattedCase2.includes(' del I '), 'No debe contener " del I " como barra vertical');
assert(formattedCase2.includes('realización'), 'Debe acentuar realización');
assert(formattedCase2.includes('gastronómico'), 'Debe acentuar gastronómico');
assert(formattedCase2.includes('turístico'), 'Debe acentuar turístico');

// Caso con barras literales y viñetas
const barInput = 'OBJETO: CONSULTORiA | FASE 1 • SECTOR TRANSPORTE / VIAS';
const healedBar = healSecopGlitch(barInput);
assert(!healedBar.includes('|'), 'Debe eliminar barras verticales');
assert(!healedBar.includes('•'), 'Debe eliminar viñetas');

console.log('=== ¡TODOS LOS TESTS DE PROCUREMENT TEXT FORMATTER PASARON CON ÉXITO! ===');
