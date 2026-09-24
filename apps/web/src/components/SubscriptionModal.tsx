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
import { 
  SAAS_PLANS, 
  Plan, 
  initiateWompiCheckout
} from '../services/payments';
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
  organizationId?: string;
  companyName?: string;
  companyNit?: string;
  onPlanUpgraded: (newPlanId: PlanId) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentPlanId,
  userEmail = 'empresa@dominio.com',
  organizationId,
  companyName,
  companyNit,
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
      const res = await initiateWompiCheckout(
        plan, 
        isYearly, 
        userEmail, 
        organizationId,
        {
          fullName: companyName || 'Empresa Contratista LicitIA',
          nit: companyNit || '901452890'
        }
      );
      setProcessingPlanId(null);

      if (res.status === 'success') {
        storePlanId(plan.id);
        setSuccessMsg(`¡Suscripción al ${plan.name} activada exitosamente con Wompi!`);
        onPlanUpgraded(plan.id);
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1800);
      } else if (res.status === 'pending') {
        setSuccessMsg('Tu pago por PSE/Transferencia está en validación por tu banco. Tu plan se activará en cuanto se confirme.');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 3200);
      } else if (res.status === 'declined') {
        alert(res.message || 'La transacción no fue aprobada por la entidad financiera.');
      }
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
                  Uso actual en Plan Explorador RUP: {Math.min(usage.count, freeLimit)} de {freeLimit} evaluaciones mensuales
                </span>
                <span className="text-amber-800 dark:text-amber-300 text-[11px] block">
                  {usage.count >= freeLimit 
                    ? '⚠️ Has alcanzado el límite mensual (5/5). Actualiza a Plan Pyme Contratista para evaluaciones ILIMITADAS.'
                    : `Te quedan ${freeLimit - usage.count} evaluación(es) disponibles para este mes.`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-amber-200 dark:bg-amber-900 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${usage.count >= freeLimit ? 'bg-rose-500' : 'bg-amber-600'}`} 
                  style={{ width: `${Math.min(100, (Math.min(usage.count, freeLimit) / freeLimit) * 100)}%` }}
                />
              </div>
              <span className="font-bold text-amber-900 dark:text-amber-200 text-[11px] font-mono">
                {Math.min(usage.count, freeLimit)}/{freeLimit}
              </span>
            </div>
          </div>
        )}

        {/* SELECTOR DE FACTURACIÓN MENSUAL vs ANUAL (20% DESCUENTO) */}
        <div className="flex flex-col items-center gap-1.5 mx-auto">
          <div className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit text-xs">
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
          <p className="text-[11px] text-slate-500 text-center">
            {isYearly 
              ? '💡 En facturación anual pagas los 12 meses por anticipado con 20% de descuento (ahorras más de 2 meses en el año).'
              : 'Cobro mensual recurrente sin permanencia. Cancela o cambia de plan en cualquier momento.'}
          </p>
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

            return (
              <div 
                key={plan.id}
                className={`rounded-3xl p-5 border flex flex-col justify-between relative transition-all ${
                  isCurrent
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/30'
                    : plan.isEnterprise
                    ? 'border-purple-300 dark:border-purple-600/80 bg-gradient-to-b from-purple-50/40 via-white to-indigo-50/20 dark:from-purple-950/30 dark:via-slate-950 dark:to-indigo-950/20 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30'
                    : plan.recommended
                    ? 'border-blue-500 dark:border-blue-500/80 bg-white dark:bg-slate-950 shadow-md ring-1 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                }`}
              >
                {plan.highlightBadge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-white text-[10px] font-bold rounded-full shadow-xs flex items-center gap-1 ${
                    plan.isEnterprise
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-500/30 ring-1 ring-white/20'
                      : 'bg-blue-600'
                  }`}>
                    {plan.isEnterprise && <Sparkles className="w-3 h-3 text-purple-200" />}
                    <span>{plan.highlightBadge}</span>
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {plan.isEnterprise && (
                          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        )}
                        <h4 className={`font-bold text-sm ${
                          plan.isEnterprise ? 'text-purple-950 dark:text-purple-100 font-extrabold' : 'text-slate-900 dark:text-white'
                        }`}>{plan.name}</h4>
                      </div>
                      {isCurrent && (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md">
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>
                  </div>

                  <div className="border-t border-b border-slate-100 dark:border-slate-800 py-3 space-y-2">
                    {plan.id === 'free' ? (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">$0</span>
                          <span className="text-slate-400 text-xs font-medium">COP / mes</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Gratis para siempre</p>
                      </div>
                    ) : !isYearly ? (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            ${plan.priceMonthlyCOP.toLocaleString('es-CO')}
                          </span>
                          <span className="text-slate-400 text-xs font-medium">COP / mes</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          Facturación mensual. Sin cláusulas de permanencia.
                        </p>
                      </div>
                    ) : (
                      <div>
                        {/* Costo mensual equivalente con descuento vs precio normal tachado */}
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            ${(plan.priceYearlyCOP / 12).toLocaleString('es-CO')}
                          </span>
                          <span className="text-slate-500 text-xs font-medium">COP / mes</span>
                          <span className="text-xs text-slate-400 line-through">
                            ${plan.priceMonthlyCOP.toLocaleString('es-CO')}/mes
                          </span>
                        </div>

                        {/* Desglose total del pago anual y ahorro */}
                        <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Cobro único anual (12 meses):</span>
                            <span className="font-black text-slate-900 dark:text-white">${plan.priceYearlyCOP.toLocaleString('es-CO')} COP</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span>Ahorro total con 20% OFF:</span>
                            <span>-${((plan.priceMonthlyCOP * 12) - plan.priceYearlyCOP).toLocaleString('es-CO')} COP/año</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CARACTERÍSTICAS INCLUIDAS */}
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {plan.features.map((feat, idx) => {
                      const isFirstEnterpriseFeat = plan.isEnterprise && idx === 0;
                      return (
                        <li key={idx} className={`flex items-start gap-2 text-[11px] ${
                          isFirstEnterpriseFeat ? 'font-bold text-purple-900 dark:text-purple-200 pb-1 border-b border-purple-100 dark:border-purple-900/50' : ''
                        }`}>
                          <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            plan.isEnterprise 
                              ? 'text-purple-600 dark:text-purple-400' 
                              : 'text-blue-600 dark:text-blue-400'
                          }`} />
                          <span>{feat}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* BOTÓN SELECCIONAR PLAN WIDGET WOMPI */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent || processingPlanId === plan.id}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all mt-6 flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default border border-slate-200 dark:border-slate-700'
                      : plan.isEnterprise
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-md shadow-purple-500/25 ring-1 ring-purple-400/30'
                      : plan.recommended
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {processingPlanId === plan.id ? (
                    <span>Abriendo pasarela Wompi...</span>
                  ) : isCurrent ? (
                    <span>Plan Actual Activo</span>
                  ) : plan.id === 'free' ? (
                    <span>Seleccionar Plan Gratis</span>
                  ) : plan.isEnterprise ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                      <span>
                        {isYearly 
                          ? `Activar Enterprise ($${plan.priceYearlyCOP.toLocaleString('es-CO')} COP/año)` 
                          : `Activar Enterprise ($${plan.priceMonthlyCOP.toLocaleString('es-CO')} COP/mes)`}
                      </span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>
                        {isYearly 
                          ? `Pagar $${plan.priceYearlyCOP.toLocaleString('es-CO')} COP (1 Año completo)` 
                          : `Pagar $${plan.priceMonthlyCOP.toLocaleString('es-CO')} COP / mes`}
                      </span>
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
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Modo Sandbox (Pruebas)
            </span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <span>PSE</span> • <span>Nequi</span> • <span>Bancolombia</span> • <span>Visa/Mastercard</span>
          </div>
        </div>


      </div>
    </div>
  );
};
