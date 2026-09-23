/**
 * Motor de Similitud y Recomendación Inteligente de Licitaciones para LicitIA
 * Analiza afinidad por códigos UNSPSC, coincidencia de términos en el objeto,
 * rango presupuestal y modalidad de contratación.
 */

import type { TenderDTO } from './api';

export interface RecommendedTender {
  tender: TenderDTO;
  matchScore: number;          // 0 - 100
  matchReasons: string[];      // Lista de motivos explicativos
  sourceTag: string;           // Etiqueta destacada (ej: "Por proceso guardado", "Por búsqueda reciente")
}

const SPANISH_STOPWORDS = new Set([
  'de', 'la', 'en', 'el', 'para', 'los', 'las', 'un', 'una', 'del', 'por', 'con', 'se',
  'su', 'al', 'lo', 'como', 'mas', 'más', 'pero', 'sus', 'le', 'ha', 'me', 'si', 'sin',
  'sobre', 'este', 'ya', 'entre', 'cuando', 'todo', 'esta', 'ser', 'nos', 'tambien',
  'también', 'fue', 'era', 'muy', 'hasta', 'desde', 'esta', 'está', 'porque', 'que',
  'qué', 'solo', 'sólo', 'hay', 'puede', 'todos', 'asi', 'así', 'donde', 'cada', 'otro',
  'despues', 'después', 'objeto', 'contrato', 'contratar', 'prestacion', 'prestación',
  'servicios', 'servicio', 'municipio', 'departamento', 'colombia', 'secop', 'proceso'
]);

/**
 * Normaliza y tokeniza texto en español eliminando tildes, signos y stopwords
 */
export function tokenizeText(text?: string): Set<string> {
  if (!text) return new Set();
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');

  const tokens = normalized
    .split(/\s+/)
    .filter(t => t.length >= 3 && !SPANISH_STOPWORDS.has(t));

  return new Set(tokens);
}

/**
 * Calcula el coeficiente de similitud entre dos licitaciones individuales (0 a 100)
 */
export function computeTenderSimilarity(
  target: TenderDTO,
  candidate: TenderDTO
): { score: number; reasons: string[] } {
  const targetId = target.id || target.secop_id || target.process_number;
  const candId = candidate.id || candidate.secop_id || candidate.process_number;

  if (targetId && candId && targetId === candId) {
    return { score: 100, reasons: ['Mismo proceso'] };
  }

  let totalScore = 0;
  const reasons: string[] = [];

  // 1. Similitud UNSPSC (hasta 35 puntos)
  const targetUnspsc = new Set(target.unspsc_codes || []);
  const candUnspsc = new Set(candidate.unspsc_codes || []);
  
  let exactUnspscMatch = 0;
  let prefixUnspscMatch = 0;

  candUnspsc.forEach(code => {
    if (targetUnspsc.has(code)) {
      exactUnspscMatch++;
    } else {
      // Coincidencia de familia (primeros 4 dígitos) o clase (primeros 6 dígitos)
      const prefix4 = code.slice(0, 4);
      targetUnspsc.forEach(tCode => {
        if (tCode.startsWith(prefix4)) prefixUnspscMatch++;
      });
    }
  });

  if (exactUnspscMatch > 0) {
    totalScore += 35;
    reasons.push('Mismo código UNSPSC acreditado');
  } else if (prefixUnspscMatch > 0) {
    totalScore += 22;
    reasons.push('Misma familia de bienes/servicios UNSPSC');
  }

  // 2. Similitud Léxica del Objeto / Título (hasta 35 puntos)
  const targetTokens = tokenizeText(`${target.title || ''} ${target.description || ''}`);
  const candTokens = tokenizeText(`${candidate.title || ''} ${candidate.description || ''}`);

  if (targetTokens.size > 0 && candTokens.size > 0) {
    let commonTokens = 0;
    const matchedWords: string[] = [];

    targetTokens.forEach(token => {
      if (candTokens.has(token)) {
        commonTokens++;
        if (matchedWords.length < 3) matchedWords.push(token);
      }
    });

    const jaccardRatio = commonTokens / Math.min(targetTokens.size, candTokens.size);
    const textPoints = Math.min(35, Math.round(jaccardRatio * 45));
    totalScore += textPoints;

    if (matchedWords.length > 0 && textPoints >= 10) {
      const sample = matchedWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(', ');
      reasons.push(`Afinidad temática (${sample})`);
    }
  }

  // 3. Afinidad de Modalidad (hasta 15 puntos)
  const targetIsMC = Boolean(
    target.is_minima_cuantia ||
    (target.contract_type && target.contract_type.toLowerCase().includes('mínima')) ||
    (target.modalidad_de_contratacion && target.modalidad_de_contratacion.toLowerCase().includes('mínima'))
  );
  const candIsMC = Boolean(
    candidate.is_minima_cuantia ||
    (candidate.contract_type && candidate.contract_type.toLowerCase().includes('mínima')) ||
    (candidate.modalidad_de_contratacion && candidate.modalidad_de_contratacion.toLowerCase().includes('mínima'))
  );

  if (targetIsMC && candIsMC) {
    totalScore += 15;
    reasons.push('Modalidad Mínima Cuantía (Sin RUP)');
  } else if (!targetIsMC && !candIsMC) {
    totalScore += 10;
  }

  // 4. Rango Presupuestal Similar (hasta 15 puntos)
  const tBudget = target.budget_cop || 0;
  const cBudget = candidate.budget_cop || 0;

  if (tBudget > 0 && cBudget > 0) {
    const ratio = Math.min(tBudget, cBudget) / Math.max(tBudget, cBudget);
    if (ratio >= 0.5) {
      totalScore += 15;
      reasons.push('Rango presupuestal comparable');
    } else if (ratio >= 0.25) {
      totalScore += 8;
    }
  }

  // Bonificación por misma Entidad o mismo Departamento
  if (target.entity_name && candidate.entity_name && target.entity_name === candidate.entity_name) {
    totalScore += 10;
    reasons.push(`Misma entidad (${target.entity_name.slice(0, 30)}...)`);
  } else if (target.department && candidate.department && target.department === candidate.department) {
    totalScore += 5;
    reasons.push(`Mismo departamento (${target.department})`);
  }

  const finalScore = Math.min(99, Math.max(10, totalScore));
  return { score: finalScore, reasons };
}

/**
 * Encuentra licitaciones similares a un proceso objetivo específico
 */
export function findSimilarTenders(
  targetTender: TenderDTO,
  candidates: TenderDTO[],
  limit: number = 8
): RecommendedTender[] {
  const targetId = targetTender.id || targetTender.secop_id || targetTender.process_number;

  const evaluated: RecommendedTender[] = [];

  for (const candidate of candidates) {
    const candId = candidate.id || candidate.secop_id || candidate.process_number;
    if (candId === targetId) continue;

    const { score, reasons } = computeTenderSimilarity(targetTender, candidate);
    if (score >= 30) {
      evaluated.push({
        tender: candidate,
        matchScore: score,
        matchReasons: reasons.length > 0 ? reasons : ['Proceso afín por sector y pliego'],
        sourceTag: targetTender.process_number ? `Similar a proceso ${targetTender.process_number}` : 'Proceso afín'
      });
    }
  }

  // Fallback para garantizar siempre al menos 3 a 6 opciones comparables
  if (evaluated.length < 4 && candidates.length > 1) {
    for (const candidate of candidates) {
      const candId = candidate.id || candidate.secop_id || candidate.process_number;
      if (candId === targetId || evaluated.some(e => (e.tender.id || e.tender.secop_id || e.tender.process_number) === candId)) {
        continue;
      }

      const { score, reasons } = computeTenderSimilarity(targetTender, candidate);
      const fallbackReasons = [...reasons];
      if (fallbackReasons.length === 0) {
        if (candidate.is_minima_cuantia) fallbackReasons.push('Modalidad Mínima Cuantía (Sin RUP)');
        fallbackReasons.push('Convocatoria activa comparable en SECOP');
      }

      evaluated.push({
        tender: candidate,
        matchScore: Math.max(35, score),
        matchReasons: fallbackReasons,
        sourceTag: targetTender.process_number ? `Similar a proceso ${targetTender.process_number}` : 'Proceso afín'
      });

      if (evaluated.length >= limit) break;
    }
  }

  return evaluated
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Genera recomendaciones personalizadas para el usuario en el dashboard
 * a partir de sus licitaciones guardadas, búsquedas recientes e intereses.
 */
export function getPersonalizedRecommendations(
  candidates: TenderDTO[] = [],
  savedTenders: TenderDTO[] = [],
  recentSearches: string[] = [],
  recentViews: TenderDTO[] = [],
  limit: number = 6
): RecommendedTender[] {
  if (!candidates || candidates.length === 0) return [];
  const safeSaved = savedTenders || [];
  const safeSearches = recentSearches || [];
  const safeViews = recentViews || [];

  const savedIds = new Set(safeSaved.map(t => t.id || t.secop_id || t.process_number).filter(Boolean));
  
  // Extraer términos de interés acumulados
  const interestTokens = new Set<string>();
  
  safeSearches.forEach(s => {
    tokenizeText(s).forEach(t => interestTokens.add(t));
  });

  safeSaved.forEach(t => {
    tokenizeText(t.title).forEach(tok => interestTokens.add(tok));
  });

  safeViews.slice(0, 5).forEach(t => {
    tokenizeText(t.title).forEach(tok => interestTokens.add(tok));
  });

  // Códigos UNSPSC acumulados de interés
  const interestUnspsc = new Set<string>();
  safeSaved.forEach(t => (t.unspsc_codes || []).forEach(c => interestUnspsc.add(c)));
  safeViews.forEach(t => (t.unspsc_codes || []).forEach(c => interestUnspsc.add(c)));

  const scoredList: RecommendedTender[] = [];

  for (const cand of candidates) {
    const candId = cand.id || cand.secop_id || cand.process_number;
    // Si ya está guardada, no recomendarla de nuevo como descubrimiento
    if (savedIds.has(candId)) continue;

    let bestScore = 0;
    let bestReasons: string[] = [];
    let bestSourceTag = 'Recomendado por afinidad';

    // Comparar contra cada licitación guardada
    for (const saved of savedTenders) {
      const sim = computeTenderSimilarity(saved, cand);
      if (sim.score > bestScore) {
        bestScore = sim.score;
        bestReasons = sim.reasons;
        bestSourceTag = `Por tu interés en: ${(saved.title || '').slice(0, 35)}...`;
      }
    }

    // Si no superó el umbral, comparar contra términos de búsqueda e historial
    if (bestScore < 45 && interestTokens.size > 0) {
      const candTokens = tokenizeText(`${cand.title || ''} ${cand.description || ''}`);
      let tokenOverlap = 0;
      const matched: string[] = [];

      interestTokens.forEach(it => {
        if (candTokens.has(it)) {
          tokenOverlap++;
          if (matched.length < 2) matched.push(it);
        }
      });

      if (tokenOverlap > 0) {
        const searchScore = Math.min(85, 30 + tokenOverlap * 18);
        if (searchScore > bestScore) {
          bestScore = searchScore;
          bestReasons = [
            `Coincide con tus búsquedas (${matched.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(', ')})`
          ];
          bestSourceTag = `Basado en tus búsquedas recientes`;
        }
      }
    }

    // Comprobar coincidencia UNSPSC si aún es baja
    if (bestScore < 45 && interestUnspsc.size > 0) {
      const candCodes = cand.unspsc_codes || [];
      const hasUnspscMatch = candCodes.some(c => interestUnspsc.has(c));
      if (hasUnspscMatch) {
        bestScore = 65;
        bestReasons = ['Afinidad en clasificación UNSPSC de tus procesos'];
        bestSourceTag = 'Por categoría de interés';
      }
    }

    // Modalidad Mínima Cuantía bonificación si el usuario interactúa con ella
    const hasMinimaCuantiaInterest = savedTenders.some(s => s.is_minima_cuantia) || recentViews.some(v => v.is_minima_cuantia);
    if (hasMinimaCuantiaInterest && cand.is_minima_cuantia) {
      bestScore = Math.min(98, bestScore + 12);
      if (!bestReasons.includes('Modalidad Mínima Cuantía (Sin RUP)')) {
        bestReasons.push('Modalidad Mínima Cuantía (Sin RUP)');
      }
    }

    if (bestScore >= 40) {
      scoredList.push({
        tender: cand,
        matchScore: bestScore,
        matchReasons: bestReasons.slice(0, 3),
        sourceTag: bestSourceTag
      });
    }
  }

  return scoredList
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
