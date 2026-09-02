import React from 'react';
import { 
  X, 
  Lock, 
  Sparkles, 
  Check, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Bot, 
  FileCheck, 
  Radio, 
  Database,
  ArrowRight,
  CheckSquare
} from 'lucide-react';
import { PlanId, PLAN_LIMITS_MAP } from '../services/planRestrictions';

export type GateFeatureType = 
  | 'evaluations_limit'
  | 'rag_assistant'
  | 'dossier_generator'
  | 'submission_1click'
  | 'exact_gap_diagnosis'
  | 'checklist_docs'
  | 'realtime_secop'
  | 'addenda_monitoring_247'
  | 'advanced_consortium'
  | 'multi_users';

interface PlanGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureType: GateFeatureType;
  currentPlanId: PlanId;
  onOpenUpgradeModal: () => void;
}

interface FeatureGateInfo {
  title: string;
  subtitle: string;
  requiredPlan: PlanId;
  icon: React.ReactNode;
  highlights: string[];
}

export const PlanGateModal: React.FC<PlanGateModalProps> = ({
  isOpen,
  onClose,
  featureType,
  currentPlanId,
  onOpenUpgradeModal
}) => {
  if (!isOpen) return null;

  const featureDetails: Record<GateFeatureType, FeatureGateInfo> = {
    evaluations_limit: {
      title: 'Límite de 5 Evaluaciones Mensuales Alcanzado',
      subtitle: 'Has alcanzado el tope mensual de 5 licitaciones evaluadas del Plan Explorador RUP.',
      requiredPlan: 'pyme',
      icon: <Lock className="w-6 h-6 text-amber-500" />,
      highlights: [
        'Evaluaciones de compatibilidad ILIMITADAS todos los meses',
        'Ingesta en tiempo real SECOP I, II y Datos Abiertos',
        'Asistente RAG conversacional sobre pliegos (Gemini 1.5 Pro)',
        'Generación de Expediente de Postulación en 1 Clic (Anexo N° 1)'
      ]
    },
    rag_assistant: {
      title: 'Asistente Jurídico IA sobre Pliegos (Gemini 1.5 Pro)',
      subtitle: 'Analiza pliegos, resuelve dudas normativas y consulta habilitación con Inteligencia Artificial.',
      requiredPlan: 'pyme',
      icon: <Bot className="w-6 h-6 text-blue-500" />,
      highlights: [
        'Consultas ilimitadas sobre pliegos, anexos y adendas',
        'Respuestas fundamentadas en Ley 80/1993, 1150/2007 y Decreto 1082/2015',
        'Auditoría instantánea de causales de rechazo vs requisitos subsanables',
        'Evaluaciones de compatibilidad ILIMITADAS'
      ]
    },
    dossier_generator: {
      title: 'Generación de Expediente de Postulación Oficial',
      subtitle: 'Genera la Carta de Presentación (Anexo N° 1), Matriz Financiera, Propuesta Económica y Checklist.',
      requiredPlan: 'pyme',
      icon: <FileCheck className="w-6 h-6 text-blue-500" />,
      highlights: [
        'Expediente completo compilado y formateado en 1 Clic (.ZIP)',
        'Carta de Presentación oficial lista para firma del Representante Legal',
        'Propuesta económica desglosada con A.I.U. automatizada',
        'Matriz de indicadores financieros auditados conforme a pliego'
      ]
    },
    submission_1click: {
      title: 'Radicación Asistida de Oferta en 1 Clic',
      subtitle: 'Postula y radica tus propuestas ante entidades de SECOP I y SECOP II de forma automatizada.',
      requiredPlan: 'pyme',
      icon: <Zap className="w-6 h-6 text-emerald-500" />,
      highlights: [
        'Radicación automática con generación de N° de Radicado oficial',
        'Comprobante y Acta de Radicación con validez jurídica',
        'Historial centralizado de ofertas presentadas con seguimiento en vivo',
        'Evaluaciones de compatibilidad ILIMITADAS'
      ]
    },
    exact_gap_diagnosis: {
      title: 'Matriz Financiera & Diagnóstico Exacto de Brechas RUP',
      subtitle: 'Conoce con precisión matemática los faltantes en SMMLV, liquidez o códigos UNSPSC para habilitarte.',
      requiredPlan: 'pyme',
      icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
      highlights: [
        'Matriz comparativa completa de indicadores financieros y RUP vs pliego',
        'Cálculo exacto del margen faltante en SMMLV y ratios de liquidez y endeudamiento',
        'Identificación automática de códigos UNSPSC no acreditados en RUP',
        'Estrategia personalizada de habilitación directa o Unión Temporal'
      ]
    },
    checklist_docs: {
      title: 'Checklist de Documentos Exigidos & Puntos Fuertes',
      subtitle: 'Auditoría automática de requisitos habilitantes conforme al pliego y Decreto 1082 de 2015.',
      requiredPlan: 'pyme',
      icon: <CheckSquare className="w-6 h-6 text-blue-500" />,
      highlights: [
        'Checklist detallado de documentos jurídicos, técnicos y financieros exigidos',
        'Detección automática de puntos fuertes acreditados por tu empresa',
        'Identificación de requisitos subsanables vs causales de rechazo del pliego',
        'Evaluaciones de compatibilidad ILIMITADAS'
      ]
    },
    realtime_secop: {
      title: 'Ingesta en Tiempo Real SECOP I, II y Datos Abiertos',
      subtitle: 'Acceso a convocatorias de todas las plataformas estatales sincronizadas al instante.',
      requiredPlan: 'pyme',
      icon: <Database className="w-6 h-6 text-blue-500" />,
      highlights: [
        'Búsqueda y monitoreo en SECOP I, SECOP II y Datos Abiertos Colombia',
        'Filtros avanzados por departamento, presupuesto y objeto contractual',
        'Sincronización continua de procesos vigentes',
        'Evaluaciones ILIMITADAS'
      ]
    },
    addenda_monitoring_247: {
      title: 'Monitoreo 24/7 de Adendas y Observaciones SECOP',
      subtitle: 'Detección inmediata de cambios en fechas, presupuestos o pliegos definitivos con alertas en vivo.',
      requiredPlan: 'enterprise',
      icon: <Radio className="w-6 h-6 text-purple-500" />,
      highlights: [
        'Alertas 24/7 ante nuevas adendas o respuestas a observaciones',
        'Recomendaciones avanzadas para Unión Temporal / Consorcios',
        'Múltiples razones sociales y usuarios ILIMITADOS',
        'Instancia dedicada de Agentes LangGraph y SLA 99.9%'
      ]
    },
    advanced_consortium: {
      title: 'Simulador Avanzado de Consorcios y Uniones Temporales',
      subtitle: 'Calcula los porcentajes de participación ideales para sumar capacidades con socios estratégicos.',
      requiredPlan: 'enterprise',
      icon: <Sparkles className="w-6 h-6 text-purple-500" />,
      highlights: [
        'Simulación matemática de sumatoria RUP y ratios consorciales',
        'Recomendación del socio idóneo según la brecha del pliego',
        'Soporte corporativo prioritario 24/7',
        'Múltiples empresas y razones sociales ILIMITADAS'
      ]
    },
    multi_users: {
      title: 'Usuarios Adicionales de la Empresa',
      subtitle: 'Colabora en equipo para evaluar pliegos y preparar postulaciones simultáneamente.',
      requiredPlan: 'pyme',
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      highlights: [
        'Hasta 3 usuarios en Plan Pyme Contratista',
        'Usuarios y razones sociales ILIMITADAS en Plan Enterprise Consorcios',
        'Evaluaciones y expedientes colaborativos'
      ]
    }
  };

  const gate = featureDetails[featureType] || featureDetails.evaluations_limit;
  const isEnterpriseRequired = gate.requiredPlan === 'enterprise';
  const targetPlanName = isEnterpriseRequired ? 'Plan Enterprise Consorcios' : 'Plan Pyme Contratista';
  const targetPrice = isEnterpriseRequired ? '$690.000' : '$290.000';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ENCABEZADO MODAL */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              isEnterpriseRequired ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
            }`}>
              {gate.icon}
            </div>
            <div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isEnterpriseRequired ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
              }`}>
                Función {targetPlanName}
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                {gate.title}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DESCRIPCIÓN */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {gate.subtitle}
        </p>

        {/* BENEFICIOS DEL PLAN DESTINO */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Lo que obtienes al actualizar a {targetPlanName}:
          </p>
          <ul className="space-y-2">
            {gate.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* TARJETA DE PRECIO Y ACCIÓN */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Desde</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900 dark:text-white">{targetPrice}</span>
              <span className="text-[11px] text-slate-500 font-medium">COP / mes</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenUpgradeModal();
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-1.5 transition-all ${
                isEnterpriseRequired 
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Ver Planes & Actualizar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
