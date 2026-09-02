/**
 * Servicio de Control de Restricciones y Límites por Plan SaaS (Emotiva LicitIA)
 * 
 * Planes:
 * 1. 'free': Plan Explorador RUP ($0 COP/mes)
 *    - Hasta 5 evaluaciones de licitaciones por mes
 *    - 1 Usuario administrador
 *    - Buscador SECOP II básico
 *    - Diagnóstico financiero de Liquidez y Endeudamiento
 * 
 * 2. 'pyme': Plan Pyme Contratista ($290.000 COP/mes)
 *    - Evaluaciones de compatibilidad ILIMITADAS
 *    - 3 Usuarios de la empresa
 *    - Ingesta en tiempo real SECOP I, II y Datos Abiertos
 *    - Diagnóstico exacto de brechas ("¿Qué le falta a tu empresa?")
 *    - Asistente RAG conversacional sobre pliegos (Gemini 1.5 Pro)
 *    - Generación de Expediente de Postulación en 1 Clic (Anexo N° 1)
 * 
 * 3. 'enterprise': Plan Enterprise Consorcios ($690.000 COP/mes)
 *    - Todo lo del Plan Pyme Contratista
 *    - Usuarios y razones sociales ILIMITADAS
 *    - Monitoreo 24/7 de adendas y observaciones SECOP
 *    - Recomendaciones avanzadas para Unión Temporal / Consorcio
 *    - Soporte prioritario 24/7 y SLA del 99.9%
 *    - Instancia dedicada de Agentes LangGraph
 */

export type PlanId = 'free' | 'pyme' | 'enterprise';

export interface PlanLimits {
  id: PlanId;
  name: string;
  maxMonthlyEvaluations: number; // 5 o Infinity
  maxUsers: number;              // 1, 3 o Infinity
  allowedPlatforms: ('SECOP_I' | 'SECOP_II' | 'all')[];
  hasExactGapDiagnosis: boolean;
  hasChecklistDocs: boolean;
  hasRagAssistant: boolean;
  hasDossierGenerator: boolean;
  has1ClickSubmission: boolean;
  hasRealtimeIngestion: boolean;
  hasAddendaMonitoring247: boolean;
  hasAdvancedConsortium: boolean;
  hasDedicatedLangGraph: boolean;
}

export const PLAN_LIMITS_MAP: Record<PlanId, PlanLimits> = {
  free: {
    id: 'free',
    name: 'Plan Explorador RUP',
    maxMonthlyEvaluations: 5,
    maxUsers: 1,
    allowedPlatforms: ['SECOP_II'],
    hasExactGapDiagnosis: false,
    hasChecklistDocs: false,
    hasRagAssistant: false,
    hasDossierGenerator: false,
    has1ClickSubmission: false,
    hasRealtimeIngestion: false,
    hasAddendaMonitoring247: false,
    hasAdvancedConsortium: false,
    hasDedicatedLangGraph: false
  },
  pyme: {
    id: 'pyme',
    name: 'Plan Pyme Contratista',
    maxMonthlyEvaluations: Infinity,
    maxUsers: 3,
    allowedPlatforms: ['SECOP_I', 'SECOP_II', 'all'],
    hasExactGapDiagnosis: true,
    hasChecklistDocs: true,
    hasRagAssistant: true,
    hasDossierGenerator: true,
    has1ClickSubmission: true,
    hasRealtimeIngestion: true,
    hasAddendaMonitoring247: false,
    hasAdvancedConsortium: false,
    hasDedicatedLangGraph: false
  },
  enterprise: {
    id: 'enterprise',
    name: 'Plan Enterprise Consorcios',
    maxMonthlyEvaluations: Infinity,
    maxUsers: Infinity,
    allowedPlatforms: ['SECOP_I', 'SECOP_II', 'all'],
    hasExactGapDiagnosis: true,
    hasChecklistDocs: true,
    hasRagAssistant: true,
    hasDossierGenerator: true,
    has1ClickSubmission: true,
    hasRealtimeIngestion: true,
    hasAddendaMonitoring247: true,
    hasAdvancedConsortium: true,
    hasDedicatedLangGraph: true
  }
};

const STORAGE_PLAN_KEY = 'licitia_current_plan';
const STORAGE_EVALUATIONS_KEY = 'licitia_monthly_evaluations';

/**
 * Obtiene el plan actual guardado o por defecto 'pyme'
 */
export function getStoredPlanId(): PlanId {
  try {
    const saved = localStorage.getItem(STORAGE_PLAN_KEY) as PlanId;
    if (saved && ['free', 'pyme', 'enterprise'].includes(saved)) {
      return saved;
    }
  } catch (e) {
    console.error('Error reading stored plan:', e);
  }
  return 'pyme';
}

/**
 * Guarda el plan seleccionado
 */
export function storePlanId(planId: PlanId): void {
  try {
    localStorage.setItem(STORAGE_PLAN_KEY, planId);
  } catch (e) {
    console.error('Error saving plan:', e);
  }
}

/**
 * Obtiene la clave de mes actual (ej: "2026-08")
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

interface MonthlyEvaluationsData {
  monthKey: string;
  evaluatedTenderIds: string[];
}

/**
 * Obtiene las evaluaciones consumidas en el mes actual
 */
export function getMonthlyEvaluationsUsage(): { count: number; evaluatedTenderIds: string[] } {
  try {
    const currentMonth = getCurrentMonthKey();
    const raw = localStorage.getItem(STORAGE_EVALUATIONS_KEY);
    if (raw) {
      const parsed: MonthlyEvaluationsData = JSON.parse(raw);
      if (parsed.monthKey === currentMonth) {
        return {
          count: parsed.evaluatedTenderIds.length,
          evaluatedTenderIds: parsed.evaluatedTenderIds
        };
      }
    }
  } catch (e) {
    console.error('Error reading evaluations usage:', e);
  }
  return { count: 0, evaluatedTenderIds: [] };
}

/**
 * Registra una licitación como evaluada en el mes actual si no estaba registrada
 */
export function recordTenderEvaluation(tenderId: string): { count: number; isNew: boolean } {
  try {
    const currentMonth = getCurrentMonthKey();
    const usage = getMonthlyEvaluationsUsage();
    
    if (!usage.evaluatedTenderIds.includes(tenderId)) {
      const updatedIds = [...usage.evaluatedTenderIds, tenderId];
      const data: MonthlyEvaluationsData = {
        monthKey: currentMonth,
        evaluatedTenderIds: updatedIds
      };
      localStorage.setItem(STORAGE_EVALUATIONS_KEY, JSON.stringify(data));
      return { count: updatedIds.length, isNew: true };
    }
    return { count: usage.evaluatedTenderIds.length, isNew: false };
  } catch (e) {
    console.error('Error recording tender evaluation:', e);
    return { count: 0, isNew: false };
  }
}

/**
 * Reinicia el contador de evaluaciones (útil para pruebas o cambio de plan)
 */
export function resetMonthlyEvaluations(): void {
  try {
    const data: MonthlyEvaluationsData = {
      monthKey: getCurrentMonthKey(),
      evaluatedTenderIds: []
    };
    localStorage.setItem(STORAGE_EVALUATIONS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error resetting evaluations:', e);
  }
}

/**
 * Verifica si el usuario puede evaluar una licitación
 */
export function canEvaluateTender(planId: PlanId, tenderId: string): { allowed: boolean; remaining: number; total: number } {
  const limits = PLAN_LIMITS_MAP[planId];
  if (limits.maxMonthlyEvaluations === Infinity) {
    return { allowed: true, remaining: Infinity, total: Infinity };
  }

  const usage = getMonthlyEvaluationsUsage();
  const isAlreadyEvaluated = usage.evaluatedTenderIds.includes(tenderId);
  
  if (isAlreadyEvaluated) {
    return { 
      allowed: true, 
      remaining: Math.max(0, limits.maxMonthlyEvaluations - usage.count),
      total: limits.maxMonthlyEvaluations 
    };
  }

  if (usage.count < limits.maxMonthlyEvaluations) {
    return { 
      allowed: true, 
      remaining: limits.maxMonthlyEvaluations - usage.count,
      total: limits.maxMonthlyEvaluations 
    };
  }

  return { allowed: false, remaining: 0, total: limits.maxMonthlyEvaluations };
}
