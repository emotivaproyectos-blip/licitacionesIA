/**
 * LicitIA - Procurement Text Formatter & Healer
 * Sanea y normaliza textos oficiales de contratación pública colombiana (SECOP I, SECOP II y Datos Abiertos).
 * 
 * Corrige errores históricos de bases de datos gubernamentales como:
 * - Vocales con tilde sustituidas por minúsculas en palabras mayúsculas (ej: PRESTACIoN, LOGiSTICOS, ARCaNGEL, RiO, DiAS).
 * - Mojibake UTF-8 / Windows-1252 (Ã³, Ã¡, Ã©, Ã­, Ã±, etc.).
 * - Separadores ';' usados incorrectamente en lugar de comas.
 * - Formatea textos en mayúsculas sostenidas a un estilo editorial limpio (Sentence Case),
 *   respetando siglas oficiales colombianas (SECOP, NIT, SMMLV, RUP, ESE) y nombres propios (Río de Oro, San Miguel, Cesar).
 */

// Mapeo exhaustivo de mojibake común en datos abiertos
const MOJIBAKE_REPLACEMENTS: [RegExp, string][] = [
  [/Ã¡/g, 'á'], [/Ã©/g, 'é'], [/Ã­/g, 'í'], [/Ã³/g, 'ó'], [/Ãº/g, 'ú'],
  [/Ã±/g, 'ñ'], [/Ã/g, 'Á'], [/Ã‰/g, 'É'], [/Ã/g, 'Í'], [/Ã/g, 'Ó'],
  [/Ã/g, 'Ú'], [/Ã‘/g, 'Ñ'], [/â€œ/g, '"'], [/â€/g, '"'], [/â€“/g, '-'],
  [/â€”/g, '-'], [/â€™/g, "'"], [/âœ“/g, '✓'], [/&amp;/g, '&'], [/&quot;/g, '"'],
  [/&lt;/g, '<'], [/&gt;/g, '>']
];

// Glifos y palabras con mayúsculas y minúsculas intercaladas típicas de SECOP I
const SECOP_GLITCH_PATTERNS: [RegExp, string][] = [
  // Sufijos de acción y sustantivos (-IoN -> -IÓN, -IoNES -> -IONES)
  [/([A-ZÁÉÍÓÚÑ]{2,})IoN\b/g, '$1IÓN'],
  [/([A-ZÁÉÍÓÚÑ]{2,})IoNES\b/g, '$1IONES'],

  // Patrones con 'i' minúscula en lugar de 'Í'
  [/\bLOGiSTIC([A-ZÁÉÍÓÚÑ]*)\b/g, 'LOGÍSTIC$1'],
  [/\bARTiSTIC([A-ZÁÉÍÓÚÑ]*)\b/g, 'ARTÍSTIC$1'],
  [/\bRiO\b/g, 'RÍO'],
  [/\bDiAS\b/g, 'DÍAS'],
  [/\bDiA\b/g, 'DÍA'],
  [/\bALCALDiA\b/g, 'ALCALDÍA'],
  [/\bSECRETARiA\b/g, 'SECRETARÍA'],
  [/\bINTERVENTORiA\b/g, 'INTERVENTORÍA'],
  [/\bAUDITORiA\b/g, 'AUDITORÍA'],
  [/\bCONSULTORiA\b/g, 'CONSULTORÍA'],
  [/\bCONTRALORiA\b/g, 'CONTRALORÍA'],
  [/\bPERSONERiA\b/g, 'PERSONERÍA'],
  [/\bPOLICiA\b/g, 'POLICÍA'],
  [/\bGARANTiA\b/g, 'GARANTÍA'],
  [/\bTECNOLOGiA\b/g, 'TECNOLOGÍA'],
  [/\bENERGiA\b/g, 'ENERGÍA'],
  [/\bTOPOGRAFiA\b/g, 'TOPOGRAFÍA'],
  [/\bVIGiA\b/g, 'VIGÍA'],
  [/\bPAPELERiA\b/g, 'PAPELERÍA'],
  [/\bFERRETERiA\b/g, 'FERRETERÍA'],
  [/\bDROGUERiA\b/g, 'DROGUERÍA'],
  [/\bCUANTiA\b/g, 'CUANTÍA'],
  [/\bFiSIC([A-ZÁÉÍÓÚÑ]*)\b/g, 'FÍSIC$1'],
  [/\bQUiMIC([A-ZÁÉÍÓÚÑ]*)\b/g, 'QUÍMIC$1'],
  [/\bJuRIDIC([A-ZÁÉÍÓÚÑ]*)\b/g, 'JURÍDIC$1'],
  [/\bMeDIC([A-ZÁÉÍÓÚÑ]*)\b/g, 'MÉDIC$1'],
  [/\bMINiM([A-ZÁÉÍÓÚÑ]*)\b/g, 'MÍNIM$1'],
  [/\bMiNIM([A-ZÁÉÍÓÚÑ]*)\b/g, 'MÍNIM$1'],
  [/\bVeHICUL([A-ZÁÉÍÓÚÑ]*)\b/g, 'VEHÍCUL$1'],
  [/\bVEHiCUL([A-ZÁÉÍÓÚÑ]*)\b/g, 'VEHÍCUL$1'],
  [/\bViNCUL([A-ZÁÉÍÓÚÑ]*)\b/g, 'VÍNCUL$1'],
  [/\bMEDELLiN\b/g, 'MEDELLÍN'],

  // Patrones con 'a' minúscula en lugar de 'Á'
  [/\bARCaNGEL\b/g, 'ARCÁNGEL'],
  [/\bARCANGEL\b/g, 'ARCÁNGEL'],
  [/\bBOYACa\b/g, 'BOYACÁ'],
  [/\bBOGOTa\b/g, 'BOGOTÁ'],
  [/\bCAQUETa\b/g, 'CAQUETÁ'],
  [/\bDEMaS\b/g, 'DEMÁS'],
  [/\bMaS\b/g, 'MÁS'],
  [/\bLLEVARa\b/g, 'LLEVARÁ'],
  [/\bREALIZARa\b/g, 'REALIZARÁ'],
  [/\bEJECUTARa\b/g, 'EJECUTARÁ'],
  [/\bESTARa\b/g, 'ESTARÁ'],
  [/\bDESARROLLARa\b/g, 'DESARROLLARÁ'],
  [/\bTEcNIC([A-ZÁÉÍÓÚÑ]*)\b/g, 'TÉCNIC$1'],
  [/\bTECNiC([A-ZÁÉÍÓÚÑ]*)\b/g, 'TÉCNIC$1'],

  // Patrones con 'o' minúscula en lugar de 'Ó'
  [/\bCHOCo\b/g, 'CHOCÓ'],
  [/\bPuBLIC([A-ZÁÉÍÓÚÑ]*)\b/g, 'PÚBLIC$1'],
  [/\bPUbLIC([A-ZÁÉÍÓÚÑ]*)\b/g, 'PÚBLIC$1'],
  [/\bNuMER([A-ZÁÉÍÓÚÑ]*)\b/g, 'NÚMER$1']
];

// Siglas y acrónimos oficiales colombianos que DEBEN mantenerse en mayúsculas
const ACRONYMS = new Set([
  'SECOP', 'SECOP1', 'SECOP2', 'SECOP I', 'SECOP II', 'SODA', 'NIT', 'RUP', 'UNSPSC', 'SMMLV',
  'SENA', 'ICBF', 'DIAN', 'CDP', 'RP', 'DNP', 'SGR', 'CONPES', 'FONADE',
  'ESE', 'E.S.E.', 'SA', 'S.A.', 'SAS', 'S.A.S.', 'LTDA', 'EICE', 'ESP',
  'E.S.P.', 'IPS', 'EPS', 'UPR', 'PGR', 'POT', 'EOT', 'PBOT', 'PB',
  'INFIBOY', 'IDU', 'IDRD', 'IDARTES', 'EAAB', 'INVIMA', 'INVIAS',
  'CMA', 'LP', 'SAMC', 'MC', 'CD', 'CDI', 'SENA', 'RUT', 'CIIU',
  'TIC', 'TICS', 'IA', 'API', 'ERP', 'CRM', 'SLA', 'GPS', 'LED', 'CCTV'
]);

// Diccionario de nombres propios colombianos (municipios, departamentos, santos y próceres)
const PROPER_NOUNS_MAP: Record<string, string> = {
  // Departamentos
  'antioquia': 'Antioquia', 'atlantico': 'Atlántico', 'bolivar': 'Bolívar',
  'boyaca': 'Boyacá', 'caldas': 'Caldas', 'caqueta': 'Caquetá', 'cauca': 'Cauca',
  'cesar': 'Cesar', 'cordoba': 'Córdoba', 'cundinamarca': 'Cundinamarca',
  'choco': 'Chocó', 'huila': 'Huila', 'guajira': 'Guajira', 'magdalena': 'Magdalena',
  'meta': 'Meta', 'narino': 'Nariño', 'santander': 'Santander', 'quindio': 'Quindío',
  'risaralda': 'Risaralda', 'sucre': 'Sucre', 'tolima': 'Tolima', 'valle': 'Valle',
  'vaupes': 'Vaupés', 'vichada': 'Vichada', 'putumayo': 'Putumayo', 'guaviare': 'Guaviare',
  'guainia': 'Guainía', 'amazonas': 'Amazonas', 'arauca': 'Arauca', 'casanare': 'Casanare',

  // Capitales y municipios clave
  'colombia': 'Colombia', 'bogota': 'Bogotá', 'medellin': 'Medellín', 'cali': 'Cali',
  'barranquilla': 'Barranquilla', 'cartagena': 'Cartagena', 'cucuta': 'Cúcuta',
  'bucaramanga': 'Bucaramanga', 'pereira': 'Pereira', 'santa': 'Santa', 'marta': 'Marta',
  'ibague': 'Ibagué', 'pasto': 'Pasto', 'manizales': 'Manizales', 'neiva': 'Neiva',
  'villavicencio': 'Villavicencio', 'armenia': 'Armenia', 'valledupar': 'Valledupar',
  'monteria': 'Montería', 'sincelejo': 'Sincelejo', 'popayan': 'Popayán', 'tunja': 'Tunja',
  'riohacha': 'Riohacha', 'florencia': 'Florencia', 'yopal': 'Yopal', 'quibdo': 'Quibdó',
  'mocoa': 'Mocoa', 'leticia': 'Leticia', 'inirida': 'Inírida', 'mitu': 'Mitú',
  'tuta': 'Tuta', 'montecitos': 'Montecitos', 'campamento': 'Campamento',
  'morrison': 'Morrisón', 'rio': 'Río', 'oro': 'Oro',

  // Nombres y santos
  'san': 'San', 'miguel': 'Miguel', 'rita': 'Rita', 'cascia': 'Cascia',
  'arcangel': 'Arcángel', 'alfonso': 'Alfonso', 'lopez': 'López', 'pumarejo': 'Pumarejo',
  'jose': 'José', 'andres': 'Andrés', 'pedro': 'Pedro', 'pablo': 'Pablo', 'antonio': 'Antonio'
};

// Artículos, preposiciones y conectores que van en minúscula dentro de una oración
const LOWERCASE_CONNECTORS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'unos', 'unas',
  'y', 'e', 'o', 'u', 'en', 'a', 'al', 'con', 'por', 'para', 'sin',
  'sobre', 'tras', 'entre', 'hacia', 'desde', 'hasta', 'que', 'se', 'su', 'sus'
]);

/**
 * Normaliza un string para búsqueda en el diccionario de nombres propios
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Corrige de forma directa cualquier palabra que tenga mayúsculas y minúsculas intercaladas
 * producto de conversiones defectuosas en SECOP (ej: PRESTACIoN -> PRESTACIÓN).
 */
export function healSecopGlitch(text?: string): string {
  if (!text || typeof text !== 'string') return '';
  let str = text.trim();

  // 1. Corregir Mojibake de codificación
  for (const [pattern, replacement] of MOJIBAKE_REPLACEMENTS) {
    str = str.replace(pattern, replacement);
  }

  // 2. Corregir patrones conocidos de SECOP I
  for (const [pattern, replacement] of SECOP_GLITCH_PATTERNS) {
    str = str.replace(pattern, replacement);
  }

  // 3. Regla general para cualquier residuo de letras minúsculas dentro de palabras en mayúsculas
  // Ejemplo: "BARRIo" -> "BARRIO", "MUNICIPIo" -> "MUNICIPIO"
  str = str.replace(/\b([A-ZÁÉÍÓÚÑ]{2,})([a-zñáéíóú])([A-ZÁÉÍÓÚÑ]*)\b/g, (_match, prefix, mid, suffix) => {
    if (mid === 'o' && suffix === 'N') return `${prefix}ÓN`;
    if (mid === 'i' && prefix.endsWith('LOG')) return `${prefix}Í${suffix}`;
    if (mid === 'a' && suffix.endsWith('NGEL')) return `${prefix}Á${suffix}`;
    return `${prefix}${mid.toUpperCase()}${suffix}`;
  });

  // 4. Limpieza de barras verticales, barras invertidas y símbolos de viñetas
  str = str.replace(/[|¦‖\\]+/g, ' ');
  str = str.replace(/[•►▪■~*]+/g, ' ');

  // 5. Limpieza de punto y coma usados como comas en SECOP ("HUMANOS; TECNICOS;")
  str = str.replace(/;\s*/g, ', ');
  str = str.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ');

  // 6. Curar números ordinales romanos para que no se confundan visualmente con barras verticales ('I' -> 'primer' / '1er')
  str = str.replace(/\b(del|el|al|en el|para el)\s+I\s+([a-záéíóúñ]+)/gi, '$1 primer $2');
  str = str.replace(/\b(la|en la|para la)\s+I\s+([a-záéíóúñ]+)/gi, '$1 primera $2');
  str = str.replace(/\bI\s+(torneo|festival|concurso|campeonato|encuentro|congreso|seminario|evento|ciclo|semestre)\b/gi, 'primer $1');
  str = str.replace(/\bI\s+(fase|etapa|edici[oó]n|versi[oó]n|feria|muestra|jornada|convocatoria|copa)\b/gi, 'primera $1');
  str = str.replace(/\bII\s+(torneo|festival|concurso|campeonato|encuentro|congreso|seminario|evento|ciclo|semestre)\b/gi, 'segundo $1');
  str = str.replace(/\bII\s+(fase|etapa|edici[oó]n|versi[oó]n|feria|muestra|jornada|convocatoria|copa)\b/gi, 'segunda $1');
  str = str.replace(/\bIII\s+(torneo|festival|concurso|campeonato|encuentro|congreso|seminario|evento|ciclo|semestre)\b/gi, 'tercer $1');
  str = str.replace(/\bIII\s+(fase|etapa|edici[oó]n|versi[oó]n|feria|muestra|jornada|convocatoria|copa)\b/gi, 'tercera $1');

  // 7. Acentuación de palabras comunes de contratación pública
  const COMMON_ACCENTS: [RegExp, string][] = [
    [/\bprestacion\b/gi, 'prestación'],
    [/\borganizacion\b/gi, 'organización'],
    [/\bcelebracion\b/gi, 'celebración'],
    [/\bconmemoracion\b/gi, 'conmemoración'],
    [/\brealizacion\b/gi, 'realización'],
    [/\bgastronomico\b/gi, 'gastronómico'],
    [/\bgastronomica\b/gi, 'gastronómica'],
    [/\bgastronomicos\b/gi, 'gastronómicos'],
    [/\bgastronomicas\b/gi, 'gastronómicas'],
    [/\bturistico\b/gi, 'turístico'],
    [/\bturistica\b/gi, 'turística'],
    [/\bturisticos\b/gi, 'turísticos'],
    [/\bturisticas\b/gi, 'turísticas'],
    [/\bpromocion\b/gi, 'promoción'],
    [/\blogistico\b/gi, 'logístico'],
    [/\blogisticos\b/gi, 'logísticos'],
    [/\blogistica\b/gi, 'logística'],
    [/\blogisticas\b/gi, 'logísticas'],
    [/\batencion\b/gi, 'atención'],
    [/\badquisicion\b/gi, 'adquisición'],
    [/\bconstruccion\b/gi, 'construcción'],
    [/\bpublico\b/gi, 'público'],
    [/\bpublica\b/gi, 'pública'],
    [/\bjuridico\b/gi, 'jurídico'],
    [/\bjuridica\b/gi, 'jurídica'],
    [/\btecnico\b/gi, 'técnico'],
    [/\btecnica\b/gi, 'técnica'],
    [/\bmedico\b/gi, 'médico'],
    [/\bmedica\b/gi, 'médica'],
    [/\bfisico\b/gi, 'físico'],
    [/\bfisica\b/gi, 'física'],
    [/\badministracion\b/gi, 'administración'],
    [/\bgestion\b/gi, 'gestión'],
    [/\beducacion\b/gi, 'educación'],
    [/\bcapacitacion\b/gi, 'capacitación'],
    [/\bevaluacion\b/gi, 'evaluación'],
    [/\binterventoria\b/gi, 'interventoría'],
    [/\bauditoria\b/gi, 'auditoría'],
    [/\bconsultoria\b/gi, 'consultoría'],
    [/\balcaldia\b/gi, 'alcaldía'],
    [/\bsecretaria\b/gi, 'secretaría'],
    [/\btecnologia\b/gi, 'tecnología'],
    [/\benergia\b/gi, 'energía'],
    [/\bcuantia\b/gi, 'cuantía'],
    [/\bminima\b/gi, 'mínima'],
    [/\bnumero\b/gi, 'número']
  ];

  for (const [re, rep] of COMMON_ACCENTS) {
    str = str.replace(re, rep);
  }

  return str;
}

/**
 * Formatea un título de licitación pública:
 * 1. Sana las corrupciones de letras intercaladas.
 * 2. Transforma mayúsculas sostenidas a un estilo editorial legible (Sentence Case).
 * 3. Conserva siglas colombianas oficiales (SECOP, NIT, SMMLV, etc.).
 * 4. Preserva nombres de municipios, departamentos y santos con sus tildes correspondientes.
 * 5. Elimina barras verticales (|), viñetas y confusiones de números romanos solitarios.
 */
export function formatProcurementTitle(rawTitle?: string): string {
  if (!rawTitle || typeof rawTitle !== 'string' || !rawTitle.trim()) {
    return 'Licitación pública';
  }

  // Primero curar errores mientras está en mayúsculas
  const healed = healSecopGlitch(rawTitle);

  // Si no es un texto predominantemente en mayúsculas, retornar el texto curado con espacios limpios
  const lettersOnly = healed.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
  const upperCount = (healed.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length;
  const isMostlyUpper = lettersOnly.length > 0 && (upperCount / lettersOnly.length) > 0.55;

  if (!isMostlyUpper) {
    return healed.replace(/[,;]\s*$/, '');
  }

  const words = healed.split(/\s+/);
  if (words.length === 0) return healed;

  const formattedWords = words.map((word, index) => {
    // Separar signos de puntuación iniciales y finales (paréntesis, comillas, etc.)
    const match = word.match(/^([("¿¡«']*)(.*?)([.,;:!?)»"']*)$/);
    if (!match) return word;

    const leadPunct = match[1];
    const core = match[2];
    const trailPunct = match[3];

    if (!core) return word;

    const coreUpper = core.toUpperCase();
    const coreLower = core.toLowerCase();
    const unaccented = normalizeKey(coreLower);

    // 1. Siglas, acrónimos oficiales y números romanos (II, III, IV, etc.)
    // Si es 'I', comprobar si viene después de SECOP o es una barra/ordinal
    if (coreUpper === 'I') {
      const prevWord = index > 0 ? words[index - 1].toUpperCase().replace(/[^A-Z]/g, '') : '';
      if (prevWord === 'SECOP') {
        return `${leadPunct}I${trailPunct}`;
      }
      if (prevWord === 'DEL' || prevWord === 'EL' || prevWord === 'AL') {
        return `${leadPunct}primer${trailPunct}`;
      }
      if (prevWord === 'LA') {
        return `${leadPunct}primera${trailPunct}`;
      }
      return `${leadPunct}1er${trailPunct}`;
    }

    if (ACRONYMS.has(coreUpper) || /^(II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/.test(coreUpper)) {
      return `${leadPunct}${coreUpper}${trailPunct}`;
    }

    // 2. Primera palabra del título siempre con mayúscula inicial
    if (index === 0) {
      const cap = coreLower.charAt(0).toUpperCase() + coreLower.slice(1);
      return `${leadPunct}${cap}${trailPunct}`;
    }

    // 3. Nombres propios geográficos o institucionales (con su tilde correcta)
    if (PROPER_NOUNS_MAP[unaccented]) {
      const canon = PROPER_NOUNS_MAP[unaccented];
      return `${leadPunct}${canon}${trailPunct}`;
    }

    // 4. Preposiciones, artículos y conectores en minúscula
    if (LOWERCASE_CONNECTORS.has(coreLower)) {
      return `${leadPunct}${coreLower}${trailPunct}`;
    }

    // 5. Palabras normales
    return `${leadPunct}${coreLower}${trailPunct}`;
  });

  let result = formattedWords.join(' ');
  // Eliminar comas o signos huérfanos al final
  result = result.replace(/[,;]\s*$/, '');

  return result;
}

/**
 * Formatea descripciones extensas de procesos manteniendo la coherencia de párrafos.
 */
export function formatProcurementDescription(rawDesc?: string): string {
  if (!rawDesc || typeof rawDesc !== 'string') return '';
  const healed = healSecopGlitch(rawDesc);

  // Procesar párrafo o líneas
  return healed
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      // Si la línea está en mayúsculas sostenidas, formatear como título/oración
      const letters = trimmed.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
      const uppers = (trimmed.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length;
      if (letters.length > 0 && (uppers / letters.length) > 0.6) {
        return formatProcurementTitle(trimmed);
      }
      return trimmed;
    })
    .join('\n');
}

/**
 * Formatea nombres de entidades públicas contratantes
 * Ejemplo: "ALCALDIA MUNICIPAL DE RIO DE ORO CESAR" -> "Alcaldía Municipal de Río de Oro Cesar"
 */
export function formatEntityName(rawEntity?: string): string {
  if (!rawEntity || typeof rawEntity !== 'string') return 'Entidad Pública';
  const healed = healSecopGlitch(rawEntity);

  const words = healed.split(/\s+/);
  const formatted = words.map((word, index) => {
    const cleanWord = word.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '');
    const upper = cleanWord.toUpperCase();
    const lower = cleanWord.toLowerCase();
    const unaccented = normalizeKey(lower);

    // Conectores y artículos
    if (index > 0 && LOWERCASE_CONNECTORS.has(lower)) {
      return word.toLowerCase();
    }

    // Nombres propios de ciudades / departamentos / próceres
    if (PROPER_NOUNS_MAP[unaccented]) {
      return PROPER_NOUNS_MAP[unaccented];
    }

    // Acrónimos colombianos (DIAN, SENA, ESE, etc.) y números romanos
    if (ACRONYMS.has(upper) || /^(I|II|III|IV|V|VI|VII|VIII|IX|X)$/.test(upper)) {
      return word.toUpperCase();
    }

    // Capitalizar primera letra
    const lowerFull = word.toLowerCase();
    return lowerFull.charAt(0).toUpperCase() + lowerFull.slice(1);
  });

  return formatted.join(' ');
}
