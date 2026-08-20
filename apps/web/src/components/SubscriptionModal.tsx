import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  Zap, 
  ArrowRight, 
  CheckCircle2,
  Building2,
  Lock,
  BarChart3
} from 'lucide-react';
import { SAAS_PLANS, Plan, initiateWompiCheckout } from '../services/payments';
import { 
  PlanId, 
  storePlanId, 
  getMonthlyEvaluationsUsage, 
  PLAN_LIMITS_MAP 
} from '../services/planRestrictions';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId: PlanId;
  userEmail?: string;
  onPlanUpgraded: (newPlanId: PlanId) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentPlanId,
  userEmail = 'empresa@dominio.com',
  onPlanUpgraded
}) => {
  const [isYearly, setIsYearly] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const usage = getMonthlyEvaluationsUsage();
  const freeLimit = PLAN_LIMITS_MAP.free.maxMonthlyEvaluations;

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === currentPlanId) return;

    if (plan.id === 'free') {
      storePlanId('free');
      onPlanUpgraded('free');
      setSuccessMsg('¡Has cambiado al Plan Explorador RUP (Gratuito)!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
      return;
    }

    setProcessingPlanId(plan.id);

    try {
      const res: any = await initiateWompiCheckout(plan, isYearly, userEmail);
      setProcessingPlanId(null);
      storePlanId(plan.id);
      setSuccessMsg(`¡Suscripción al ${plan.name} activada exitosamente con Wompi!`);
      onPlanUpgraded(plan.id);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      setProcessingPlanId(null);
      alert('Error en la pasarela de pagos Wompi. Inténtelo nuevamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full p-6 space-y-6 overflow-y-auto max-h-[92vh]">
        
        {/* ENCABEZADO Y CONMUTADOR ANUAL/MENSUAL */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-full border border-blue-200">
                  SUSCRIPCIÓN OFICIAL
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Planes y Precios Emotiva LicitIA
                </h3>
              </div>
              <p className="text-xs text-slate-500">Selecciona el plan que se adapte a tu volumen de postulación a licitaciones públicas.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* INDICADOR DE CONSUMO EN PLAN GRATUITO */}
        {currentPlanId === 'free' && (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold text-amber-950 dark:text-amber-200">
                  Uso actual en Plan Explorador RUP: {usage.count} de {freeLimit} evaluaciones mensuales
                </span>
                <span className="text-amber-800 dark:text-amber-300 text-[11px] block">
                  {usage.count >= freeLimit 
                    ? '⚠️ Has alcanzado el límite mensual. Actualiza a Plan Pyme Contratista para evaluaciones ILIMITADAS.'
                    : `Te quedan ${freeLimit - usage.count} evaluación(es) disponibles para este mes.`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-24 bg-amber-200 dark:bg-amber-900 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${usage.count >= freeLimit ? 'bg-rose-500' : 'bg-amber-600'}`} 
                  style={{ width: `${Math.min(100, (usage.count / freeLimit) * 100)}%` }}
                />
              </div>
              <span className="font-bold text-amber-900 dark:text-amber-200 text-[11px] font-mono">
                {usage.count}/{freeLimit}
              </span>
            </div>
          </div>
        )}

        {/* SELECTOR DE FACTURACIÓN MENSUAL vs ANUAL (20% DESCUENTO) */}
        <div className="flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit mx-auto text-xs">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-4 py-1.5 rounded-xl font-semibold transition-colors ${
              !isYearly 
                ? 'bg-blue-600 text-white shadow-xs font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Facturación Mensual
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-4 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 ${
              isYearly 
                ? 'bg-blue-600 text-white shadow-xs font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Facturación Anual</span>
            <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
              isYearly ? 'bg-blue-800 text-blue-100' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              Ahorra 20%
            </span>
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* REJILLA DE PLANES SAAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAAS_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const price = isYearly ? plan.priceYearlyCOP / 12 : plan.priceMonthlyCOP;

            return (
              <div 
                key={plan.id}
                className={`rounded-3xl p-5 border flex flex-col justify-between relative transition-all ${
                  isCurrent
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/30'
                    : plan.recommended
                    ? 'border-blue-500 dark:border-blue-500/80 bg-white dark:bg-slate-950 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                }`}
              >
                {plan.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-xs">
                    MÁS POPULAR
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{plan.name}</h4>
                      {isCurrent && (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md">
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>
                  </div>

                  <div className="border-t border-b border-slate-100 dark:border-slate-800 py-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        ${price.toLocaleString('es-CO')}
                      </span>
                      <span className="text-slate-400 text-xs font-medium">COP / mes</span>
                    </div>
                    {isYearly && plan.priceYearlyCOP > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        Facturado anualmente (${plan.priceYearlyCOP.toLocaleString('es-CO')} COP/año)
                      </p>
                    )}
                  </div>

                  {/* CARACTERÍSTICAS INCLUIDAS */}
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px]">
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* BOTÓN SELECCIONAR PLAN WIDGET WOMPI */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent || processingPlanId === plan.id}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all mt-6 flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default border border-slate-200 dark:border-slate-700'
                      : plan.recommended
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {processingPlanId === plan.id ? (
                    <span>Abriendo Wompi...</span>
                  ) : isCurrent ? (
                    <span>Plan Actual Activo</span>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{plan.id === 'free' ? 'Seleccionar Plan Gratis' : 'Pagar con Wompi / PSE / Nequi'}</span>
                    </>
                  )}
                </button>

              </div>
            );
          })}
        </div>

        {/* PIE DE PÁGINA MEDIOS DE PAGO COLOMBIA */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Pagos procesados de forma 100% segura por <strong>Wompi Bancolombia</strong>.</span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <span>PSE</span> • <span>Nequi</span> • <span>Bancolombia</span> • <span>Visa/Mastercard</span>
          </div>
        </div>

      </div>
    </div>
  );
};
