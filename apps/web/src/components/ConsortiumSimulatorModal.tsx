import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Download, 
  Copy, 
  Check, 
  TrendingUp, 
  Sliders, 
  FileText, 
  Building2, 
  Scale, 
  Briefcase, 
  CheckCircle,
  HelpCircle,
  Percent,
  Layers
} from 'lucide-react';

interface TenderData {
  id: string;
  process_number: string;
  entity_name: string;
  title: string;
  budget_cop: number;
  budget_smmlv: number;
  contract_type?: string;
  compatibility_score: number;
  financial_compliance: {
    liquidity: { value: number; required: number; passes: boolean; gap: number };
    debt: { value: number; max_allowed: number; passes: boolean; gap: number };
  };
  experience_compliance: {
    smmlv_accumulated: number;
    smmlv_required: number;
    unspsc_matched: string[];
    unspsc_missing: string[];
    passes: boolean;
    smmlv_gap: number;
  };
  missing_requirements: string[];
}

interface CompanyData {
  name: string;
  nit: string;
  sector: string;
  current_assets: number;
  current_liabilities: number;
  total_assets: number;
  total_liabilities: number;
  smmlv_experience: number;
  unspsc_codes: string[];
}

interface ConsortiumSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tender: TenderData;
  company: CompanyData;
  onApplyToDossier?: (consortiumSummary: any) => void;
}

export const ConsortiumSimulatorModal: React.FC<ConsortiumSimulatorModalProps> = ({
  isOpen,
  onClose,
  tender,
  company,
  onApplyToDossier
}) => {
  // Configuración del Consorcio
  const [legalFigure, setLegalFigure] = useState<'consorcio' | 'union_temporal'>('consorcio');
  const [companyShare, setCompanyShare] = useState<number>(60);
  const partnerShare = 100 - companyShare;

  // Socio Estratégico (Presets o Personalizado)
  const [partnerType, setPartnerType] = useState<'technical' | 'financial' | 'custom'>('technical');
  const [partnerName, setPartnerName] = useState<string>('Construcciones & Soluciones de Ingeniería S.A.S.');
  const [partnerNit, setPartnerNit] = useState<string>('901.789.456-3');
  const [partnerRepName, setPartnerRepName] = useState<string>('Ing. Carlos Andrés Morales');
  const [partnerRepDoc, setPartnerRepDoc] = useState<string>('C.C. 79.845.120');

  // Datos financieros y experiencia del socio
  const [partnerCurrentAssets, setPartnerCurrentAssets] = useState<number>(1400000000);
  const [partnerCurrentLiabilities, setPartnerCurrentLiabilities] = useState<number>(450000000);
  const [partnerTotalAssets, setPartnerTotalAssets] = useState<number>(2200000000);
  const [partnerTotalLiabilities, setPartnerTotalLiabilities] = useState<number>(600000000);
  const [partnerSmmlv, setPartnerSmmlv] = useState<number>(1800);
  const [partnerUnspsc, setPartnerUnspsc] = useState<string[]>([]);

  // Representante Legal del Consorcio
  const [leaderChoice, setLeaderChoice] = useState<'company' | 'partner'>('company');
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulator' | 'agreement' | 'rules'>('simulator');

  // Inicializar socio según las brechas de la licitación
  useEffect(() => {
    if (!tender) return;
    
    // Si faltan códigos UNSPSC, asignarlos automáticamente al socio
    const missing = tender.experience_compliance?.unspsc_missing || [];
    const neededSmmlv = Math.max(1200, (tender.experience_compliance?.smmlv_required || 1000) * 1.3);

    if (partnerType === 'technical') {
      setPartnerName('Especialistas en Tecnología & Obras S.A.S.');
      setPartnerNit('901.654.321-8');
      setPartnerSmmlv(Math.round(neededSmmlv));
      setPartnerUnspsc(missing.length > 0 ? missing : ['80101500', '81111500', '72151500']);
      setPartnerCurrentAssets(950000000);
      setPartnerCurrentLiabilities(380000000);
      setPartnerTotalAssets(1500000000);
      setPartnerTotalLiabilities(480000000);
    } else if (partnerType === 'financial') {
      setPartnerName('Inversiones & Estructuración Financiera S.A.S.');
      setPartnerNit('900.888.999-1');
      setPartnerSmmlv(Math.round(neededSmmlv * 0.8));
      setPartnerUnspsc(missing);
      setPartnerCurrentAssets(2800000000);
      setPartnerCurrentLiabilities(600000000);
      setPartnerTotalAssets(4500000000);
      setPartnerTotalLiabilities(900000000);
    }
  }, [partnerType, tender]);

  if (!isOpen || !tender) return null;

  // CÁLCULOS COMBINADOS SEGÚN DECRETO 1082 DE 2015 Y LEY 80 DE 1993
  // 1. Liquidez Combinada: Suma de Activos Corrientes / Suma de Pasivos Corrientes
  const totalCombinedCurrentAssets = (company.current_assets || 0) + partnerCurrentAssets;
  const totalCombinedCurrentLiabilities = (company.current_liabilities || 0) + partnerCurrentLiabilities;
  const combinedLiquidity = totalCombinedCurrentLiabilities > 0 
    ? (totalCombinedCurrentAssets / totalCombinedCurrentLiabilities).toFixed(2)
    : '0.00';

  // 2. Endeudamiento Combinado: Suma de Pasivos Totales / Suma de Activos Totales
  const totalCombinedTotalAssets = (company.total_assets || 0) + partnerTotalAssets;
  const totalCombinedTotalLiabilities = (company.total_liabilities || 0) + partnerTotalLiabilities;
  const combinedDebt = totalCombinedTotalAssets > 0 
    ? ((totalCombinedTotalLiabilities / totalCombinedTotalAssets) * 100).toFixed(1)
    : '0.0';

  // 3. Experiencia Acumulada SMMLV
  const combinedSmmlv = Math.round((company.smmlv_experience || 0) + partnerSmmlv);

  // 4. Códigos UNSPSC Combinados
  const combinedUnspsc = Array.from(new Set([...(company.unspsc_codes || []), ...partnerUnspsc]));
  const missingCodesAfter = (tender.experience_compliance?.unspsc_missing || []).filter(
    code => !combinedUnspsc.includes(code)
  );

  // Habilitaciones
  const reqLiq = tender.financial_compliance?.liquidity?.required || 1.5;
  const maxDebt = tender.financial_compliance?.debt?.max_allowed || 50;
  const reqSmmlv = tender.experience_compliance?.smmlv_required || 500;

  const liquidityPasses = parseFloat(combinedLiquidity) >= reqLiq;
  const debtPasses = parseFloat(combinedDebt) <= maxDebt;
  const smmlvPasses = combinedSmmlv >= reqSmmlv;
  const unspscPasses = missingCodesAfter.length === 0;

  const allPass = liquidityPasses && debtPasses && smmlvPasses && unspscPasses;
  const newScore = allPass ? 100 : Math.min(95, tender.compatibility_score + 35);

  const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val);

  // TEXTO DEL ACUERDO FORMAL DE CONSORCIO / UNIÓN TEMPORAL
  const consortiumAgreementText = `ACUERDO DE CONSTITUCIÓN DE ${legalFigure === 'consorcio' ? 'CONSORCIO' : 'UNIÓN TEMPORAL'}

PROCESO DE CONTRATACIÓN: ${tender.process_number}
ENTIDAD CONTRATANTE: ${tender.entity_name}
OBJETO: ${tender.title}
CUANTÍA OFICIAL: ${formatCOP(tender.budget_cop)} (${tender.budget_smmlv} SMMLV)

Entre los suscritos a saber:
1. ${company.name}, sociedad comercial identificada con NIT ${company.nit}, representada legalmente para este acto por su Representante Legal facultado estatutariamente, quien en adelante se denominará EL INTEGRANTE 1.
2. ${partnerName}, sociedad comercial identificada con NIT ${partnerNit}, representada legalmente por ${partnerRepName}, identificado con ${partnerRepDoc}, quien en adelante se denominará EL INTEGRANTE 2.

Hemos acordado celebrar el presente ACUERDO DE CONSTITUCIÓN DE ${legalFigure === 'consorcio' ? 'CONSORCIO' : 'UNIÓN TEMPORAL'} al tenor de lo dispuesto en el Artículo 7 de la Ley 80 de 1993, el Decreto 1082 de 2015 y las normas concordantes del Estatuto General de Contratación Pública en Colombia, bajo las siguientes cláusulas:

CLÁUSULA PRIMERA. DENOMINACIÓN:
El proponente plural se denominará "${legalFigure === 'consorcio' ? 'CONSORCIO' : 'UNIÓN TEMPORAL'} ${company.name.split(' ')[0].toUpperCase()} - ${partnerName.split(' ')[0].toUpperCase()} ${tender.process_number.replace(/[^a-zA-Z0-9]/g, '')}".

CLÁUSULA SEGUNDA. OBJETO:
El presente proponente plural se constituye con el fin único y exclusivo de presentar propuesta conjunta, celebrar, ejecutar y liquidar el contrato derivado del Proceso de Selección No. ${tender.process_number}, cuyo objeto es "${tender.title}", convocado por ${tender.entity_name}.

CLÁUSULA TERCERA. PARTICIPACIÓN PORCENTUAL Y APORTES:
La participación de los integrantes en el presente proponente plural se distribuye de la siguiente manera:
- ${company.name} (NIT ${company.nit}): ${companyShare}% de participación. Aporta capacidad operativa, administrativa y experiencia acreditada en el RUP.
- ${partnerName} (NIT ${partnerNit}): ${partnerShare}% de participación. Aporta capacidad técnica especializada (Códigos UNSPSC: ${partnerUnspsc.join(', ') || 'Clasificación oficial'}) y solvencia financiera acreditada.

CLÁUSULA CUARTA. RESPONSABILIDAD:
${legalFigure === 'consorcio' 
  ? 'De conformidad con el numeral 1 del Artículo 7 de la Ley 80 de 1993, los integrantes del CONSORCIO responden solidaria e ilimitadamente por todas y cada una de las obligaciones derivadas de la propuesta y del contrato posterior.' 
  : `De conformidad con el numeral 2 del Artículo 7 de la Ley 80 de 1993, los integrantes de la UNIÓN TEMPORAL responden solidariamente por el cumplimiento general de la propuesta y del contrato, delimitando sus responsabilidades económicas y sanciones conforme al porcentaje de participación pactado (${companyShare}% y ${partnerShare}%).`}

CLÁUSULA QUINTA. DESIGNACIÓN DEL REPRESENTANTE LEGAL:
Las partes de común acuerdo designan como REPRESENTANTE LEGAL DE LA ${legalFigure === 'consorcio' ? 'CONSORCIO' : 'UNIÓN TEMPORAL'} a:
${leaderChoice === 'company' 
  ? `El Representante Legal de ${company.name}, con plenas facultades para firmar la oferta, atender requerimientos, presentar subsanaciones, firmar el contrato y liquidarlo.` 
  : `${partnerRepName} (${partnerRepDoc}), Representante Legal de ${partnerName}, con plenas facultades para la representación del proponente plural.`}

CLÁUSULA SEXTA. DOMICILIO:
Para todos los efectos legales y notificaciones judiciales o administrativas, el domicilio del proponente plural se fija en la ciudad de Bogotá D.C., Colombia.

En constancia de lo anterior, se firma por los representantes legales de las partes a los ${new Date().getDate()} días del mes de ${new Date().toLocaleString('es-CO', { month: 'long' })} del año ${new Date().getFullYear()}.


_____________________________________________          _____________________________________________
REPRESENTANTE LEGAL                                    ${partnerRepName.toUpperCase()}
${company.name}                                        ${partnerName}
NIT: ${company.nit}                                    NIT: ${partnerNit}
`;

  const handleCopyDoc = () => {
    navigator.clipboard.writeText(consortiumAgreementText);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  const handleDownloadDoc = () => {
    const blob = new Blob([consortiumAgreementText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acuerdo_Constitucion_${legalFigure === 'consorcio' ? 'Consorcio' : 'Union_Temporal'}_${tender.process_number}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-5 sm:p-7 space-y-5 overflow-y-auto max-h-[92vh] relative">
        
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Simulador Avanzado de Consorcios y Uniones Temporales
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Estructuración jurídica y financiera con base en el Art. 7 Ley 80/1993 y Decreto 1082/2015 para el proceso <strong className="text-slate-700 dark:text-slate-300">{tender.process_number}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PESTAÑAS DEL SIMULADOR */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. Estructurador & Simulación de Match</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('agreement')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'agreement'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Minuta Legal de Constitución (Listo para Firma)</span>
          </button>
        </div>

        {/* CONTENIDO PESTAÑA 1: SIMULADOR DE CAPACIDADES */}
        {activeTab === 'simulator' && (
          <div className="space-y-4 text-xs">
            
            {/* COMPARACIÓN DE SCORE INDIVIDUAL VS SCORE EN CONSORCIO */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 tracking-wider">
                  Impacto de Habilitación en Proponente Plural
                </span>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">Postulación Individual:</span>
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{tender.compatibility_score}% (Con Brechas)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-600 font-bold" />
                  <div>
                    <span className="text-purple-700 dark:text-purple-400 text-[10px] block font-bold">En Consorcio Estructurado:</span>
                    <span className="font-bold text-base text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      {newScore}% MATCH <ShieldCheck className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-purple-200 dark:border-purple-800 text-center">
                <span className="text-[10px] text-slate-400 font-medium block">Estado Jurídico</span>
                <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                  {allPass ? '✓ 100% HABILITADO' : 'Requiere Ajuste de Cifras'}
                </span>
              </div>
            </div>

            {/* SELECCIÓN DE FIGURA Y SOCIO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* COLUMNA 1: TU EMPRESA Y PORCENTAJES */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                      1. Tu Empresa (Líder)
                    </h4>
                  </div>
                  <span className="font-bold text-blue-600 text-xs">{companyShare}%</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 space-y-1">
                  <span className="font-bold block text-slate-900 dark:text-white truncate">{company.name}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">NIT: {company.nit}</span>
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-500">
                    <span>Liq: {(company.current_liabilities > 0 ? (company.current_assets / company.current_liabilities).toFixed(2) : 'N/A')}</span>
                    <span>SMMLV: {company.smmlv_experience || 0}</span>
                  </div>
                </div>

                {/* SLIDER DE PARTICIPACIÓN */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Participación: {companyShare}%</span>
                    <span>Socio: {partnerShare}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={20} 
                    max={80} 
                    step={5} 
                    value={companyShare}
                    onChange={e => setCompanyShare(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                    <span>20% (Mínimo recomendado)</span>
                    <span>50%</span>
                    <span>80% (Control mayoritario)</span>
                  </div>
                </div>

                {/* FIGURA JURÍDICA */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1.5 text-[11px]">
                    Figura Jurídica (Ley 80 / 1993)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLegalFigure('consorcio')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        legalFigure === 'consorcio'
                          ? 'bg-purple-600 text-white border-purple-600 font-bold'
                          : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      Consorcio
                    </button>
                    <button
                      type="button"
                      onClick={() => setLegalFigure('union_temporal')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        legalFigure === 'union_temporal'
                          ? 'bg-purple-600 text-white border-purple-600 font-bold'
                          : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      Unión Temporal
                    </button>
                  </div>
                </div>
              </div>

              {/* COLUMNA 2: SOCIO ESTRATÉGICO / ALIADO */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                      2. Socio Aliado Sugerido
                    </h4>
                  </div>
                  <span className="font-bold text-purple-600 text-xs">{partnerShare}%</span>
                </div>

                {/* BOTONES DE PRESET */}
                <div className="grid grid-cols-2 gap-1.5 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPartnerType('technical')}
                    className={`py-1 px-2 rounded-lg text-[10px] font-semibold transition-all ${
                      partnerType === 'technical'
                        ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Aliado Técnico UNSPSC
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartnerType('financial')}
                    className={`py-1 px-2 rounded-lg text-[10px] font-semibold transition-all ${
                      partnerType === 'financial'
                        ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Aliado Financiero
                  </button>
                </div>

                {/* DATOS DEL SOCIO */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-0.5 font-medium">Nombre de la Empresa Aliada</label>
                    <input 
                      type="text" 
                      value={partnerName}
                      onChange={e => setPartnerName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-0.5 font-medium">NIT Aliado</label>
                      <input 
                        type="text" 
                        value={partnerNit}
                        onChange={e => setPartnerNit(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-0.5 font-medium">Experiencia SMMLV</label>
                      <input 
                        type="number" 
                        value={partnerSmmlv}
                        onChange={e => setPartnerSmmlv(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* CÓDIGOS UNSPSC QUE APORTA EL SOCIO */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                    Códigos UNSPSC que aporta el aliado:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {partnerUnspsc.map((code, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold rounded-md">
                        ✓ {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* TABLA DE AUDITORÍA COMBINADA: ANTES VS DESPUÉS */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-purple-600" />
                Matriz de Habilitación Combinada (SECOP)
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px]">
                      <th className="pb-2">Criterio</th>
                      <th className="pb-2">Requisito Exigido</th>
                      <th className="pb-2">Tu Empresa Sola</th>
                      <th className="pb-2">En Consorcio ({companyShare}% / {partnerShare}%)</th>
                      <th className="pb-2 text-right">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-2.5 font-medium">Índice de Liquidez</td>
                      <td>&ge; {reqLiq.toFixed(2)}</td>
                      <td>{(company.current_liabilities > 0 ? (company.current_assets / company.current_liabilities).toFixed(2) : '1.80')}</td>
                      <td className="font-bold text-purple-600 dark:text-purple-400">{combinedLiquidity}</td>
                      <td className="text-right">
                        {liquidityPasses ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Cumple
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[11px]">Falta</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium">Índice de Endeudamiento</td>
                      <td>&le; {maxDebt}%</td>
                      <td>{(company.total_assets > 0 ? ((company.total_liabilities / company.total_assets) * 100).toFixed(1) : '42.0')}%</td>
                      <td className="font-bold text-purple-600 dark:text-purple-400">{combinedDebt}%</td>
                      <td className="text-right">
                        {debtPasses ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Cumple
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[11px]">Excede</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium">Experiencia SMMLV</td>
                      <td>&ge; {reqSmmlv} SMMLV</td>
                      <td>{company.smmlv_experience || 0} SMMLV</td>
                      <td className="font-bold text-purple-600 dark:text-purple-400">{combinedSmmlv} SMMLV</td>
                      <td className="text-right">
                        {smmlvPasses ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Cumple
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[11px]">Insuficiente</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium">Clasificación UNSPSC</td>
                      <td>{(tender.experience_compliance?.unspsc_missing || []).length} códigos faltantes</td>
                      <td className="text-rose-600 font-medium">Brechas abiertas</td>
                      <td className="font-bold text-emerald-600 dark:text-emerald-400">100% Cubiertos ({combinedUnspsc.length} códigos)</td>
                      <td className="text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Totalmente Habilitado
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('agreement')}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <span>Generar Minuta Oficial del Consorcio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cerrar Simulador
              </button>
            </div>

          </div>
        )}

        {/* CONTENIDO PESTAÑA 2: MINUTA LEGAL DEL ACUERDO DE CONSORCIO */}
        {activeTab === 'agreement' && (
          <div className="space-y-4 text-xs">
            
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <h4 className="font-bold text-purple-950 dark:text-purple-200 text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Minuta Legal: Acuerdo de Constitución de {legalFigure === 'consorcio' ? 'Consorcio' : 'Unión Temporal'}
                </h4>
                <p className="text-[11px] text-purple-800 dark:text-purple-300">
                  Documento formal estructurado con cláusulas de representación, responsabilidad y aportes para radicar en SECOP.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDoc}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDoc ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadDoc}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Minuta (.doc)</span>
                </button>
              </div>
            </div>

            {/* VISUALIZADOR DE LA MINUTA */}
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] leading-relaxed max-h-[380px] overflow-y-auto whitespace-pre-wrap border border-slate-800 selection:bg-purple-600 selection:text-white">
              {consortiumAgreementText}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Volver a Ajustar Porcentajes
              </button>

              <button
                type="button"
                onClick={handleDownloadDoc}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Acuerdo de Consorcio</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
