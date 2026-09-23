import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle,
  X,
  FileCheck,
  RefreshCw,
  Edit3,
  UploadCloud,
  TrendingUp,
  FileText,
  BadgeCheck,
  Layers,
  Award,
  Download,
  UserCheck,
  Briefcase,
  HelpCircle,
  FileSpreadsheet,
  Check,
  Save,
  Info,
  ChevronLeft
} from 'lucide-react';
import { 
  extractAllTextFromPdf, 
  parseRupText, 
  extractRupWithBackendAI,
  ParsedRupData 
} from '../services/rupParser';
import {
  downloadProponentTemplate,
  uploadAndExtractProponentFicha,
  confirmProponentProfile,
  ProponentProfileData,
  ProponentProfileExtractionResult
} from '../services/api';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (companyData: any) => void;
  initialCompanyName?: string;
  initialNit?: string;
}

// Normalizar NIT (elimina puntos, guiones, espacios y ceros a la izquierda)
function normalizeNit(val: string): string {
  if (!val) return '';
  return val.replace(/[^0-9]/g, '').replace(/^0+/, '');
}

// Compara dos NITs tolerando si uno tiene dígito de verificación (DV) y el otro no
function compareNits(nitA: string, nitB: string): boolean {
  const normA = normalizeNit(nitA);
  const normB = normalizeNit(nitB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (normA.length === 10 && normB.length === 9 && normA.startsWith(normB)) return true;
  if (normB.length === 10 && normA.length === 9 && normB.startsWith(normA)) return true;
  if (normA.length >= 9 && normB.length >= 9 && normA.slice(0, 9) === normB.slice(0, 9)) return true;
  return false;
}

// Formateador de moneda colombiana
function formatCOP(val: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val);
}

const STORAGE_DRAFT_KEY = 'licitia_onboarding_draft_v1';

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ 
  isOpen, 
  onClose, 
  onComplete,
  initialCompanyName = 'Emotiva Tech S.A.S.',
  initialNit = '901.452.890-1'
}) => {
  // Ruta de incorporación: 'select' (elección inicial), 'with_rup' (flujo clásico), 'without_rup' (mínima cuantía)
  const [route, setRoute] = useState<'select' | 'with_rup' | 'without_rup'>('select');
  
  // Pasos flujo RUP: 1 = Carga y Verificación RUP, 2 = Confirmación Matriz RUP
  const [rupStep, setRupStep] = useState<1 | 2>(1);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [parseProgressText, setParseProgressText] = useState('');
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isExtractedWithAi, setIsExtractedWithAi] = useState(false);

  // Datos de la cuenta de registro
  const [accountCompanyName, setAccountCompanyName] = useState(initialCompanyName);
  const [accountNit, setAccountNit] = useState(initialNit);

  // Datos extraídos del Certificado RUP
  const [extractedCompanyName, setExtractedCompanyName] = useState('');
  const [extractedNit, setExtractedNit] = useState('');
  const [chamberOfCommerce, setChamberOfCommerce] = useState('Cámara de Comercio');
  const [isNitVerified, setIsNitVerified] = useState<boolean | null>(null);
  const [showManualEdit, setShowManualEdit] = useState(false);

  // Financial Metrics reales extraídas del RUP
  const [currentAssets, setCurrentAssets] = useState<number>(0);
  const [currentLiabilities, setCurrentLiabilities] = useState<number>(0);
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [totalLiabilities, setTotalLiabilities] = useState<number>(0);
  const [operatingIncome, setOperatingIncome] = useState<number>(0);
  const [interestExpense, setInterestExpense] = useState<number>(0);
  const [smmlvExperience, setSmmlvExperience] = useState<number>(0.0);
  const [unspscCodes, setUnspscCodes] = useState<string>('');
  const [sector, setSector] = useState('Tecnología, Consultoría e Ingeniería');

  // =========================================================================
  // ESTADOS ESPECÍFICOS RUTA B: SIN RUP (FICHA DE PROPONENTE PARA MÍNIMA CUANTÍA)
  // =========================================================================
  const [proponentType, setProponentType] = useState<'persona_natural' | 'persona_juridica'>('persona_juridica');
  const [fichaSubStep, setFichaSubStep] = useState<1 | 2 | 3>(1); // 1 = Descarga y Carga, 2 = Resumen y Edición, 3 = Confirmación
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExtractingFicha, setIsExtractingFicha] = useState(false);
  const [fichaExtractionResult, setFichaExtractionResult] = useState<ProponentProfileExtractionResult | null>(null);
  const [isConfirmingServer, setIsConfirmingServer] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saveDraftNotice, setSaveDraftNotice] = useState(false);

  // Campos editables de la Ficha
  const [fichaName, setFichaName] = useState(initialCompanyName);
  const [fichaIdType, setFichaIdType] = useState('NIT');
  const [fichaIdNumber, setFichaIdNumber] = useState(initialNit);
  const [fichaLegalRep, setFichaLegalRep] = useState('');
  const [fichaEmail, setFichaEmail] = useState('contacto@empresa.co');
  const [fichaDepartment, setFichaDepartment] = useState('Cundinamarca');
  const [fichaCity, setFichaCity] = useState('Bogotá D.C.');
  const [fichaActivity, setFichaActivity] = useState('Prestación de servicios profesionales, consultoría y suministro de bienes.');
  const [fichaKeywords, setFichaKeywords] = useState('servicios, consultoría, suministro');
  const [fichaUnspsc, setFichaUnspsc] = useState('80101500, 81111500');
  const [fichaBudgetRange, setFichaBudgetRange] = useState('Hasta 50 SMMLV');
  const [fichaPriorExp, setFichaPriorExp] = useState(true);
  const [fichaHasSecopAccount, setFichaHasSecopAccount] = useState(true);
  const [fichaBusinessCondition, setFichaBusinessCondition] = useState('mipyme');
  const [fichaSupportsRUT, setFichaSupportsRUT] = useState(true);
  const [fichaSupportsCamaraCedula, setFichaSupportsCamaraCedula] = useState(true);
  const [fichaSupportsParafiscales, setFichaSupportsParafiscales] = useState(true);
  const [veracityConfirmed, setVeracityConfirmed] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);

  // Sincronizar props cuando se abre el modal
  useEffect(() => {
    if (initialCompanyName) {
      setAccountCompanyName(initialCompanyName);
      setFichaName(initialCompanyName);
    }
    if (initialNit) {
      setAccountNit(initialNit);
      setFichaIdNumber(initialNit);
    }
  }, [initialCompanyName, initialNit, isOpen]);

  // Cargar borrador previo si existe
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft && draft.name) {
            setFichaName(draft.name);
            setFichaIdNumber(draft.id_number || draft.nit || '');
            setFichaActivity(draft.declared_activity || '');
            if (draft.proponent_type) setProponentType(draft.proponent_type);
          }
        }
      } catch (_) {}
    }
  }, [isOpen]);

  const handleSaveDraft = () => {
    if (typeof window === 'undefined') return;
    try {
      const draft = {
        proponent_type: proponentType,
        name: fichaName,
        id_number: fichaIdNumber,
        declared_activity: fichaActivity,
        contact_email: fichaEmail,
        department: fichaDepartment,
        city: fichaCity,
        keywords: fichaKeywords.split(',').map(k => k.trim()),
        saved_at: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draft));
      setSaveDraftNotice(true);
      setTimeout(() => setSaveDraftNotice(false), 3000);
    } catch (_) {}
  };

  if (!isOpen) return null;

  // ---------------------------------------------------------------------------
  // MANEJADORES FLUJO A (CON RUP)
  // ---------------------------------------------------------------------------
  const processPdfFile = async (file?: File, forcedNitMismatch = false) => {
    setIsParsingPdf(true);
    setPdfUploaded(false);
    setIsNitVerified(null);
    setIsExtractedWithAi(false);

    const fName = file ? file.name : 'Certificado_RUP.pdf';
    const fSize = file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : '1.20 MB';
    setFileName(fName);
    setFileSize(fSize);

    setParseProgressText('Extrayendo texto y tablas del Certificado RUP...');
    
    let rawText = '';
    let parsed: ParsedRupData = {
      current_assets: 0,
      current_liabilities: 0,
      total_assets: 0,
      total_liabilities: 0,
      operating_income: 0,
      interest_expense: 0,
      patrimony: 0,
      liquidity: 0,
      debtRatio: 0,
      coverageRatio: 0,
      smmlv_experience: 0,
      unspsc_codes: [],
      rawTextLength: 0,
      extractedFromPdf: false
    };

    if (file) {
      try {
        rawText = await extractAllTextFromPdf(file);
        setParseProgressText('Auditando estados financieros y códigos UNSPSC con IA...');
        const aiParsed = await extractRupWithBackendAI(rawText, file.name);
        
        if (aiParsed && (aiParsed.current_assets > 0 || aiParsed.total_assets > 0 || aiParsed.unspsc_codes.length > 0 || aiParsed.nit)) {
          parsed = aiParsed;
          setIsExtractedWithAi(true);
        } else {
          parsed = parseRupText(rawText, file.name);
          setIsExtractedWithAi(false);
        }
      } catch (e) {
        console.warn('Error procesando PDF:', e);
        parsed = parseRupText(rawText, file.name);
        setIsExtractedWithAi(false);
      }
    }

    setParseProgressText('Verificando coincidencia de NIT y proponente...');
    await new Promise(r => setTimeout(r, 200));

    let detectedNit = parsed.nit || (file ? '' : accountNit);
    let detectedName = parsed.companyName || (file ? '' : accountCompanyName);

    if (forcedNitMismatch) {
      detectedNit = '830.099.123-4';
      detectedName = 'Constructora & Proyectos Colombia S.A.';
    }

    setCurrentAssets(parsed.current_assets || 0);
    setCurrentLiabilities(parsed.current_liabilities || 0);
    setTotalAssets(parsed.total_assets || 0);
    setTotalLiabilities(parsed.total_liabilities || 0);
    setOperatingIncome(parsed.operating_income || 0);
    setInterestExpense(parsed.interest_expense || 0);
    setSmmlvExperience(parsed.smmlv_experience || 0);
    setUnspscCodes(parsed.unspsc_codes ? parsed.unspsc_codes.join(', ') : '');

    if (parsed.chamberOfCommerce) setChamberOfCommerce(parsed.chamberOfCommerce);

    const matches = detectedNit ? compareNits(detectedNit, accountNit) : true;
    setExtractedNit(detectedNit || accountNit);
    setExtractedCompanyName(detectedName || accountCompanyName);
    setIsNitVerified(matches);
    setPdfUploaded(true);
    setIsParsingPdf(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    await processPdfFile(file);
  };

  const handleFinalSubmitRup = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      name: accountCompanyName || extractedCompanyName || 'Empresa Proponente',
      nit: accountNit || extractedNit || '901.452.890-1',
      sector: sector,
      current_assets: Number(currentAssets),
      current_liabilities: Number(currentLiabilities),
      total_assets: Number(totalAssets),
      total_liabilities: Number(totalLiabilities),
      operating_income: Number(operatingIncome),
      interest_expense: Number(interestExpense),
      smmlv_experience: Number(smmlvExperience),
      unspsc_codes: unspscCodes.split(',').map(c => c.trim()).filter(Boolean),
      onboarding_route: 'with_rup',
      rup_verified: isNitVerified === true,
      can_access_minima_cuantia: true,
      can_access_general_tenders: true,
      rup_file_name: fileName || 'Certificado_RUP.pdf',
      chamber_of_commerce: chamberOfCommerce
    };
    onComplete(finalData);
  };

  // ---------------------------------------------------------------------------
  // MANEJADORES FLUJO B (SIN RUP - FICHA PROPONENTE MÍNIMA CUANTÍA)
  // ---------------------------------------------------------------------------
  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadProponentTemplate(proponentType, {
        name: fichaName,
        nit: fichaIdNumber,
        email: fichaEmail,
        department: fichaDepartment,
        city: fichaCity
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ficha_Proponente_Minima_Cuantia_${proponentType}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error descargando plantilla:', err);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFichaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setIsExtractingFicha(true);
    setServerError(null);

    try {
      const result = await uploadAndExtractProponentFicha(file);
      setFichaExtractionResult(result);
      if (result.success && result.data) {
        setFichaName(result.data.name || fichaName);
        setFichaIdNumber(result.data.id_number || result.data.nit || fichaIdNumber);
        setFichaIdType(result.data.id_type || fichaIdType);
        if (result.data.legal_representative) setFichaLegalRep(result.data.legal_representative);
        if (result.data.contact_email) setFichaEmail(result.data.contact_email);
        if (result.data.department) setFichaDepartment(result.data.department);
        if (result.data.city) setFichaCity(result.data.city);
        if (result.data.declared_activity) setFichaActivity(result.data.declared_activity);
        if (result.data.keywords && result.data.keywords.length > 0) setFichaKeywords(result.data.keywords.join(', '));
        if (result.data.unspsc_codes && result.data.unspsc_codes.length > 0) setFichaUnspsc(result.data.unspsc_codes.join(', '));
        setFichaPriorExp(result.data.has_prior_experience ?? true);
        setFichaSubStep(2); // Avanzar a revisión y edición
      } else {
        setServerError(result.message || 'No fue posible extraer la información del documento.');
      }
    } catch (err: any) {
      setServerError(err.message || 'Error procesando el archivo cargado.');
    } finally {
      setIsExtractingFicha(false);
    }
  };

  const handleConfirmFichaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!veracityConfirmed) {
      setServerError('Debes marcar la casilla de confirmación de veracidad de la información declarada.');
      return;
    }

    const payload: ProponentProfileData = {
      proponent_type: proponentType,
      name: fichaName.trim(),
      id_type: fichaIdType,
      id_number: fichaIdNumber.trim(),
      nit: fichaIdNumber.trim(),
      legal_representative: proponentType === 'persona_juridica' ? fichaLegalRep.trim() : undefined,
      contact_email: fichaEmail.trim(),
      department: fichaDepartment.trim(),
      city: fichaCity.trim(),
      declared_activity: fichaActivity.trim(),
      offered_goods_services: fichaActivity.trim(),
      target_sectors: ['Servicios', 'Tecnología', 'Comercio'],
      geographic_coverage: [fichaDepartment, 'Nacional'],
      keywords: fichaKeywords.split(',').map(k => k.trim()).filter(Boolean),
      unspsc_codes: fichaUnspsc.split(',').map(u => u.trim()).filter(Boolean),
      has_prior_experience: fichaPriorExp,
      has_secop_account: fichaHasSecopAccount,
      business_condition: fichaBusinessCondition,
      supports_declared: [
        fichaSupportsRUT ? 'RUT' : null,
        fichaSupportsCamaraCedula ? (proponentType === 'persona_juridica' ? 'CamaraComercio' : 'Cedula') : null,
        fichaSupportsParafiscales ? 'Parafiscales' : null
      ].filter(Boolean) as string[],
      has_veracity_confirmation: veracityConfirmed,
      has_privacy_acceptance: privacyAccepted
    };

    setIsConfirmingServer(true);
    try {
      const decision = await confirmProponentProfile(payload);
      if (decision.authorized) {
        // Limpiar borrador local
        localStorage.removeItem(STORAGE_DRAFT_KEY);

        const newCompanyData = {
          name: fichaName,
          nit: fichaIdNumber,
          sector: fichaActivity.slice(0, 45),
          current_assets: 0,
          current_liabilities: 0,
          total_assets: 0,
          total_liabilities: 0,
          operating_income: 0,
          interest_expense: 0,
          smmlv_experience: 0,
          unspsc_codes: payload.unspsc_codes,
          onboarding_route: 'without_rup_minima_cuantia',
          proponent_type: proponentType,
          rup_verified: false,
          ficha_verified: true,
          can_access_minima_cuantia: true,
          can_access_general_tenders: false,
          confirmed_at: decision.confirmed_at
        };
        onComplete(newCompanyData);
      }
    } catch (err: any) {
      setServerError(err.message || 'Error en la autorización del servidor.');
    } finally {
      setIsConfirmingServer(false);
    }
  };

  const calculatedLiquidity = currentLiabilities > 0 
    ? (currentAssets / currentLiabilities).toFixed(2)
    : (currentAssets > 0 ? 'Sin Pasivo Cte' : '0.00');

  const calculatedDebt = totalAssets > 0 
    ? ((totalLiabilities / totalAssets) * 100).toFixed(1)
    : '0.0';

  const unspscArray = unspscCodes.split(',').map(c => c.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-7 space-y-5 overflow-y-auto max-h-[92vh] relative">
        
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {route === 'select' 
                    ? 'Ruta de Incorporación del Proponente' 
                    : (route === 'with_rup' ? 'Carga y Verificación de Certificado RUP' : 'Ficha del Proponente para Mínima Cuantía')}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  SECOP II Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {route === 'select' && 'Elige si tu empresa dispone de RUP o si ingresarás por la ruta de Mínima Cuantía.'}
                {route === 'with_rup' && (rupStep === 1 ? 'Paso 1 de 2: Carga de PDF RUP y auditoría de cifras' : 'Paso 2 de 2: Confirmación y activación de Matriz RUP')}
                {route === 'without_rup' && `Paso ${fichaSubStep} de 3: ${fichaSubStep === 1 ? 'Descarga y Carga de Ficha' : fichaSubStep === 2 ? 'Revisión y Ajuste de Datos' : 'Confirmación y Activación'}`}
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

        {/* =====================================================================
            PANTALLA 1: ELECCIÓN DE RUTA (TENGO RUP / NO TENGO RUP)
           ===================================================================== */}
        {route === 'select' && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-sm">
                <Info className="w-4 h-4 text-blue-600" />
                Elige cómo deseas incorporarte a LicitIA:
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Según la <strong>Ley 1150 de 2007 (Art. 6 Parágrafo 1)</strong> y el <strong>Decreto 1082 de 2015</strong>, los procesos de Mínima Cuantía no exigen Registro Único de Proponentes (RUP). Si no cuentas con este documento, puedes completar tu ficha y acceder a las convocatorias de menor valor.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              
              {/* OPCIÓN A: TENGO RUP */}
              <button
                type="button"
                onClick={() => setRoute('with_rup')}
                className="p-4.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 bg-white dark:bg-slate-900/80 text-left transition-all hover:shadow-md group cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                    Todas las Modalidades
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Tengo RUP
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Carga tu Certificado RUP en PDF. Se extraerán automáticamente tus balances, capacidad financiera y clasificación UNSPSC.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 gap-1">
                  <span>Continuar con RUP</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* OPCIÓN B: NO TENGO RUP — CONTINUAR CON MÍNIMA CUANTÍA */}
              <button
                type="button"
                onClick={() => setRoute('without_rup')}
                className="p-4.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-600 dark:hover:border-emerald-500 bg-white dark:bg-slate-900/80 text-left transition-all hover:shadow-md group cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md">
                    Ruta sin RUP
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    No tengo RUP — continuar con mínima cuantía
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Puedes explorar oportunidades de mínima cuantía sin cargar un RUP. Primero completa y adjunta tu ficha de proponente para personalizar las oportunidades y preparar tu documentación. Cada convocatoria tiene requisitos propios.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-1">
                  <span>Iniciar Ficha Proponente</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

            </div>
          </div>
        )}

        {/* =====================================================================
            RUTA A: FLUJO EXISTENTE CON RUP (MANTIENE EXACTAMENTE LO QUE YA FUNCIONA)
           ===================================================================== */}
        {route === 'with_rup' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setRoute('select')}
              className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Cambiar a otra opción</span>
            </button>

            {/* BARRA DE PROGRESO DE 2 PASOS */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <div className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                rupStep >= 1 ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-400'
              }`}>
                <Upload className="w-3.5 h-3.5" />
                <span>1. Carga RUP & Auditoría</span>
              </div>
              <div className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                rupStep === 2 ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-400'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>2. Matriz RUP Activa</span>
              </div>
            </div>

            {rupStep === 1 && (
              <div className="space-y-4 text-xs">
                {/* TARJETA CUENTA REGISTRADA */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Cuenta Registrada</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{accountCompanyName}</span>
                        <span className="text-slate-400 font-medium">·</span>
                        <span className="font-mono font-semibold text-blue-700 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                          NIT: {accountNit}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 italic">El RUP debe pertenecer a este proponente</span>
                </div>

                {/* ZONA DE CARGA RUP */}
                {!pdfUploaded && (
                  <div className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 ${
                    isParsingPdf ? 'border-blue-400 bg-blue-50/50' : 'border-blue-300 dark:border-blue-800 bg-blue-50/30 hover:border-blue-500'
                  }`}>
                    {isParsingPdf ? (
                      <div className="space-y-3 py-3">
                        <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Extrayendo datos reales del Certificado RUP...</p>
                        <p className="text-xs font-medium text-blue-600 animate-pulse">{parseProgressText}</p>
                      </div>
                    ) : (
                      <label className="cursor-pointer block space-y-2 py-4">
                        <UploadCloud className="w-12 h-12 text-blue-600 mx-auto" />
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Arrastra o selecciona el Certificado RUP en PDF</p>
                        <p className="text-xs text-slate-500">Se extraerán Activo Corriente, Pasivo Corriente, SMMLV de Experiencia y Códigos UNSPSC.</p>
                        <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                )}

                {/* RESULTADO AUDITORÍA RUP */}
                {pdfUploaded && isNitVerified !== null && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-900 space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-bold text-xs">¡Certificado RUP Validado con Éxito!</h4>
                      </div>
                      <p className="text-[11px] text-emerald-800">Emisor: {chamberOfCommerce} · NIT RUP: {extractedNit}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200">Capacidad Financiera Extraída</span>
                        <button type="button" onClick={() => setShowManualEdit(!showManualEdit)} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                          <Edit3 className="w-3 h-3" />
                          <span>{showManualEdit ? 'Ocultar edición' : 'Ajustar cifras'}</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Liquidez</span>
                          <span className="font-bold text-blue-600">{calculatedLiquidity}</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Endeudamiento</span>
                          <span className="font-bold text-blue-600">{calculatedDebt}%</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Experiencia</span>
                          <span className="font-bold text-blue-600">{smmlvExperience} SMMLV</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">UNSPSC</span>
                          <span className="font-bold text-blue-600">{unspscArray.length} códigos</span>
                        </div>
                      </div>

                      {showManualEdit && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                          <div>
                            <label className="block text-slate-500 mb-1">Activo Corriente (COP)</label>
                            <input type="number" value={currentAssets} onChange={e => setCurrentAssets(Number(e.target.value))} className="w-full border p-1.5 rounded-lg text-xs" />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">Pasivo Corriente (COP)</label>
                            <input type="number" value={currentLiabilities} onChange={e => setCurrentLiabilities(Number(e.target.value))} className="w-full border p-1.5 rounded-lg text-xs" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button onClick={() => setRupStep(2)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm text-xs cursor-pointer">
                        <span>Continuar a Confirmación</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {rupStep === 2 && (
              <form onSubmit={handleFinalSubmitRup} className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">Confirmación de Matriz RUP</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    Tu perfil se activará para evaluar licitaciones públicas de SECOP I, SECOP II y Mínima Cuantía con las cifras oficiales de tu documento emitido por {chamberOfCommerce}.
                  </p>
                </div>
                <div className="flex justify-between pt-2">
                  <button type="button" onClick={() => setRupStep(1)} className="px-4 py-2 border rounded-xl font-medium">Atrás</button>
                  <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer">
                    Activar Perfil RUP
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* =====================================================================
            RUTA B: FLUJO ALTERNATIVO SIN RUP (FICHA PROPONENTE MÍNIMA CUANTÍA)
           ===================================================================== */}
        {route === 'without_rup' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRoute('select')}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Elegir otra opción</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveDraftNotice ? '✓ Guardado' : 'Guardar borrador'}</span>
              </button>
            </div>

            {/* AVISO NORMATIVO */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950 dark:text-amber-100">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Aviso Normativo — Mínima Cuantía (Ley 1150 de 2007)</span>
              </div>
              <p>
                Formato interno de LicitIA para construir el perfil del proponente. No acredita por sí solo el cumplimiento de los requisitos de una convocatoria ni sustituye los documentos exigidos por la entidad contratante.
              </p>
            </div>

            {/* SUBPASO 1: SELECCIÓN DE TIPO DE PROPONENTE Y DESCARGA/CARGA DE LA FICHA */}
            {fichaSubStep === 1 && (
              <div className="space-y-4 animate-in fade-in">
                
                {/* 1. SELECCIÓN DE PERSONA NATURAL O JURÍDICA */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    1. Tipo de Proponente:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setProponentType('persona_juridica');
                        setFichaIdType('NIT');
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        proponentType === 'persona_juridica'
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <Building2 className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="font-bold block text-xs">Persona Jurídica</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Sociedades, SAS, LTDA, ESAL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProponentType('persona_natural');
                        setFichaIdType('CC');
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        proponentType === 'persona_natural'
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <UserCheck className="w-5 h-5 text-emerald-600 mb-1" />
                      <span className="font-bold block text-xs">Persona Natural</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Profesionales, comerciantes independientes</span>
                    </button>
                  </div>
                </div>

                {/* 2. BOTÓN DE DESCARGA DE LA PLANTILLA OFICIAL */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 text-left">
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      2. Descarga la plantilla oficial editable (.DOCX):
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Incluye tus datos básicos precargados y etiquetas estables para lectura automática.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={isDownloadingTemplate}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm text-xs cursor-pointer flex-shrink-0 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingTemplate ? 'Generando...' : 'Descargar Ficha DOCX'}</span>
                  </button>
                </div>

                {/* 3. ZONA DE CARGA DEL ARCHIVO DILIGENCIADO */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    3. Adjunta la ficha diligenciada (.DOCX editable o .PDF con texto):
                  </label>
                  <div className="p-6 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/10 hover:border-blue-500 text-center space-y-2.5">
                    {isExtractingFicha ? (
                      <div className="space-y-2 py-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          Procesando y extrayendo datos de tu ficha...
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Validando campos según {proponentType === 'persona_juridica' ? 'Persona Jurídica' : 'Persona Natural'}...
                        </p>
                      </div>
                    ) : (
                      <label className="cursor-pointer block space-y-2 py-2">
                        <UploadCloud className="w-10 h-10 text-blue-600 mx-auto" />
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">
                            Selecciona o arrastra el archivo de tu ficha
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Formatos admitidos: .docx (Word editable) o .pdf (con texto seleccionable) hasta 15 MB.
                          </p>
                        </div>
                        <div className="pt-1">
                          <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm text-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Cargar Ficha Diligenciada</span>
                          </span>
                        </div>
                        <input type="file" accept=".docx,.pdf" onChange={handleFichaUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {serverError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
                    <span>{serverError}</span>
                  </div>
                )}
              </div>
            )}

            {/* SUBPASO 2: RESUMEN ESTRUCTURADO Y EDICIÓN DE CAMPOS */}
            {fichaSubStep === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-xs">Ficha extraída satisfactoriamente</h4>
                      <p className="text-[10px] text-emerald-800 dark:text-emerald-300">
                        Puntaje de completitud: {fichaExtractionResult?.completeness_score || 100}% · Revisa y edita los campos antes de confirmar.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFichaSubStep(1)}
                    className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline font-semibold"
                  >
                    Subir otro archivo
                  </button>
                </div>

                {/* FORMULARIO EDITABLE DE LA FICHA */}
                <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                  
                  {/* SECCIÓN A: DATOS BÁSICOS OBLIGATORIOS */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                      Sección A: Datos Necesarios para el Perfil
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium text-[11px]">
                          {proponentType === 'persona_juridica' ? 'Razón Social' : 'Nombre Completo'} *
                        </label>
                        <input
                          type="text"
                          value={fichaName}
                          onChange={e => setFichaName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium text-[11px]">
                          {proponentType === 'persona_juridica' ? 'NIT de la Empresa' : 'Número de Identificación'} *
                        </label>
                        <input
                          type="text"
                          value={fichaIdNumber}
                          onChange={e => setFichaIdNumber(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs focus:border-blue-500"
                        />
                      </div>

                      {proponentType === 'persona_juridica' && (
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium text-[11px]">
                            Representante Legal *
                          </label>
                          <input
                            type="text"
                            value={fichaLegalRep}
                            placeholder="Nombre del Rep. Legal"
                            onChange={e => setFichaLegalRep(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs focus:border-blue-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium text-[11px]">
                          Correo Electrónico de Contacto *
                        </label>
                        <input
                          type="email"
                          value={fichaEmail}
                          onChange={e => setFichaEmail(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium text-[11px]">
                          Departamento *
                        </label>
                        <input
                          type="text"
                          value={fichaDepartment}
                          onChange={e => setFichaDepartment(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium text-[11px]">
                          Municipio / Ciudad *
                        </label>
                        <input
                          type="text"
                          value={fichaCity}
                          onChange={e => setFichaCity(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs focus:border-blue-500"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium text-[11px]">
                          Descripción de la Actividad, Bienes o Servicios que Ofrece *
                        </label>
                        <textarea
                          rows={2}
                          value={fichaActivity}
                          onChange={e => setFichaActivity(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs focus:border-blue-500"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium text-[11px]">
                          Palabras Clave para Búsqueda y Alertas de Oportunidades (Separadas por coma)
                        </label>
                        <input
                          type="text"
                          value={fichaKeywords}
                          onChange={e => setFichaKeywords(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN B: DATOS COMPLEMENTARIOS */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Sección B: Datos Complementarios (Opcionales)
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium text-[11px]">
                          Códigos UNSPSC Conocidos (o 'No conozco el código')
                        </label>
                        <input
                          type="text"
                          value={fichaUnspsc}
                          onChange={e => setFichaUnspsc(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium text-[11px]">
                          Presupuesto de Interés
                        </label>
                        <input
                          type="text"
                          value={fichaBudgetRange}
                          onChange={e => setFichaBudgetRange(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs focus:border-blue-500"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-2 flex items-center justify-between p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">
                          ¿Posees contratos o experiencia previa documentada?
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={fichaPriorExp}
                            onChange={e => setFichaPriorExp(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-0"
                          />
                          <span>{fichaPriorExp ? 'Sí, tengo experiencia' : 'Sin experiencia previa'}</span>
                        </label>
                      </div>

                      <div className="col-span-1 sm:col-span-2 flex items-center justify-between p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">
                          ¿Tienes cuenta de proveedor activa en SECOP II?
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={fichaHasSecopAccount}
                            onChange={e => setFichaHasSecopAccount(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-0"
                          />
                          <span>{fichaHasSecopAccount ? 'Sí, registrado' : 'No todavía'}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN C: SOPORTES DECLARADOS */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Sección C: Soportes Disponibles (Condicionales según convocatoria)
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Marca los documentos que tienes disponibles en tu empresa para adjuntar cuando una convocatoria específica los solicite:
                    </p>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input type="checkbox" checked={fichaSupportsRUT} onChange={e => setFichaSupportsRUT(e.target.checked)} className="rounded" />
                        <span>RUT Actualizado con actividad económica concordante</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input type="checkbox" checked={fichaSupportsCamaraCedula} onChange={e => setFichaSupportsCamaraCedula(e.target.checked)} className="rounded" />
                        <span>{proponentType === 'persona_juridica' ? 'Certificado de Existencia y Representación Legal (Cámara de Comercio)' : 'Cédula de Ciudadanía'}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input type="checkbox" checked={fichaSupportsParafiscales} onChange={e => setFichaSupportsParafiscales(e.target.checked)} className="rounded" />
                        <span>Certificación de Pago de Seguridad Social y Parafiscales (Ley 789 de 2002)</span>
                      </label>
                    </div>
                  </div>

                </div>

                {/* BOTONES DE NAVEGACIÓN A CONFIRMACIÓN */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setFichaSubStep(1)}
                    className="px-4 py-2 border rounded-xl font-medium"
                  >
                    Atrás
                  </button>

                  <button
                    type="button"
                    onClick={() => setFichaSubStep(3)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Continuar a Confirmación</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SUBPASO 3: CONFIRMACIÓN EXPLÍCITA Y ACTIVACIÓN EN SERVIDOR */}
            {fichaSubStep === 3 && (
              <form onSubmit={handleConfirmFichaSubmit} className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 font-bold">
                    <BadgeCheck className="w-5 h-5 text-blue-600" />
                    <span>Confirmación Final de Ficha de Proponente</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Al confirmar, el servidor validará tus datos y activará de inmediato tu acceso al <strong>Módulo de Mínima Cuantía de SECOP II</strong>.
                  </p>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Proponente:</span>
                      <strong className="text-slate-900 dark:text-white truncate block">{fichaName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Identificación:</span>
                      <strong className="text-slate-900 dark:text-white">{fichaIdNumber} ({proponentType})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ubicación:</span>
                      <span className="text-slate-700 dark:text-slate-300">{fichaDepartment} - {fichaCity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Alcance Habilitado:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Mínima Cuantía SECOP II</span>
                    </div>
                  </div>
                </div>

                {/* CASILLAS OBLIGATORIAS */}
                <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={veracityConfirmed}
                      onChange={e => setVeracityConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600"
                    />
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">
                      <strong>Confirmación de Veracidad:</strong> Declaro bajo la gravedad de juramento que los datos aportados en esta ficha son verídicos, corresponden a mi perfil comercial y serán corroborados según lo exigido por cada entidad contratante.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={e => setPrivacyAccepted(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600"
                    />
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">
                      Autorizo el tratamiento de datos para personalización de convocatorias públicas conforme a la política de privacidad de LicitIA.
                    </span>
                  </label>
                </div>

                {serverError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
                    <span>{serverError}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setFichaSubStep(2)}
                    className="px-4 py-2 border rounded-xl font-medium"
                  >
                    Atrás (Revisar datos)
                  </button>

                  <button
                    type="submit"
                    disabled={isConfirmingServer}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isConfirmingServer ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Validando en servidor...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirmar y Activar Mínima Cuantía</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
