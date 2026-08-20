import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  X,
  FileCheck,
  RefreshCw
} from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (companyData: any) => void;
  initialCompanyName?: string;
  initialNit?: string;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ 
  isOpen, 
  onClose, 
  onComplete,
  initialCompanyName,
  initialNit
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState(initialCompanyName || 'Nuevas Tecnologías S.A.S.');
  const [nit, setNit] = useState(initialNit || '901.888.777-2');
  const [sector, setSector] = useState('Tecnología e Ingeniería de Software');

  // Actualizar valores iniciales si cambian las props
  React.useEffect(() => {
    if (initialCompanyName) setCompanyName(initialCompanyName);
    if (initialNit) setNit(initialNit);
  }, [initialCompanyName, initialNit, isOpen]);

  // Financial Metrics
  const [currentAssets, setCurrentAssets] = useState(920000000);     // $920M
  const [currentLiabilities, setCurrentLiabilities] = useState(420000000); // $420M -> Liquidez 2.19
  const [totalAssets, setTotalAssets] = useState(1400000000);
  const [totalLiabilities, setTotalLiabilities] = useState(510000000); // Endeudamiento 36.4%
  const [smmlvExperience, setSmmlvExperience] = useState(1250.0);
  const [unspscCodes, setUnspscCodes] = useState('80101500, 81111500, 43230000');

  if (!isOpen) return null;

  const handleSimulatePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsParsingPdf(true);

    // Simulación del Parser/OCR Agent extrayendo RUP
    setTimeout(() => {
      setIsParsingPdf(false);
      setPdfUploaded(true);
      setCurrentAssets(1150000000);
      setCurrentLiabilities(480000000);
      setTotalAssets(1600000000);
      setTotalLiabilities(550000000);
      setSmmlvExperience(1480.0);
      setUnspscCodes('80101500, 81111500, 43230000, 72151500');
    }, 1200);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      name: companyName,
      nit: nit,
      sector: sector,
      current_assets: Number(currentAssets),
      current_liabilities: Number(currentLiabilities),
      total_assets: Number(totalAssets),
      total_liabilities: Number(totalLiabilities),
      operating_income: 220000000,
      interest_expense: 25000000,
      smmlv_experience: Number(smmlvExperience),
      unspsc_codes: unspscCodes.split(',').map(c => c.trim()).filter(Boolean)
    };
    onComplete(finalData);
  };

  const calculatedLiquidity = currentLiabilities > 0 
    ? (currentAssets / currentLiabilities).toFixed(2)
    : '0.00';

  const calculatedDebt = totalAssets > 0 
    ? ((totalLiabilities / totalAssets) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 overflow-y-auto max-h-[90vh]">
        
        {/* ENCABEZADO Y STEPS */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Asistente de Onboarding RUP
              </h3>
              <p className="text-xs text-slate-500">Paso {step} de 3: {step === 1 ? 'Información General' : step === 2 ? 'Carga RUP / Estados Financieros' : 'Confirmación Matriz RUP'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROGRESO STEPS */}
        <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold">
          <div className={`p-2.5 rounded-xl border text-center transition-colors ${step >= 1 ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
            1. Datos Empresa
          </div>
          <div className={`p-2.5 rounded-xl border text-center transition-colors ${step >= 2 ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
            2. Carga RUP (PDF)
          </div>
          <div className={`p-2.5 rounded-xl border text-center transition-colors ${step === 3 ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
            3. Matriz RUP Activa
          </div>
        </div>

        {/* PASO 1: DATOS GENERALES */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Razón Social de la Empresa</label>
              <input 
                type="text" 
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Ej: Emotiva Tech S.A.S."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">NIT de la Empresa</label>
              <input 
                type="text" 
                value={nit}
                onChange={e => setNit(e.target.value)}
                placeholder="Ej: 901.452.890-1"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Sector Económico</label>
              <input 
                type="text" 
                value={sector}
                onChange={e => setSector(e.target.value)}
                placeholder="Ej: Tecnología e Ingeniería de Software"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Continuar a Carga RUP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: CARGA PDF RUP O DILIGENCIAMIENTO MANUAL */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            
            {/* CARGA PDF CON PARSER/OCR AUTOMÁTICO */}
            <div className="p-5 rounded-2xl border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 text-center space-y-2">
              {isParsingPdf ? (
                <div className="space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
                  <p className="font-bold text-slate-800 dark:text-slate-200">Procesando Certificado RUP con OCR...</p>
                  <p className="text-[11px] text-slate-500">Extrayendo Activo Corriente, Pasivo Corriente, SMMLV y UNSPSC...</p>
                </div>
              ) : pdfUploaded ? (
                <div className="space-y-1">
                  <FileCheck className="w-6 h-6 mx-auto text-emerald-600" />
                  <p className="font-bold text-emerald-800 dark:text-emerald-400">¡Certificado RUP Procesado por IA!</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">Cifras extraídas automáticamente del documento PDF.</p>
                </div>
              ) : (
                <label className="cursor-pointer block space-y-1">
                  <Upload className="w-6 h-6 mx-auto text-blue-600 dark:text-blue-400" />
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Arrastra o selecciona el PDF del RUP de tu empresa</p>
                  <p className="text-[11px] text-slate-500">La IA extraerá automáticamente tus indicadores financieros y códigos UNSPSC.</p>
                  <input type="file" accept=".pdf" onChange={handleSimulatePdfUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* FORMULARIO DE REVISIÓN / MANUAL */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Cifras Financieras y RUP Extraídas
                </h4>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Liquidez: {calculatedLiquidity} | Endeudamiento: {calculatedDebt}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Activo Corriente (COP)</label>
                  <input 
                    type="number" 
                    value={currentAssets}
                    onChange={e => setCurrentAssets(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Pasivo Corriente (COP)</label>
                  <input 
                    type="number" 
                    value={currentLiabilities}
                    onChange={e => setCurrentLiabilities(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Experiencia SMMLV RUP</label>
                  <input 
                    type="number" 
                    value={smmlvExperience}
                    onChange={e => setSmmlvExperience(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Códigos UNSPSC</label>
                  <input 
                    type="text" 
                    value={unspscCodes}
                    onChange={e => setUnspscCodes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button 
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Atrás
              </button>
              <button 
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Revisar Matriz RUP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        )}

        {/* PASO 3: CONFIRMACIÓN Y ACTIVACIÓN DEL PERFIL */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 text-xs">
            <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span>Resumen de Capacidad RUP lista para Matching SECOP</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px]">Empresa:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{companyName} ({nit})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Índice de Liquidez:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{calculatedLiquidity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Índice de Endeudamiento:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{calculatedDebt}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Experiencia RUP:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{smmlvExperience} SMMLV</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Atrás
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors"
              >
                <span>Activar Perfil y Evaluar Licitaciones SECOP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
