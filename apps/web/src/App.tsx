import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Send, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  ChevronRight, 
  Search, 
  SlidersHorizontal,
  Layers,
  Sun,
  Moon,
  FileCheck,
  Download,
  HelpCircle,
  Briefcase,
  ExternalLink,
  Check,
  Building,
  Scale,
  PieChart,
  ArrowRight,
  Plus,
  Edit3,
  X,
  RefreshCw,
  AlertCircle,
  HelpCircle as QuestionIcon,
  Users,
  User,
  UploadCloud,
  LogOut,
  CreditCard,
  Globe2,
  Sparkles,
  Loader2,
  Database,
  Archive,
  SendHorizontal,
  Clock,
  Bot,
  Trash2,
  Inbox,
  Folder,
  LayoutGrid,
  FileSpreadsheet,
  CheckSquare,
  Copy,
  Lock,
  Radio,
  BarChart3,
  Zap
} from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';
import { OnboardingWizard } from './components/OnboardingWizard';
import { SubscriptionModal } from './components/SubscriptionModal';
import { DossierModal } from './components/DossierModal';
import { SubmissionWizardModal } from './components/SubmissionWizardModal';
import { ApplicationsHistoryModal } from './components/ApplicationsHistoryModal';
import { CompanyVaultModal } from './components/CompanyVaultModal';
import { PlanGateModal, GateFeatureType } from './components/PlanGateModal';
import { ConsortiumSimulatorModal } from './components/ConsortiumSimulatorModal';
import { loadCompanyVault, VaultDocument } from './services/companyVaultService';
import { 
  PlanId, 
  PLAN_LIMITS_MAP, 
  getStoredPlanId, 
  storePlanId, 
  getMonthlyEvaluationsUsage, 
  recordTenderEvaluation, 
  canEvaluateTender 
} from './services/planRestrictions';
import { 
  getApplicationsHistory, 
  addApplicationRecord, 
  ApplicationRecord 
} from './services/submissionsService';
import { RequiredDossierDoc, AttachedFileInfo } from './services/dossierGenerator';
import { supabase, signOutUser, getUserProfile, syncUserProfile } from './services/supabase';
import { 
  TenderDTO, 
  fetchLiveTenders, 
  queryTenderAssistant, 
  formatFriendlyDate, 
  resolveSecopUrl 
} from './services/api';

interface CompanyProfile {
  name: string;
  nit: string;
  sector: string;
  current_assets: number;     // Activo Corriente
  current_liabilities: number; // Pasivo Corriente
  total_assets: number;       // Activo Total
  total_liabilities: number;   // Pasivo Total
  operating_income: number;   // Utilidad Operacional
  interest_expense: number;   // Gastos de Intereses
  smmlv_experience: number;   // SMMLV Acumulados RUP
  unspsc_codes: string[];     // Códigos UNSPSC Acreditados
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  legal_rep_name?: string;
  legal_rep_id?: string;
}

interface EvaluatedTender extends TenderDTO {
  compatibility_score: number;
  verdict: 'RECOMMENDED' | 'RISKY' | 'NOT_RECOMMENDED';
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
  executive_summary: string;
  reasons: string[];
  risks: string[];
  missing_requirements: string[];
  strategy_recommendation: string;
  required_documents: string[];
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderMessageContent(content: string) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-0.5" />;

        // Encabezados con estilo
        if (trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
          const headerText = trimmed.replace(/^#{3,4}\s+/, '');
          return (
            <div key={idx} className="font-bold text-xs text-blue-900 dark:text-blue-300 mt-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-1.5">
              <span>{headerText}</span>
            </div>
          );
        }

        // Viñetas con viñeta de color
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const bulletText = trimmed.replace(/^(\*|-|•)\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 text-slate-700 dark:text-slate-300">
              <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
              <span className="flex-1">{renderInlineMarkdown(bulletText)}</span>
            </div>
          );
        }

        // Listas numeradas
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 text-slate-700 dark:text-slate-300">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-[11px] min-w-[16px]">{numMatch[1]}.</span>
              <span className="flex-1">{renderInlineMarkdown(numMatch[2])}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-700 dark:text-slate-300">
            {renderInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'terms' | 'privacy'>('landing');
  const [previousView, setPreviousView] = useState<'landing' | 'dashboard'>('landing');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showCompanyModal, setShowCompanyModal] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<'all' | 'high_match' | 'partial_match' | 'low_match'>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'SECOP_I' | 'SECOP_II'>('all');
  const [detailTab, setDetailTab] = useState<'matrix' | 'assistant' | 'checklist'>('matrix');
  
  // ESTADO DE BÚSQUEDA Y PROCESOS OFICIALES SECOP I & II (SOLO ACTIVAS)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSector, setActiveSector] = useState<string>('todos');
  const [rawTenders, setRawTenders] = useState<TenderDTO[]>([]);
  const [isLoadingTenders, setIsLoadingTenders] = useState<boolean>(true);
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Almacenamiento persistente del perfil empresarial real
  const STORAGE_COMPANY_KEY = 'licitia_company_profile_v1';

  function getStoredCompanyProfile(): CompanyProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_COMPANY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.name) return parsed;
      }
    } catch (e) {
      console.warn('Error reading stored company profile:', e);
    }
    return null;
  }

  function storeCompanyProfile(comp: CompanyProfile): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_COMPANY_KEY, JSON.stringify(comp));
    } catch (e) {
      console.warn('Error saving stored company profile:', e);
    }
  }

  // Perfil de la Empresa Activa (Carga datos reales guardados o arranca en limpio para producción)
  const [company, setCompany] = useState<CompanyProfile>(() => {
    const stored = getStoredCompanyProfile();
    if (stored) return stored;
    return {
      name: 'Mi Empresa S.A.S.',
      nit: '900.000.000-1',
      sector: 'Tecnología, Consultoría y Servicios',
      current_assets: 0,
      current_liabilities: 0,
      total_assets: 0,
      total_liabilities: 0,
      operating_income: 0,
      interest_expense: 0,
      smmlv_experience: 0,
      unspsc_codes: []
    };
  });

  const [formCompany, setFormCompany] = useState<CompanyProfile>(company);

  // ESTADO AUTHENTICACIÓN Y ONBOARDING RUP
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'signup' | 'magic'>('login');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [userSession, setUserSession] = useState<{ email: string; companyName?: string } | null>(null);

  // ESTADO MONETIZACIÓN SAAS Y PLANES CON RESTRICCIONES
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<PlanId>(() => getStoredPlanId());
  const [evalUsage, setEvalUsage] = useState(() => getMonthlyEvaluationsUsage());
  const [isPlanGateOpen, setIsPlanGateOpen] = useState(false);
  const [gateFeatureType, setGateFeatureType] = useState<GateFeatureType>('evaluations_limit');

  const planLimits = PLAN_LIMITS_MAP[currentPlanId];

  const triggerPlanGate = (feat: GateFeatureType) => {
    setGateFeatureType(feat);
    setIsPlanGateOpen(true);
  };

  const handlePlanUpgraded = (newPlanId: PlanId) => {
    setCurrentPlanId(newPlanId);
    storePlanId(newPlanId);
    setEvalUsage(getMonthlyEvaluationsUsage());
  };

  // ESTADO MODAL EXPEDIENTE REAL Y ASISTENTE DE RADICACIÓN
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [isConsortiumModalOpen, setIsConsortiumModalOpen] = useState(false);
  const [isSubmissionWizardOpen, setIsSubmissionWizardOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCompanyVaultOpen, setIsCompanyVaultOpen] = useState(false);
  const [vaultDocs, setVaultDocs] = useState<VaultDocument[]>(() => loadCompanyVault(company.nit, company.name));
  const [applicationsHistory, setApplicationsHistory] = useState<ApplicationRecord[]>(() => getApplicationsHistory(company.nit));
  const [submittedTenders, setSubmittedTenders] = useState<Record<string, { radicadoCode: string; submittedAt: string }>>({});
  const [signedLetters, setSignedLetters] = useState<Record<string, File>>({});
  const [dossierDocsMap, setDossierDocsMap] = useState<Record<string, RequiredDossierDoc[]>>({});
  const [dossierAttachmentsMap, setDossierAttachmentsMap] = useState<Record<string, Record<string, AttachedFileInfo>>>({});

  // Sincronizar historial de postulaciones y bóveda cuando cambia la empresa / cuenta activa
  useEffect(() => {
    const history = getApplicationsHistory(company.nit);
    setApplicationsHistory(history);
    const loadedVault = loadCompanyVault(company.nit, company.name);
    setVaultDocs(loadedVault);
  }, [company.nit, company.name]);

  // Escuchar sesión activa de Supabase (OAuth de Google, Magic Link o Login con contraseña)
  useEffect(() => {
    const handleUserSession = async (u: any) => {
      if (!u) {
        setUserSession(null);
        return;
      }
      try {
        const profile = await syncUserProfile(u);
        const meta = u.user_metadata || {};
        const compName = profile?.organization?.name || meta.company_name || meta.full_name || meta.name || u.email?.split('@')[0];
        const compNit = profile?.organization?.nit || meta.nit || '901.452.890-1';

        setUserSession({ email: u.email || '', companyName: compName });
        setCompany(prev => ({
          ...prev,
          name: compName || prev.name,
          nit: compNit || prev.nit
        }));
        setFormCompany(prev => ({
          ...prev,
          name: compName || prev.name,
          nit: compNit || prev.nit
        }));
      } catch (err) {
        console.warn('Error handling user session profile:', err);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSession(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setUserSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.error('Error signing out:', e);
    }
    setUserSession(null);
    setCurrentView('landing');
  };

  const handleEnterDashboard = () => {
    if (userSession) {
      setCurrentView('dashboard');
    } else {
      setAuthInitialTab('login');
      setIsAuthModalOpen(true);
    }
  };

  const handleOpenAuth = (mode?: 'login' | 'register') => {
    setAuthInitialTab(mode === 'register' ? 'signup' : 'login');
    setIsAuthModalOpen(true);
  };

  const handleOpenTerms = () => {
    if (currentView !== 'terms') {
      setPreviousView(currentView as 'landing' | 'dashboard');
    }
    setCurrentView('terms');
    window.location.hash = 'terminos';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromTerms = () => {
    setCurrentView(previousView || 'landing');
    if (window.location.hash === '#terminos' || window.location.hash === '#terms') {
      try {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (_) {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPrivacy = () => {
    if (currentView !== 'privacy') {
      setPreviousView(currentView as 'landing' | 'dashboard');
    }
    setCurrentView('privacy');
    window.location.hash = 'privacidad';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromPrivacy = () => {
    setCurrentView(previousView || 'landing');
    if (window.location.hash === '#privacidad' || window.location.hash === '#privacy') {
      try {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (_) {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Detector de hash en URL para acceder directamente a #terminos o #privacidad
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash === '#terminos' || hash === '#terms') {
        setCurrentView('terms');
      } else if (hash === '#privacidad' || hash === '#privacy') {
        setCurrentView('privacy');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const [evaluatedTenders, setEvaluatedTenders] = useState<EvaluatedTender[]>([]);
  const [selectedTender, setSelectedTender] = useState<EvaluatedTender | null>(null);

  const [queryMessage, setQueryMessage] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [queryHistory, setQueryHistory] = useState<Array<{ sender: 'user' | 'system'; text: string }>>([
    {
      sender: 'system',
      text: `### 🤖 Asistente Jurídico y de Pliegos Activo
Hola, soy tu consultor experto en contratación estatal colombiana (**Ley 80/1993, Ley 1150/2007, Decreto 1082/2015** y **Colombia Compra Eficiente**).

Puedo responder con fundamentación jurídica sobre **requisitos habilitantes, uniones temporales, subsanabilidad, anticipos, garantías y plazos** para el proceso que tengas seleccionado.`
    }
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // FUNCIÓN PARA CARGAR LICITACIONES REALES ACTIVAS DE SECOP I Y SECOP II
  const loadOfficialTenders = useCallback(async (
    query?: string, 
    isBackground: boolean = false, 
    plat: 'all' | 'SECOP_I' | 'SECOP_II' = platformFilter
  ) => {
    if (!isBackground) setIsLoadingTenders(true);
    else setIsSearchingLive(true);

    try {
      const data = await fetchLiveTenders(query, undefined, 35, plat);
      setRawTenders(data);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Error cargando licitaciones activas:', err);
    } finally {
      setIsLoadingTenders(false);
      setIsSearchingLive(false);
    }
  }, [platformFilter]);

  // Carga inicial
  useEffect(() => {
    loadOfficialTenders(searchTerm || undefined, false, platformFilter);
  }, [platformFilter, loadOfficialTenders]);

  // Debounce para búsqueda en vivo contra la API oficial de SECOP I & II
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 3) {
        loadOfficialTenders(searchTerm.trim(), true, platformFilter);
      } else if (searchTerm.trim().length === 0 && activeSector === 'todos') {
        loadOfficialTenders(undefined, true, platformFilter);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm, activeSector, platformFilter, loadOfficialTenders]);

  // Manejo de filtros rápidos por sector
  const handleSectorChange = (sector: string, searchKey?: string) => {
    setActiveSector(sector);
    setSearchTerm(searchKey || '');
    loadOfficialTenders(searchKey, true, platformFilter);
  };

  // HELPER PARA EVALUACIÓN JERÁRQUICA UNSPSC (CLASE, FAMILIA, SEGMENTO Y AFINIDAD SECTORIAL)
  const evaluateUnspscCompatibility = useCallback((
    companyCodes: string[],
    requiredCodes: string[],
    tenderTitle: string = '',
    tenderDesc: string = ''
  ) => {
    const cleanNum = (c: string) => String(c || '').replace(/^V\d+\.?/i, '').replace(/[^0-9]/g, '').trim();
    const normCompany = (companyCodes || []).map(cleanNum).filter(Boolean);
    const normReq = (requiredCodes || []).map(cleanNum).filter(Boolean);
    const targetReq = normReq.length > 0 ? normReq : ['80101500'];

    const matchedCodes: string[] = [];
    const missingCodes: string[] = [];
    let matchDescription = '';
    let matchLevel: 'exact' | 'class' | 'family' | 'segment' | 'semantic' | 'none' = 'none';

    for (const req of targetReq) {
      let matched = false;

      // 1. Exacto
      for (const comp of normCompany) {
        if (comp === req) {
          matched = true;
          matchLevel = 'exact';
          matchDescription = `Coincidencia exacta en código UNSPSC (${req})`;
          matchedCodes.push(req);
          break;
        }
      }
      if (matched) continue;

      // 2. Clase RUP (primeros 6 dígitos - estándar Decreto 1082/2015)
      for (const comp of normCompany) {
        if (comp.length >= 6 && req.length >= 6 && comp.slice(0, 6) === req.slice(0, 6)) {
          matched = true;
          matchLevel = 'class';
          matchDescription = `Coincidencia de Clase RUP (${comp.slice(0, 6)}xx con ${req})`;
          matchedCodes.push(req);
          break;
        }
      }
      if (matched) continue;

      // 3. Familia RUP (primeros 4 dígitos - estándar Colombia Compra Eficiente)
      for (const comp of normCompany) {
        if (comp.length >= 4 && req.length >= 4 && comp.slice(0, 4) === req.slice(0, 4)) {
          matched = true;
          matchLevel = 'family';
          matchDescription = `Coincidencia de Familia RUP (${comp.slice(0, 4)}xxxx con ${req})`;
          matchedCodes.push(req);
          break;
        }
      }
      if (matched) continue;

      // 4. Segmento (primeros 2 dígitos)
      for (const comp of normCompany) {
        if (comp.length >= 2 && req.length >= 2 && comp.slice(0, 2) === req.slice(0, 2)) {
          matched = true;
          matchLevel = 'segment';
          matchDescription = `Coincidencia de Segmento (${comp.slice(0, 2)}xxxxxx con ${req})`;
          matchedCodes.push(req);
          break;
        }
      }
      if (matched) continue;

      // 5. Inferencia semántica por afinidad sectorial
      const context = `${tenderTitle} ${tenderDesc}`.toLowerCase();
      const hasTechAffinity = normCompany.some(c => c.startsWith('8111') || c.startsWith('4323') || c.startsWith('8010'));
      const isTechTender = context.includes('software') || context.includes('plataforma') || context.includes('tecnolog') || context.includes('sistemas') || context.includes('consultor') || context.includes('interventor') || context.includes('informát') || context.includes('ciberseguridad');

      if (hasTechAffinity && isTechTender) {
        matched = true;
        matchLevel = 'semantic';
        matchDescription = `Afinidad sectorial tecnológica con el objeto contractual`;
        matchedCodes.push(req);
        continue;
      }

      missingCodes.push(req);
    }

    const passes = matchedCodes.length > 0;
    let scoreDeduction = 0;
    let reasonText = '';

    if (passes) {
      if (matchLevel === 'exact' || matchLevel === 'class') {
        reasonText = `Acredita experiencia en clasificación UNSPSC requerida (${matchedCodes.join(', ')}).`;
        scoreDeduction = 0;
      } else if (matchLevel === 'family' || matchLevel === 'semantic') {
        reasonText = `Acredita experiencia en clasificación afín (${matchDescription}).`;
        scoreDeduction = 5;
      } else {
        reasonText = `Acredita afinidad en segmento general (${matchDescription}).`;
        scoreDeduction = 10;
      }
    } else {
      scoreDeduction = 20;
      reasonText = `No registras contratos en la clasificación UNSPSC requerida (${missingCodes.join(', ')}).`;
    }

    return {
      passes,
      scoreDeduction,
      matchedCodes,
      missingCodes,
      reasonText
    };
  }, []);

  // MOTOR DE MATCHING EN TIEMPO REAL CON PROCESOS REALES Y PERFIL RUP
  useEffect(() => {
    const liquidityRatio = company.current_liabilities > 0 
      ? company.current_assets / company.current_liabilities 
      : 0;
    
    const debtRatio = company.total_assets > 0 
      ? company.total_liabilities / company.total_assets 
      : 0;

    const evaluated: EvaluatedTender[] = rawTenders.map(t => {
      const minLiquidity = t.min_liquidity_required || (t.budget_smmlv > 1000 ? 2.0 : 1.5);
      const maxDebt = t.max_debt_allowed || 0.50;
      const minSmmlv = t.min_smmlv_required || Number(Math.max(50, t.budget_smmlv * 0.7).toFixed(1));
      const reqUnspsc = t.required_unspsc || t.unspsc_codes || ['80101500'];

      const liquidityPasses = liquidityRatio >= minLiquidity;
      const debtPasses = debtRatio <= maxDebt;
      const experiencePasses = company.smmlv_experience >= minSmmlv;
      
      const unspscEval = evaluateUnspscCompatibility(
        company.unspsc_codes,
        reqUnspsc,
        t.title,
        t.description
      );

      let score = 100;
      const reasons: string[] = [];
      const risks: string[] = [];
      const missing_requirements: string[] = [];

      if (liquidityPasses) {
        reasons.push(`Índice de Liquidez (${liquidityRatio.toFixed(2)}) supera el mínimo exigido (${minLiquidity.toFixed(2)}).`);
      } else {
        score -= 35;
        const gap = minLiquidity - liquidityRatio;
        missing_requirements.push(`Índice de Liquidez: Tu liquidez actual es ${liquidityRatio.toFixed(2)}. Falta un margen de ${gap.toFixed(2)} para el mínimo de ${minLiquidity.toFixed(2)}.`);
        risks.push(`Capacidad financiera de liquidez corriente inferior a la solicitada.`);
      }

      if (debtPasses) {
        reasons.push(`Índice de Endeudamiento (${(debtRatio * 100).toFixed(1)}%) cumple el límite máximo (${(maxDebt * 100).toFixed(0)}%).`);
      } else {
        score -= 25;
        const gap = (debtRatio - maxDebt) * 100;
        missing_requirements.push(`Nivel de Endeudamiento: Tu endeudamiento es ${(debtRatio * 100).toFixed(1)}%. Supera el tope de ${(maxDebt * 100).toFixed(0)}% por un margen de ${gap.toFixed(1)}%.`);
        risks.push(`Endeudamiento total superior al porcentaje permitido por la entidad.`);
      }

      if (experiencePasses) {
        reasons.push(`Experiencia RUP acreditada (${company.smmlv_experience} SMMLV) cubre los ${minSmmlv} SMMLV exigidos.`);
      } else {
        score -= 30;
        const smmlvGap = minSmmlv - company.smmlv_experience;
        missing_requirements.push(`Experiencia RUP en SMMLV: Tienes ${company.smmlv_experience} SMMLV. Te faltan ${smmlvGap.toFixed(1)} SMMLV en contratos ejecutados para alcanzar los ${minSmmlv} SMMLV solicitados.`);
        risks.push(`Falta de experiencia cuantificada en SMMLV para esta cuantía.`);
      }

      if (unspscEval.passes) {
        reasons.push(unspscEval.reasonText);
        score -= unspscEval.scoreDeduction;
      } else {
        score -= 20;
        missing_requirements.push(`Códigos UNSPSC en RUP: No registras la clasificación ${unspscEval.missingCodes.join(', ')} requerida para este objeto contractual.`);
        risks.push(`Sin clasificación UNSPSC coincidente en el certificado RUP.`);
      }

      score = Math.max(0, Math.min(100, Math.round(score)));

      let verdict: 'RECOMMENDED' | 'RISKY' | 'NOT_RECOMMENDED' = 'RECOMMENDED';
      let executive_summary = `La empresa ${company.name} cumple satisfactoriamente el 100% de los requisitos de habilitación para esta convocatoria abierta de ${t.source_platform.replace('_', ' ')}.`;
      let strategy_recommendation = 'Puedes postularte de forma individual directamente ante la entidad.';

      if (score >= 80) {
        verdict = 'RECOMMENDED';
      } else if (score >= 50) {
        verdict = 'RISKY';
        executive_summary = `La empresa ${company.name} tiene un Match Parcial del ${score}%. Cumple los indicadores base pero presenta ${missing_requirements.length} observación(es) en RUP o liquidez.`;
        strategy_recommendation = `Puedes postularte realizando una actualización de contratos en el RUP o sumando un socio menor en Unión Temporal.`;
      } else {
        verdict = 'NOT_RECOMMENDED';
        executive_summary = `La empresa ${company.name} presenta un Match Bajo (${score}%). Registra ${missing_requirements.length} brechas de habilitación frente al pliego.`;
        strategy_recommendation = `Se recomienda conformar una Unión Temporal o Consorcio con un socio estratégico que aporte la experiencia técnica o financiera faltante.`;
      }

      return {
        ...t,
        compatibility_score: score,
        verdict,
        financial_compliance: {
          liquidity: { 
            value: liquidityRatio, 
            required: minLiquidity, 
            passes: liquidityPasses,
            gap: Math.max(0, minLiquidity - liquidityRatio)
          },
          debt: { 
            value: debtRatio, 
            max_allowed: maxDebt, 
            passes: debtPasses,
            gap: Math.max(0, debtRatio - maxDebt)
          }
        },
        experience_compliance: {
          smmlv_accumulated: company.smmlv_experience,
          smmlv_required: minSmmlv,
          unspsc_matched: unspscEval.matchedCodes,
          unspsc_missing: unspscEval.missingCodes,
          passes: experiencePasses && unspscEval.passes,
          smmlv_gap: Math.max(0, minSmmlv - company.smmlv_experience)
        },
        executive_summary,
        reasons,
        risks,
        missing_requirements,
        strategy_recommendation,
        required_documents: [
          'Carta de Presentación de la Oferta (Anexo N° 1)',
          'Certificación RUP Vigente con Estados Financieros',
          'Póliza de Seriedad de la Oferta expedida por Aseguradora',
          'Certificado de Pago de Aportes a Seguridad Social y Parafiscales',
          'Acreditación de Cumplimiento de Especificaciones Técnicas'
        ]
      };
    });

    evaluated.sort((a, b) => b.compatibility_score - a.compatibility_score);
    setEvaluatedTenders(evaluated);
    
    // Mantener la selección actual o asignar la primera
    if (evaluated.length > 0) {
      setSelectedTender(prev => {
        if (!prev) {
          recordTenderEvaluation(evaluated[0].id);
          return evaluated[0];
        }
        const match = evaluated.find(e => e.id === prev.id);
        if (match) return match;
        recordTenderEvaluation(evaluated[0].id);
        return evaluated[0];
      });
    } else {
      setSelectedTender(null);
    }

  }, [company, rawTenders, evaluateUnspscCompatibility]);

  const handleSelectTender = (tender: EvaluatedTender) => {
    const check = canEvaluateTender(currentPlanId, tender.id);
    if (!check.allowed) {
      triggerPlanGate('evaluations_limit');
      return;
    }
    recordTenderEvaluation(tender.id);
    setEvalUsage(getMonthlyEvaluationsUsage());
    setSelectedTender(tender);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUnspsc = (formCompany.unspsc_codes || [])
      .map(c => String(c || '').replace(/^V\d+\.?/i, '').replace(/[^0-9]/g, '').trim())
      .filter(Boolean);
    const cleaned = {
      ...formCompany,
      unspsc_codes: cleanUnspsc
    };
    setCompany(cleaned);
    setFormCompany(cleaned);
    storeCompanyProfile(cleaned);
    setShowCompanyModal(false);
  };

  const handleSendQuery = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    if (!planLimits.hasRagAssistant) {
      triggerPlanGate('rag_assistant');
      return;
    }
    const messageToSend = (directText || queryMessage).trim();
    if (!messageToSend || isQuerying) return;

    setQueryHistory(prev => [...prev, { sender: 'user', text: messageToSend }]);
    setQueryMessage('');
    setIsQuerying(true);

    try {
      const response = await queryTenderAssistant({
        query: messageToSend,
        tender_id: selectedTender?.id,
        tender_data: selectedTender || undefined,
        company_profile: company,
        provider: 'google',
        model: 'gemini-1.5-pro'
      });

      setQueryHistory(prev => [
        ...prev,
        {
          sender: 'system',
          text: response.answer
        }
      ]);
    } catch (err) {
      setQueryHistory(prev => [
        ...prev,
        {
          sender: 'system',
          text: '### ⚠️ Error en la Consulta\nNo fue posible procesar la consulta en este momento. Por favor verifica los datos o intenta nuevamente.'
        }
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  // Scroll automático al último mensaje del asistente
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [queryHistory, isQuerying]);

  // Licitaciones pertenecientes a la plataforma seleccionada (para contadores de KPIs y pestañas)
  const platformTenders = useMemo(() => {
    if (platformFilter === 'all') return evaluatedTenders;
    return evaluatedTenders.filter(t => t.source_platform === platformFilter);
  }, [evaluatedTenders, platformFilter]);

  // FILTRADO DINÁMICO REACCIONANDO A PESTAÑAS Y PLATAFORMA (MEMOIZADO Y ESTRICTO)
  const filteredTenders: EvaluatedTender[] = useMemo(() => {
    return evaluatedTenders.filter(t => {
      // 1. Filtro estricto de plataforma
      if (platformFilter !== 'all' && t.source_platform !== platformFilter) {
        return false;
      }
      // 2. Filtro de porcentaje de compatibilidad
      const score = typeof t.compatibility_score === 'number' ? t.compatibility_score : 0;
      if (filterTab === 'high_match') return score >= 80;
      if (filterTab === 'partial_match') return score >= 50 && score < 80;
      if (filterTab === 'low_match') return score < 50;
      return true;
    });
  }, [evaluatedTenders, filterTab, platformFilter]);

  const handleFilterTabChange = (tab: 'all' | 'high_match' | 'partial_match' | 'low_match') => {
    setFilterTab(tab);
    const matches = evaluatedTenders.filter(t => {
      if (platformFilter !== 'all' && t.source_platform !== platformFilter) return false;
      const score = typeof t.compatibility_score === 'number' ? t.compatibility_score : 0;
      if (tab === 'high_match') return score >= 80;
      if (tab === 'partial_match') return score >= 50 && score < 80;
      if (tab === 'low_match') return score < 50;
      return true;
    });
    if (matches.length > 0) {
      if (!selectedTender || !matches.some(t => t.id === selectedTender.id)) {
        handleSelectTender(matches[0]);
      }
    } else {
      setSelectedTender(null);
    }
  };

  // Manejo de cambio de plataforma con filtrado y sincronización inmediata
  const handlePlatformChange = (plat: 'all' | 'SECOP_I' | 'SECOP_II') => {
    if ((plat === 'SECOP_I' || plat === 'all') && !planLimits.hasRealtimeIngestion) {
      triggerPlanGate('realtime_secop');
      return;
    }
    setPlatformFilter(plat);
    const matches = evaluatedTenders.filter(t => {
      if (plat !== 'all' && t.source_platform !== plat) return false;
      const score = typeof t.compatibility_score === 'number' ? t.compatibility_score : 0;
      if (filterTab === 'high_match') return score >= 80;
      if (filterTab === 'partial_match') return score >= 50 && score < 80;
      if (filterTab === 'low_match') return score < 50;
      return true;
    });
    if (matches.length > 0) {
      handleSelectTender(matches[0]);
    } else {
      setSelectedTender(null);
    }
    loadOfficialTenders(searchTerm || undefined, false, plat);
  };

  const formLiquidity = formCompany.current_liabilities > 0 
    ? (formCompany.current_assets / formCompany.current_liabilities).toFixed(2)
    : '0.00';

  const formDebt = formCompany.total_assets > 0 
    ? ((formCompany.total_liabilities / formCompany.total_assets) * 100).toFixed(1)
    : '0.0';

  const selectedSubmission = selectedTender ? submittedTenders[selectedTender.id] : null;

  if (currentView === 'privacy') {
    return (
      <div className={isDarkMode ? 'dark' : 'light'}>
        <PrivacyPage
          onBack={handleBackFromPrivacy}
          darkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onEnterDashboard={handleEnterDashboard}
          onOpenAuth={handleOpenAuth}
          onOpenTerms={handleOpenTerms}
        />

        {/* MODAL DE AUTENTICACIÓN SUPABASE */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onOpenTerms={handleOpenTerms}
          onOpenPrivacy={handleOpenPrivacy}
          initialTab={authInitialTab}
          onSuccess={(user, isNewUser) => {
            setUserSession({ email: user.email, companyName: user.companyName });
            if (user.companyName || user.nit) {
              setCompany(prev => ({
                ...prev,
                name: user.companyName || prev.name,
                nit: user.nit || prev.nit
              }));
              setFormCompany(prev => ({
                ...prev,
                name: user.companyName || prev.name,
                nit: user.nit || prev.nit
              }));
            }
            setIsAuthModalOpen(false);
            setCurrentView('dashboard');
            if (isNewUser) {
              setIsOnboardingOpen(true);
            }
          }}
        />
      </div>
    );
  }

  if (currentView === 'terms') {
    return (
      <div className={isDarkMode ? 'dark' : 'light'}>
        <TermsPage
          onBack={handleBackFromTerms}
          darkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onEnterDashboard={handleEnterDashboard}
          onOpenAuth={handleOpenAuth}
          onOpenPrivacy={handleOpenPrivacy}
        />

        {/* MODAL DE AUTENTICACIÓN SUPABASE */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onOpenTerms={handleOpenTerms}
          onOpenPrivacy={handleOpenPrivacy}
          initialTab={authInitialTab}
          onSuccess={(user, isNewUser) => {
            setUserSession({ email: user.email, companyName: user.companyName });
            if (user.companyName || user.nit) {
              setCompany(prev => ({
                ...prev,
                name: user.companyName || prev.name,
                nit: user.nit || prev.nit
              }));
              setFormCompany(prev => ({
                ...prev,
                name: user.companyName || prev.name,
                nit: user.nit || prev.nit
              }));
            }
            setIsAuthModalOpen(false);
            setCurrentView('dashboard');
            if (isNewUser) {
              setIsOnboardingOpen(true);
            }
          }}
        />
      </div>
    );
  }

  if (currentView === 'landing') {
    return (
      <div className={isDarkMode ? 'dark' : 'light'}>
        <LandingPage
          onEnterDashboard={handleEnterDashboard}
          onOpenAuth={handleOpenAuth}
          onOpenTerms={handleOpenTerms}
          onOpenPrivacy={handleOpenPrivacy}
          darkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          userSession={userSession}
          onLogout={handleLogout}
        />

        {/* MODAL DE AUTENTICACIÓN SUPABASE */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onOpenTerms={handleOpenTerms}
          onOpenPrivacy={handleOpenPrivacy}
          initialTab={authInitialTab}
          onSuccess={(user, isNewUser) => {
            setUserSession({ email: user.email, companyName: user.companyName });
            if (user.companyName || user.nit) {
              setCompany(prev => ({
                ...prev,
                name: user.companyName || prev.name,
                nit: user.nit || prev.nit
              }));
              setFormCompany(prev => ({
                ...prev,
                name: user.companyName || prev.name,
                nit: user.nit || prev.nit
              }));
            }
            setIsAuthModalOpen(false);
            setCurrentView('dashboard');
            if (isNewUser) {
              setIsOnboardingOpen(true);
            }
          }}
        />

        {/* ASISTENTE ONBOARDING RUP CON CARGA DE PDF */}
        <OnboardingWizard
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          initialCompanyName={company.name}
          initialNit={company.nit}
          onComplete={(newCompanyData) => {
            setCompany(newCompanyData);
            setFormCompany(newCompanyData);
            setIsOnboardingOpen(false);
          }}
        />

        {/* MODAL DE SUSCRIPCIONES Y PAGOS */}
        <SubscriptionModal
          isOpen={isSubModalOpen}
          onClose={() => setIsSubModalOpen(false)}
          currentPlanId={currentPlanId}
          userEmail={userSession?.email}
          onPlanUpgraded={handlePlanUpgraded}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f4f7fc] dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      
      {/* 1. BARRA LATERAL DE NAVEGACIÓN SAAS */}
      <aside className="w-16 flex-shrink-0 bg-white dark:bg-[#111827] border-r border-slate-200/80 dark:border-slate-800/90 flex flex-col items-center justify-between py-4 sticky top-0 h-screen z-50 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        
        {/* LOGO DE LA APLICACIÓN */}
        <div className="flex flex-col items-center gap-6">
          <div 
            onClick={() => setCurrentView('landing')}
            title="Volver a la Página Principal (Landing)" 
            className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-blue-500/25 tracking-wider cursor-pointer hover:scale-105 transition-transform"
          >
            EL
          </div>

          {/* MENÚ DE ICONOS PRINCIPALES */}
          <nav className="flex flex-col items-center gap-2">
            
            {/* 0. Volver a Landing Page */}
            <button
              onClick={() => setCurrentView('landing')}
              title="Ver Página de Inicio / Landing"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 dark:text-slate-400 dark:hover:text-blue-300 dark:hover:bg-slate-800 transition-all relative group"
            >
              <Globe2 className="w-5 h-5" />
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                Página Principal (Landing)
              </span>
            </button>

            {/* 1. Convocatorias / Repositorio Principal */}
            <button
              onClick={() => {}}
              title="Convocatorias y Licitaciones Abiertas"
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold transition-all relative group"
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                Licitaciones Activas
              </span>
            </button>

            {/* 2. Mis Postulaciones (con badge) */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              title="Mis Postulaciones Radicadas"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 dark:text-slate-400 dark:hover:text-blue-300 dark:hover:bg-slate-800 transition-all relative group"
            >
              <Inbox className="w-5 h-5" />
              {applicationsHistory.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1 shadow-sm">
                  {applicationsHistory.length}
                </span>
              )}
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                Mis Postulaciones ({applicationsHistory.length})
              </span>
            </button>

            {/* 3. Asistente RUP (Cargar PDF) */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              title="Asistente RUP Inteligente (Cargar PDF)"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/80 dark:text-slate-400 dark:hover:text-emerald-300 dark:hover:bg-slate-800 transition-all relative group"
            >
              <UploadCloud className="w-5 h-5" />
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                Cargar Certificado RUP (PDF)
              </span>
            </button>

            {/* 4. Perfil de mi Empresa (RUP) */}
            <button
              onClick={() => {
                setFormCompany(company);
                setShowCompanyModal(true);
              }}
              title="Perfil de mi Empresa (RUP & Finanzas)"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 dark:text-slate-400 dark:hover:text-blue-300 dark:hover:bg-slate-800 transition-all relative group"
            >
              <Building2 className="w-5 h-5" />
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                Perfil de Empresa (RUP)
              </span>
            </button>

            {/* 5. Planes y Monetización SaaS */}
            <button
              onClick={() => setIsSubModalOpen(true)}
              title="Planes SaaS & Facturación Wompi"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50/80 dark:text-slate-400 dark:hover:text-amber-300 dark:hover:bg-slate-800 transition-all relative group"
            >
              <CreditCard className="w-5 h-5" />
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                Plan {currentPlanId.toUpperCase()} (Wompi)
              </span>
            </button>

            {/* 6. Términos y Condiciones Legales */}
            <button
              onClick={handleOpenTerms}
              title="Términos y Condiciones de Uso"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 dark:text-slate-400 dark:hover:text-blue-300 dark:hover:bg-slate-800 transition-all relative group"
            >
              <Scale className="w-5 h-5" />
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                Términos y Condiciones
              </span>
            </button>

            {/* 7. Política de Privacidad */}
            <button
              onClick={handleOpenPrivacy}
              title="Política de Privacidad y Habeas Data"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/80 dark:text-slate-400 dark:hover:text-emerald-300 dark:hover:bg-slate-800 transition-all relative group"
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                Política de Privacidad
              </span>
            </button>

          </nav>
        </div>

        {/* CONTROLES INFERIORES: TEMA Y USUARIO */}
        <div className="flex flex-col items-center gap-3">
          
          {/* Selector Claro / Oscuro */}
          <button
            onClick={toggleTheme}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Botón de Autenticación / Usuario */}
          {userSession ? (
            <button
              onClick={handleLogout}
              title={`Cerrar sesión (${userSession.email})`}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all relative group"
            >
              <LogOut className="w-4 h-4" />
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                Salir ({userSession.email})
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthInitialTab('login');
                setIsAuthModalOpen(true);
              }}
              title="Iniciar Sesión / Registrarse"
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all relative group"
            >
              <User className="w-4 h-4" />
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                Iniciar Sesión
              </span>
            </button>
          )}

        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER SUPERIOR MODERNO SAAS */}
        <header className="h-16 bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-slate-800/90 px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3.5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">Emotiva LicitIA</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                  SECOP I & II OFICIAL • LICITACIONES VIGENTES
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Plataforma Inteligente de Evaluación RUP y Postulaciones Estatales</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* BADGE DE PLAN SAAS & EVALUACIONES */}
            <div 
              onClick={() => setIsSubModalOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] shadow-xs bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700"
              title="Haz clic para ver o gestionar tu suscripción y límites"
            >
              <div className={`p-1 rounded-lg ${
                currentPlanId === 'enterprise' 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' 
                  : currentPlanId === 'pyme'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {currentPlanId === 'enterprise' ? <Sparkles className="w-3.5 h-3.5" /> : currentPlanId === 'pyme' ? <Zap className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white text-[11px]">{planLimits.name}</span>
                  {currentPlanId === 'free' && (
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 text-[10px] font-bold rounded">
                      {evalUsage.count}/5 eval.
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {currentPlanId === 'free' ? 'Buscador SECOP II básico' : currentPlanId === 'pyme' ? 'Evaluaciones Ilimitadas' : 'Consorcios & 24/7'}
                </p>
              </div>
            </div>

            {/* BOTÓN RÁPIDO BÓVEDA DOCUMENTAL EMPRESARIAL */}
            <button
              onClick={() => setIsCompanyVaultOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold shadow-xs transition-colors"
              title="Repositorio Documental Permanente de la Empresa (Jurídicos, Financieros, Experiencia, Personal, Certificaciones)"
            >
              <Folder className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Bóveda Documental ({vaultDocs.length})</span>
            </button>

            {/* BOTÓN RÁPIDO MIS POSTULACIONES */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold shadow-xs transition-colors"
            >
              <Inbox className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Mis Postulaciones ({applicationsHistory.length})</span>
            </button>

            {/* BOTÓN ASISTENTE RUP */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold shadow-xs transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cargar RUP (PDF)</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:border-slate-800 hidden sm:block" />

            {/* PERFIL EMPRESARIAL ACTIVO */}
            <div 
              onClick={() => {
                setFormCompany(company);
                setShowCompanyModal(true);
              }}
              title="Haz clic para editar el perfil RUP y los estados financieros"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all group"
            >
              <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-xs text-left hidden sm:block">
                <p className="font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[130px] group-hover:text-blue-600 transition-colors">{company.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">NIT {company.nit}</p>
              </div>
              <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors ml-0.5" />
            </div>
          </div>
        </header>

        {/* WORKSPACE PRINCIPAL DE 2 COLUMNAS (REPOSITORIO / INSPECTOR) */}
        <main className="flex-1 p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1720px] mx-auto w-full">
          
          {/* COLUMNA IZQUIERDA: REPOSITORIO DE LICITACIONES ACTIVAS (5 Cols) */}
          <section className="lg:col-span-5 flex flex-col gap-3.5">
            
            {/* PANEL DE BÚSQUEDA Y FILTRADO AVANZADO */}
            <div className="bg-white dark:bg-[#111827] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
              
              {/* SELECTOR SEGMENTADO DE PLATAFORMA (TODAS / SECOP II / SECOP I) */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => handlePlatformChange('all')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    platformFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Todas (SECOP I & II)</span>
                  {currentPlanId === 'free' && <Lock className="w-3 h-3 text-amber-500 ml-0.5" />}
                </button>
                <button
                  onClick={() => handlePlatformChange('SECOP_II')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    platformFilter === 'SECOP_II'
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-200"></span>
                  <span>Solo SECOP II</span>
                </button>
                <button
                  onClick={() => handlePlatformChange('SECOP_I')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    platformFilter === 'SECOP_I'
                      ? 'bg-amber-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-200"></span>
                  <span>Solo SECOP I</span>
                  {currentPlanId === 'free' && <Lock className="w-3 h-3 text-amber-500 ml-0.5" />}
                </button>
              </div>

              {/* BUSCADOR REACTIVO CON ICONO Y LIMPIADOR */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  {isSearchingLive ? (
                    <Loader2 className="w-4 h-4 absolute left-3 top-2.5 text-blue-600 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  )}
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por objeto, código o entidad (ej: software, obra, consultoría)..." 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        loadOfficialTenders(undefined, true, platformFilter);
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button 
                  onClick={() => loadOfficialTenders(searchTerm || undefined, false, platformFilter)}
                  title="Actualizar y consultar convocatorias activas"
                  className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingTenders ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>

              {/* CHIPS RÁPIDOS DE SECTOR */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
                <button
                  onClick={() => handleSectorChange('todos')}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-semibold ${
                    activeSector === 'todos'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => handleSectorChange('tecnologia', 'software')}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                    activeSector === 'tecnologia'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                  }`}
                >
                  💻 Software & TI
                </button>
                <button
                  onClick={() => handleSectorChange('consultoria', 'consultoria')}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                    activeSector === 'consultoria'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                  }`}
                >
                  📊 Consultoría
                </button>
                <button
                  onClick={() => handleSectorChange('infraestructura', 'obra')}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                    activeSector === 'infraestructura'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                  }`}
                >
                  🏗️ Obras
                </button>
                <button
                  onClick={() => handleSectorChange('suministros', 'suministro')}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                    activeSector === 'suministros'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                  }`}
                >
                  📦 Suministros
                </button>
              </div>

            </div>

            {/* RESUMEN EJECUTIVO DE KPIS & METRICAS (CLICKEABLES PARA FILTRAR) */}
            <div className="grid grid-cols-3 gap-2.5">
              <div 
                onClick={() => handleFilterTabChange('high_match')}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  filterTab === 'high_match'
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800 hover:border-emerald-300'
                }`}
              >
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Match Alto</p>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {platformTenders.filter(t => t.compatibility_score >= 80).length}
                  </p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                  &ge;80%
                </div>
              </div>

              <div 
                onClick={() => handleFilterTabChange('partial_match')}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  filterTab === 'partial_match'
                    ? 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Match Parcial</p>
                  <p className="text-base font-black text-amber-600 dark:text-amber-400">
                    {platformTenders.filter(t => t.compatibility_score >= 50 && t.compatibility_score < 80).length}
                  </p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                  50-79%
                </div>
              </div>

              <div 
                onClick={() => handleFilterTabChange('low_match')}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  filterTab === 'low_match'
                    ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                    : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800 hover:border-rose-300'
                }`}
              >
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Match Bajo</p>
                  <p className="text-base font-black text-rose-600 dark:text-rose-400">
                    {platformTenders.filter(t => t.compatibility_score < 50).length}
                  </p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center text-xs font-bold">
                  &lt;50%
                </div>
              </div>
            </div>

            {/* PESTAÑAS DE NAVEGACIÓN Y FILTRO POR RANGO */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#111827] p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold shadow-xs">
              <button
                onClick={() => handleFilterTabChange('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                  filterTab === 'all'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todas ({platformTenders.length})
              </button>
              <button
                onClick={() => handleFilterTabChange('high_match')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                  filterTab === 'high_match'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
                }`}
              >
                &ge;80% ({platformTenders.filter(t => t.compatibility_score >= 80).length})
              </button>
              <button
                onClick={() => handleFilterTabChange('partial_match')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                  filterTab === 'partial_match'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400'
                }`}
              >
                50-79% ({platformTenders.filter(t => t.compatibility_score >= 50 && t.compatibility_score < 80).length})
              </button>
              <button
                onClick={() => handleFilterTabChange('low_match')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                  filterTab === 'low_match'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400'
                }`}
              >
                &lt;50% ({platformTenders.filter(t => t.compatibility_score < 50).length})
              </button>
            </div>

            {/* LISTA DE PROCESOS ESTILO SAAS REPOSITORY */}
            <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-370px)] pr-1">
              {isLoadingTenders ? (
                <div className="p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3 bg-white dark:bg-[#111827]">
                  <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Consultando Convocatorias Activas en SECOP I & II...</p>
                  <p className="text-[11px] text-slate-400">Filtrando exclusivamente procesos en presentación de ofertas</p>
                </div>
              ) : filteredTenders.length > 0 ? (
                filteredTenders.map((tender, index) => {
                  const isSelected = selectedTender?.id === tender.id;
                  const isSubmitted = !!submittedTenders[tender.id];
                  
                  let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
                  let badgeText = `${tender.compatibility_score}% Match Alto`;

                  if (tender.compatibility_score >= 50 && tender.compatibility_score < 80) {
                    badgeBg = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
                    badgeText = `${tender.compatibility_score}% Match Parcial`;
                  } else if (tender.compatibility_score < 50) {
                    badgeBg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
                    badgeText = `${tender.compatibility_score}% Match Bajo`;
                  }

                  const isSecop1 = tender.source_platform === 'SECOP_I';

                  return (
                    <div 
                      key={`${tender.id || tender.process_number}-${index}-${filterTab}`}
                      onClick={() => handleSelectTender(tender)}
                      className={`p-3.5 rounded-2xl cursor-pointer bg-white dark:bg-[#111827] border transition-all ${
                        isSelected 
                          ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20 dark:bg-blue-950/20' 
                          : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10.5px] font-mono font-bold text-slate-700 dark:text-slate-300">
                            {tender.process_number}
                          </span>

                          {isSecop1 ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                              SECOP I
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                              SECOP II
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            VIGENTE
                          </span>

                          {isSubmitted && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> RADICADA
                            </span>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${badgeBg}`}>
                          {badgeText}
                        </span>
                      </div>

                      <h3 className="font-semibold text-xs text-slate-900 dark:text-slate-100 mt-2 line-clamp-2 leading-snug">
                        {tender.title}
                      </h3>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{tender.entity_name}</span>
                      </p>

                      {/* FECHAS OFICIALES Y PRESUPUESTO */}
                      <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10.5px]">
                        <div>
                          <span className="text-slate-400 block text-[9.5px]">Presupuesto Oficial</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200 font-mono">
                            ${(tender.budget_cop >= 1000000 ? (tender.budget_cop / 1000000).toFixed(0) + 'M' : (tender.budget_cop / 1000).toFixed(0) + 'K')} COP
                            <span className="text-[9.5px] text-slate-400 font-sans ml-1">({tender.budget_smmlv} SMMLV)</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-amber-600 dark:text-amber-400 block text-[9.5px] font-semibold">Cierre de Ofertas</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                            <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            {formatFriendlyDate(tender.closing_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 text-xs bg-white dark:bg-[#111827] space-y-2">
                  <Search className="w-6 h-6 mx-auto text-slate-400" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    No hay licitaciones en el rango {filterTab === 'high_match' ? '≥80%' : filterTab === 'partial_match' ? '50-79%' : filterTab === 'low_match' ? '<50%' : 'seleccionado'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {filterTab !== 'all' ? 'Actualmente las convocatorias disponibles se ubican en los otros rangos de compatibilidad.' : 'Intente seleccionando "Todas las Plataformas" o cambiando los términos de búsqueda.'}
                  </p>
                  {filterTab !== 'all' && (
                    <button
                      onClick={() => handleFilterTabChange('all')}
                      className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold rounded-lg text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors inline-block"
                    >
                      Ver Todas ({evaluatedTenders.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* COLUMNA DERECHA: INSPECTOR TÉCNICO Y EVALUACIÓN ESTRUCTURADA (7 Cols) */}
          <section className="lg:col-span-7 flex flex-col gap-4">
            {selectedTender ? (
              <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 flex flex-col gap-4 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                
                {/* 1. ENCABEZADO DEL PROCESO & BOTONES DE ACCIÓN PERMANENTES */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {selectedTender.source_platform === 'SECOP_I' ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[11px] font-bold">
                          SECOP I
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold">
                          SECOP II
                        </span>
                      )}
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>CONVOCATORIA ACTIVA</span>
                      </span>

                      {planLimits.hasAddendaMonitoring247 ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10.5px] font-bold flex items-center gap-1">
                          <Radio className="w-3 h-3 text-purple-600 animate-pulse" />
                          <span>Monitoreo 24/7 Activo</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => triggerPlanGate('addenda_monitoring_247')}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                          title="Monitoreo 24/7 de adendas en tiempo real (Plan Enterprise)"
                        >
                          <Radio className="w-3 h-3 text-purple-500" />
                          <span>Monitoreo 24/7 (Enterprise 🔒)</span>
                        </button>
                      )}

                      {selectedSubmission && (
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-xs font-bold shadow-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>RADICADA: {selectedSubmission.radicadoCode}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const refToCopy = selectedTender.process_number || selectedTender.secop_id;
                          navigator.clipboard.writeText(refToCopy);
                          setCopiedRef(true);
                          setTimeout(() => setCopiedRef(false), 2000);
                        }}
                        title="Copiar número de proceso para buscar en SECOP"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedRef ? '¡Copiado!' : 'Copiar Ref'}</span>
                      </button>

                      {selectedTender.process_url && (
                        <a 
                          href={selectedTender.process_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
                        >
                          <span>Ver en {selectedTender.source_platform === 'SECOP_I' ? 'SECOP I' : 'SECOP II'} Oficial</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                        selectedTender.compatibility_score >= 80
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : selectedTender.compatibility_score >= 50
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                      }`}>
                        {selectedTender.compatibility_score >= 80 ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Match Alto ({selectedTender.compatibility_score}%)
                          </>
                        ) : selectedTender.compatibility_score >= 50 ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" /> Match Parcial ({selectedTender.compatibility_score}%)
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Match Bajo ({selectedTender.compatibility_score}%)
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <h1 className="text-base font-bold text-slate-900 dark:text-white mt-2.5 leading-snug">
                    {selectedTender.title}
                  </h1>

                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTender.entity_name}</span>
                    <span>•</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10.5px]">
                      Modalidad: {selectedTender.contract_type}
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">{selectedTender.department}</span>
                  </div>

                  {/* GRID DE FECHAS & PRESUPUESTO */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-500" /> Publicación
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatFriendlyDate(selectedTender.publication_date)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" /> Cierre Ofertas
                      </span>
                      <span className="font-bold text-amber-800 dark:text-amber-300">
                        {formatFriendlyDate(selectedTender.closing_date)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Presupuesto Oficial</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                        ${(selectedTender.budget_cop >= 1000000 ? (selectedTender.budget_cop / 1000000).toFixed(1) + 'M' : (selectedTender.budget_cop / 1000).toFixed(0) + 'K')} COP
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Experiencia SMMLV</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedTender.experience_compliance.smmlv_required} SMMLV
                      </span>
                    </div>
                  </div>

                  {/* BARRA DE ACCIÓN PRINCIPAL */}
                  <div className="mt-3.5">
                    {selectedSubmission ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700 flex items-center justify-between flex-wrap gap-2 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                              Oferta Radicada Satisfactoriamente en {selectedTender.source_platform.replace('_', ' ')}
                            </p>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                              N° Radicado: <span className="font-bold">{selectedSubmission.radicadoCode}</span> • {selectedSubmission.submittedAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Ver Historial</span>
                          </button>
                          <button
                            onClick={() => {
                              if (!planLimits.hasDossierGenerator) {
                                triggerPlanGate('dossier_generator');
                                return;
                              }
                              setIsDossierModalOpen(true);
                            }}
                            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ver Expediente</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <button 
                          onClick={() => {
                            if (!planLimits.hasDossierGenerator) {
                              triggerPlanGate('dossier_generator');
                              return;
                            }
                            setIsDossierModalOpen(true);
                          }}
                          className="flex-1 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>Ver y Preparar Expediente ({company.name})</span>
                          {!planLimits.hasDossierGenerator && <Lock className="w-3.5 h-3.5 text-blue-200" />}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (!planLimits.has1ClickSubmission) {
                              triggerPlanGate('submission_1click');
                              return;
                            }
                            setIsSubmissionWizardOpen(true);
                          }}
                          className="w-full sm:w-auto py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                        >
                          <SendHorizontal className="w-4 h-4" />
                          <span>Radicar en 1 Clic 🚀</span>
                          {!planLimits.has1ClickSubmission && <Lock className="w-3.5 h-3.5 text-emerald-200" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. PESTAÑAS DE VISTA DEL PROCESO (ESTILO SAAS REPOSITORY TABS DE LA IMAGEN) */}
                <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-0.5">
                  <button
                    onClick={() => setDetailTab('matrix')}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                      detailTab === 'matrix'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Matriz & Diagnóstico</span>
                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] rounded-full flex items-center gap-1">
                      {!planLimits.hasExactGapDiagnosis && <Lock className="w-2.5 h-2.5 text-blue-700" />}
                      <span>RUP</span>
                    </span>
                  </button>

                  <button
                    onClick={() => setDetailTab('assistant')}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                      detailTab === 'assistant'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Bot className="w-4 h-4" />
                    <span>Asistente Legal IA (Gemini)</span>
                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] rounded-full flex items-center gap-1">
                      {!planLimits.hasRagAssistant && <Lock className="w-2.5 h-2.5 text-blue-700" />}
                      <span>Pliegos</span>
                    </span>
                  </button>

                  <button
                    onClick={() => setDetailTab('checklist')}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                      detailTab === 'checklist'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Checklist & Documentos</span>
                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] rounded-full flex items-center gap-1">
                      {!planLimits.hasChecklistDocs && <Lock className="w-2.5 h-2.5 text-blue-700" />}
                      <span>Docs</span>
                    </span>
                  </button>
                </div>

                {/* 3. CONTENIDO DINÁMICO POR PESTAÑA */}
                
                {/* PESTAÑA 1: MATRIZ Y DIAGNÓSTICO */}
                {detailTab === 'matrix' && (
                  planLimits.hasExactGapDiagnosis ? (
                    <div className="space-y-4">
                      
                      {/* BRECHAS Y RECOMENDACIÓN ESTRATÉGICA */}
                      {selectedTender.missing_requirements.length > 0 ? (
                        <div className={`p-4 rounded-xl border text-slate-900 dark:text-slate-100 space-y-3 ${
                          selectedTender.compatibility_score >= 50 
                            ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/60' 
                            : 'bg-rose-50/60 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/60'
                        }`}>
                          <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${
                            selectedTender.compatibility_score >= 50 ? 'text-amber-800 dark:text-amber-400' : 'text-rose-800 dark:text-rose-400'
                          }`}>
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              {selectedTender.compatibility_score >= 50 
                                ? `Faltantes para alcanzar el 100% de Match (${company.name})` 
                                : `Faltantes Críticos de Habilitación (${selectedTender.compatibility_score}% Match)`}
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            {selectedTender.missing_requirements.map((req, idx) => (
                              <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200 flex items-start gap-2 shadow-xs">
                                <span className={selectedTender.compatibility_score >= 50 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-rose-600 dark:text-rose-400 font-bold"}>•</span>
                                <span>{req}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                            <p className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-blue-600" /> Estrategia Sugerida para Postularse:
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                              {selectedTender.strategy_recommendation}
                            </p>
                            {planLimits.hasAdvancedConsortium ? (
                              <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-purple-200 dark:border-purple-800/80 space-y-2.5 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs flex-shrink-0 mt-0.5">
                                      <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-bold text-xs text-purple-950 dark:text-purple-200">
                                          Simulador & Estructurador de Consorcios (Plan Enterprise)
                                        </h5>
                                        <span className="px-2 py-0.5 bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 text-[10px] font-bold rounded-full">
                                          Solución Activa
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5 leading-relaxed">
                                        Genera la solución en proponente plural (Consorcio / UT), simula el 100% de habilitación y descarga la minuta legal oficial para SECOP.
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setIsConsortiumModalOpen(true)}
                                    className="py-2 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/25 hover:scale-[1.02] transition-all cursor-pointer flex-shrink-0"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Abrir Simulador de Consorcio</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => triggerPlanGate('advanced_consortium')}
                                className="mt-2 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3 text-purple-500" />
                                <span>Ver Recomendación Avanzada de Consorcios & Porcentajes (Plan Enterprise 🔒)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
                          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> ¡Sin Brechas de Habilitación! Cumplimiento Total
                          </h4>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {selectedTender.executive_summary}
                          </p>
                        </div>
                      )}

                      {/* TABLA COMPARATIVA FORMAL DE MATRIZ FINANCIERA & RUP */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                          Matriz Comparativa: {company.name} vs Requisitos Oficiales
                        </h3>

                        <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left enterprise-table">
                            <thead>
                              <tr>
                                <th>Criterio de Evaluación</th>
                                <th>Requisito Exigido</th>
                                <th>Acreditación Empresa</th>
                                <th>Estado & Faltantes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#111827]">
                              <tr>
                                <td className="font-medium text-slate-900 dark:text-slate-200">Índice de Liquidez</td>
                                <td className="text-slate-600 dark:text-slate-400">&ge; {selectedTender.financial_compliance.liquidity.required.toFixed(2)}</td>
                                <td className="font-semibold text-slate-900 dark:text-slate-200">{selectedTender.financial_compliance.liquidity.value.toFixed(2)}</td>
                                <td>
                                  {selectedTender.financial_compliance.liquidity.passes ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                      <Check className="w-3.5 h-3.5" /> Cumple
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                      <X className="w-3.5 h-3.5" /> Falta Margen de {selectedTender.financial_compliance.liquidity.gap.toFixed(2)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="font-medium text-slate-900 dark:text-slate-200">Índice de Endeudamiento</td>
                                <td className="text-slate-600 dark:text-slate-400">&le; {(selectedTender.financial_compliance.debt.max_allowed * 100).toFixed(0)}%</td>
                                <td className="font-semibold text-slate-900 dark:text-slate-200">{(selectedTender.financial_compliance.debt.value * 100).toFixed(1)}%</td>
                                <td>
                                  {selectedTender.financial_compliance.debt.passes ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                      <Check className="w-3.5 h-3.5" /> Cumple
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                      <X className="w-3.5 h-3.5" /> Excede por {(selectedTender.financial_compliance.debt.gap * 100).toFixed(1)}%
                                    </span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="font-medium text-slate-900 dark:text-slate-200">Experiencia RUP (SMMLV)</td>
                                <td className="text-slate-600 dark:text-slate-400">{selectedTender.experience_compliance.smmlv_required} SMMLV</td>
                                <td className="font-semibold text-slate-900 dark:text-slate-200">{selectedTender.experience_compliance.smmlv_accumulated} SMMLV</td>
                                <td>
                                  {selectedTender.experience_compliance.passes ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                      <Check className="w-3.5 h-3.5" /> Cumple
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Faltan {selectedTender.experience_compliance.smmlv_gap.toFixed(1)} SMMLV
                                    </span>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  ) : (
                    /* BLOQUE DE RESTRICCIÓN PARA PLAN EXPLORADOR RUP (FREE) */
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                          FUNCIÓN EXCLUSIVA PLAN PYME CONTRATISTA
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                          Matriz Financiera & Diagnóstico Exacto de Brechas RUP
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Conoce con precisión matemática los faltantes en liquidez, endeudamiento y experiencia SMMLV de tu empresa frente al pliego oficial, con auditoría legal de requisitos subsanables.
                        </p>
                      </div>

                      {/* Mockup difuminado de la matriz */}
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 max-w-md mx-auto blur-[2px] select-none space-y-2">
                        <div className="flex justify-between border-b pb-1">
                          <span>Índice de Liquidez (Exigido: ≥ 1.50)</span>
                          <span className="font-bold text-emerald-600">Cumple (2.40)</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span>Índice de Endeudamiento (Exigido: ≤ 70%)</span>
                          <span className="font-bold text-rose-600">Excede por 8.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Experiencia RUP en SMMLV</span>
                          <span className="font-bold text-amber-600">Faltan 145 SMMLV</span>
                        </div>
                      </div>

                      <button
                        onClick={() => triggerPlanGate('exact_gap_diagnosis')}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Desbloquear Matriz & Diagnóstico con Plan Pyme</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                )}

                {/* PESTAÑA 2: ASISTENTE LEGAL & PLIEGOS (IA GEMINI) */}
                {detailTab === 'assistant' && (
                  planLimits.hasRagAssistant ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Bot className="w-4 h-4 text-blue-600" /> Consultor Jurídico de Pliegos & Contratación
                          </h4>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                            Especialista en Ley 80/1993, Ley 1150/2007, Decreto 1082/2015 y Colombia Compra Eficiente
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800">
                            IA Gemini + RAG
                          </span>
                          {queryHistory.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setQueryHistory([
                                {
                                  sender: 'system',
                                  text: `### 🤖 Asistente Jurídico y de Pliegos Activo\nHistorial reiniciado. Puedes consultar cualquier duda sobre **requisitos habilitantes, uniones temporales, subsanabilidad o garantías** para este proceso.`
                                }
                              ])}
                              title="Limpiar conversación"
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* SUGERENCIAS RÁPIDAS DE PREGUNTAS */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10.5px] no-scrollbar">
                        <button
                          type="button"
                          onClick={() => handleSendQuery(undefined, "¿Puedo presentarme en Unión Temporal si no cumplo el indicador de endeudamiento o experiencia?")}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 whitespace-nowrap transition-colors"
                        >
                          🤝 ¿Unión Temporal / Consorcio?
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendQuery(undefined, "¿Qué requisitos y documentos son subsanables y cuáles dan lugar a rechazo de la oferta?")}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 whitespace-nowrap transition-colors"
                        >
                          📄 ¿Qué es subsanable?
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendQuery(undefined, "¿Cómo acredito la capacidad financiera de liquidez y endeudamiento exigida en este pliego?")}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 whitespace-nowrap transition-colors"
                        >
                          📊 ¿Índices Financieros?
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendQuery(undefined, "¿Qué pólizas, garantías de seriedad y porcentajes de anticipo aplican a este proceso?")}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 whitespace-nowrap transition-colors"
                        >
                          🛡️ ¿Garantías y Pólizas?
                        </button>
                      </div>

                      {/* VENTANA DE HISTORIAL DE MENSAJES */}
                      <div className="bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 h-72 overflow-y-auto space-y-3 text-xs shadow-inner">
                        {queryHistory.map((msg, idx) => (
                          <div 
                            key={idx} 
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[90%] rounded-2xl p-3.5 leading-relaxed shadow-xs ${
                              msg.sender === 'user' 
                                ? 'bg-blue-600 text-white font-medium' 
                                : 'bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                            }`}>
                              {msg.sender === 'user' ? (
                                <div className="flex items-start gap-2">
                                  <span className="flex-1">{msg.text}</span>
                                  <User className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-80" />
                                </div>
                              ) : (
                                <div>
                                  {renderMessageContent(msg.text)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {isQuerying && (
                          <div className="flex justify-start">
                            <div className="bg-white dark:bg-[#1e293b] border border-blue-200 dark:border-blue-800/80 rounded-2xl p-3 text-xs shadow-xs flex items-center gap-2.5 text-blue-700 dark:text-blue-300">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="font-semibold">El consultor jurídico está analizando el pliego con IA...</span>
                            </div>
                          </div>
                        )}

                        <div ref={chatBottomRef} />
                      </div>

                      {/* FORMULARIO DE CONSULTA */}
                      <form onSubmit={(e) => handleSendQuery(e)} className="flex gap-2">
                        <div className="relative flex-1">
                          <input 
                            type="text" 
                            value={queryMessage}
                            disabled={isQuerying}
                            onChange={(e) => setQueryMessage(e.target.value)}
                            placeholder="Pregunta sobre este pliego (ej: ¿Se permite subcontratar? ¿Cuál es la garantía exigida?)..." 
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50"
                          />
                          {queryMessage && (
                            <button
                              type="button"
                              onClick={() => setQueryMessage('')}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <button 
                          type="submit"
                          disabled={isQuerying || !queryMessage.trim()}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                        >
                          {isQuerying ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Analizando...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Consultar</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* BLOQUE DE RESTRICCIÓN DEL ASISTENTE RAG PARA PLAN GRATUITO */
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                          FUNCIÓN EXCLUSIVA PLAN PYME CONTRATISTA
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                          Asistente RAG Conversacional sobre Pliegos (Gemini 1.5 Pro)
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Consulta en lenguaje natural requisitos habilitantes, causales de rechazo, pólizas y cláusulas del pliego con fundamentación jurídica en tiempo real.
                        </p>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 max-w-sm mx-auto blur-[1.5px] select-none">
                        "¿Puedo presentarme en Unión Temporal si no cumplo el indicador de endeudamiento?"
                      </div>

                      <button
                        onClick={() => triggerPlanGate('rag_assistant')}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 transition-colors"
                      >
                        <Bot className="w-4 h-4" />
                        <span>Desbloquear Asistente IA con Plan Pyme</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                )}

                {/* PESTAÑA 3: CHECKLIST & DOCUMENTOS EXIGIDOS */}
                {detailTab === 'checklist' && (
                  planLimits.hasChecklistDocs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Puntos Fuertes Acreditados
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                          {selectedTender.reasons.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 leading-tight bg-white dark:bg-[#1e293b] p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-600" /> Checklist de Documentos Exigidos
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                          {selectedTender.required_documents.map((d, i) => (
                            <li key={i} className="flex items-start gap-2 leading-tight bg-white dark:bg-[#1e293b] p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    /* BLOQUE DE RESTRICCIÓN DE CHECKLIST PARA PLAN GRATUITO */
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                          FUNCIÓN EXCLUSIVA PLAN PYME CONTRATISTA
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                          Checklist de Documentos Exigidos & Puntos Fuertes
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Auditoría automática de los pliegos conforme al Decreto 1082 de 2015. Identifica los documentos jurídicos, financieros y técnicos que tu empresa debe adjuntar para no ser rechazada.
                        </p>
                      </div>

                      {/* Mockup difuminado del checklist */}
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 max-w-md mx-auto blur-[2px] select-none space-y-2 text-left">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Certificado RUP Vigente expedido por Cámara de Comercio</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Garantía de Seriedad de la Oferta (10% del Presupuesto)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Carta de Presentación de la Propuesta (Anexo N° 1)</span>
                        </div>
                      </div>

                      <button
                        onClick={() => triggerPlanGate('checklist_docs')}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>Desbloquear Checklist con Plan Pyme</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="p-16 text-center text-slate-400 text-xs bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                <Folder className="w-10 h-10 text-blue-500/40" />
                <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">Ningún proceso seleccionado</p>
                <p className="text-[11px] text-slate-400 max-w-sm">
                  Selecciona una convocatoria de la lista izquierda para visualizar la matriz de habilitación y consultar el asistente legal con IA.
                </p>
              </div>
            )}
          </section>

        </main>
      </div>

      {/* MODAL DE PREVISUALIZACIÓN Y DESCARGA REAL DEL EXPEDIENTE */}
      {selectedTender && (
        <DossierModal
          isOpen={isDossierModalOpen}
          onClose={() => setIsDossierModalOpen(false)}
          company={company}
          tender={selectedTender}
          signedLetter={signedLetters[selectedTender.id] || null}
          dossierDocs={dossierDocsMap[selectedTender.id]}
          onDocListChange={(docs) => {
            setDossierDocsMap(prev => ({
              ...prev,
              [selectedTender.id]: docs
            }));
          }}
          userAttachments={dossierAttachmentsMap[selectedTender.id] || {}}
          onAttachmentsChange={(atts) => {
            setDossierAttachmentsMap(prev => ({
              ...prev,
              [selectedTender.id]: atts
            }));
          }}
          onSignedLetterChange={(file) => {
            setSignedLetters(prev => {
              const updated = { ...prev };
              if (file) {
                updated[selectedTender.id] = file;
              } else {
                delete updated[selectedTender.id];
              }
              return updated;
            });
          }}
          onOpenVault={() => setIsCompanyVaultOpen(true)}
          onStartSubmission={() => setIsSubmissionWizardOpen(true)}
        />
      )}

      {/* MODAL BÓVEDA DOCUMENTAL EMPRESARIAL */}
      <CompanyVaultModal
        isOpen={isCompanyVaultOpen}
        onClose={() => setIsCompanyVaultOpen(false)}
        company={company}
        onVaultUpdated={(updated) => setVaultDocs(updated)}
      />

      {/* MODAL ASISTENTE INTERACTIVO DE RADICACIÓN SECOP */}
      {selectedTender && (
        <SubmissionWizardModal
          isOpen={isSubmissionWizardOpen}
          onClose={() => setIsSubmissionWizardOpen(false)}
          company={company}
          tender={selectedTender}
          signedLetter={signedLetters[selectedTender.id] || null}
          dossierDocs={dossierDocsMap[selectedTender.id]}
          userAttachments={dossierAttachmentsMap[selectedTender.id] || {}}
          onAttachmentsChange={(atts) => {
            setDossierAttachmentsMap(prev => ({
              ...prev,
              [selectedTender.id]: atts
            }));
          }}
          onSignedLetterChange={(file) => {
            setSignedLetters(prev => {
              const updated = { ...prev };
              if (file) {
                updated[selectedTender.id] = file;
              } else {
                delete updated[selectedTender.id];
              }
              return updated;
            });
          }}
          onSubmissionComplete={(info) => {
            setSubmittedTenders(prev => ({
              ...prev,
              [info.tenderId]: {
                radicadoCode: info.radicadoCode,
                submittedAt: info.submittedAt
              }
            }));

            // Registrar automáticamente en el historial de postulaciones
            if (selectedTender) {
              addApplicationRecord({
                tenderId: selectedTender.id,
                processNumber: selectedTender.process_number,
                entityName: selectedTender.entity_name,
                entityNit: selectedTender.entity_nit,
                title: selectedTender.title,
                sourcePlatform: selectedTender.source_platform,
                budgetCop: selectedTender.budget_cop,
                proposedValue: selectedTender.budget_cop * 0.985,
                radicadoCode: info.radicadoCode,
                submittedAt: info.submittedAt,
                closingDate: selectedTender.closing_date,
                department: selectedTender.department,
                processUrl: selectedTender.process_url,
                contractType: selectedTender.contract_type
              }, company.nit);
              setApplicationsHistory(getApplicationsHistory(company.nit));
            }
          }}
        />
      )}

      {/* MODAL PARA AGREGAR O EDITAR LA EMPRESA Y SU CAPACIDAD RUP */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 overflow-y-auto max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Registrar / Editar Información de mi Empresa (RUP)
                </h3>
              </div>
              <button 
                onClick={() => setShowCompanyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              
              {/* DATOS GENERALES */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    1. Información General & Usuarios
                  </h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {currentPlanId === 'free' ? '1 Usuario Administrador' : currentPlanId === 'pyme' ? 'Hasta 3 Usuarios' : 'Usuarios Ilimitados'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Razón Social de la Empresa</label>
                    <input 
                      type="text" 
                      required
                      value={formCompany.name}
                      onChange={e => setFormCompany({...formCompany, name: e.target.value})}
                      placeholder="Ej: Inversiones y Desarrollos S.A.S."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">NIT de la Empresa</label>
                    <input 
                      type="text" 
                      required
                      value={formCompany.nit}
                      onChange={e => setFormCompany({...formCompany, nit: e.target.value})}
                      placeholder="Ej: 900.123.456-7"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* DATOS FINANCIEROS PARA CÁLCULO DE RATIOS */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    2. Estados Financieros RUP (Último Año)
                  </h4>
                  <div className="flex gap-2 text-[10px]">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 rounded-md font-semibold">
                      Liquidez: {formLiquidity}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 rounded-md font-semibold">
                      Endeudamiento: {formDebt}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Activo Corriente (COP)</label>
                    <input 
                      type="number" 
                      required
                      value={formCompany.current_assets}
                      onChange={e => setFormCompany({...formCompany, current_assets: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Pasivo Corriente (COP)</label>
                    <input 
                      type="number" 
                      required
                      value={formCompany.current_liabilities}
                      onChange={e => setFormCompany({...formCompany, current_liabilities: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Activo Total (COP)</label>
                    <input 
                      type="number" 
                      required
                      value={formCompany.total_assets}
                      onChange={e => setFormCompany({...formCompany, total_assets: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Pasivo Total (COP)</label>
                    <input 
                      type="number" 
                      required
                      value={formCompany.total_liabilities}
                      onChange={e => setFormCompany({...formCompany, total_liabilities: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* CAPACIDAD TÉCNICA RUP Y UNSPSC */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                  3. Experiencia RUP y Códigos UNSPSC
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Experiencia Sumada Acreditada (SMMLV)</label>
                    <input 
                      type="number" 
                      required
                      value={formCompany.smmlv_experience}
                      onChange={e => setFormCompany({...formCompany, smmlv_experience: Number(e.target.value)})}
                      placeholder="Ej: 950"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Códigos UNSPSC Acreditados (Separados por coma)</label>
                    <input 
                      type="text" 
                      required
                      value={formCompany.unspsc_codes.join(', ')}
                      onChange={e => setFormCompany({
                        ...formCompany, 
                        unspsc_codes: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                      })}
                      placeholder="Ej: 80101500, 81111500, 43230000"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. REPRESENTACIÓN LEGAL Y DATOS DE NOTIFICACIÓN OFICIAL */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                  4. Representación Legal y Notificaciones Oficiales
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nombre del Representante Legal</label>
                    <input 
                      type="text" 
                      value={formCompany.legal_rep_name || ''}
                      onChange={e => setFormCompany({...formCompany, legal_rep_name: e.target.value})}
                      placeholder="Ej: Carlos Alberto Gómez Mendoza"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Cédula del Representante Legal (C.C.)</label>
                    <input 
                      type="text" 
                      value={formCompany.legal_rep_id || ''}
                      onChange={e => setFormCompany({...formCompany, legal_rep_id: e.target.value})}
                      placeholder="Ej: 1.018.456.789"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Correo Electrónico para Licitaciones</label>
                    <input 
                      type="email" 
                      value={formCompany.email || ''}
                      onChange={e => setFormCompany({...formCompany, email: e.target.value})}
                      placeholder="Ej: licitaciones@miempresa.com"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Teléfono / Celular de Notificación</label>
                    <input 
                      type="tel" 
                      value={formCompany.phone || ''}
                      onChange={e => setFormCompany({...formCompany, phone: e.target.value})}
                      placeholder="Ej: (+57) 310 123 4567"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Ciudad / Municipio Principal</label>
                    <input 
                      type="text" 
                      value={formCompany.city || ''}
                      onChange={e => setFormCompany({...formCompany, city: e.target.value})}
                      placeholder="Ej: Bogotá D.C."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Dirección Comercial Sede Principal</label>
                    <input 
                      type="text" 
                      value={formCompany.address || ''}
                      onChange={e => setFormCompany({...formCompany, address: e.target.value})}
                      placeholder="Ej: Carrera 7 # 71-21 Torre B Of. 502"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* BOTONES ACCIÓN MODAL */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Guardar y Re-evaluar</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DE AUTENTICACIÓN SUPABASE */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authInitialTab}
        onSuccess={(user, isNewUser) => {
          setUserSession({ email: user.email, companyName: user.companyName });
          if (user.companyName || user.nit) {
            setCompany(prev => {
              const updated = {
                ...prev,
                name: user.companyName || prev.name,
                nit: user.nit || prev.nit
              };
              storeCompanyProfile(updated);
              return updated;
            });
            setFormCompany(prev => ({
              ...prev,
              name: user.companyName || prev.name,
              nit: user.nit || prev.nit
            }));
          }
          setIsAuthModalOpen(false);
          if (isNewUser) {
            setIsOnboardingOpen(true);
          }
        }}
      />

      {/* ASISTENTE ONBOARDING RUP CON CARGA DE PDF */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        initialCompanyName={company.name}
        initialNit={company.nit}
        onComplete={(newCompanyData) => {
          setCompany(newCompanyData);
          setFormCompany(newCompanyData);
          storeCompanyProfile(newCompanyData);
          setIsOnboardingOpen(false);
        }}
      />

      {/* MODAL DE SUSCRIPCIONES Y PAGOS WOMPI SAAS */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        currentPlanId={currentPlanId}
        userEmail={userSession?.email}
        onPlanUpgraded={handlePlanUpgraded}
      />

      {/* MODAL DE RESTRICCIÓN Y MEJORA DE PLAN (GATING) */}
      <PlanGateModal
        isOpen={isPlanGateOpen}
        onClose={() => setIsPlanGateOpen(false)}
        featureType={gateFeatureType}
        currentPlanId={currentPlanId}
        onOpenUpgradeModal={() => setIsSubModalOpen(true)}
      />

      {/* MODAL HISTORIAL DE POSTULACIONES Y SEGUIMIENTO EN TIEMPO REAL */}
      <ApplicationsHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        applications={applicationsHistory}
        onApplicationsChange={(updated) => setApplicationsHistory(updated)}
        companyNit={company.nit}
        companyName={company.name}
      />

      {/* MODAL SIMULADOR Y ESTRUCTURADOR AVANZADO DE CONSORCIOS (PLAN ENTERPRISE) */}
      {selectedTender && (
        <ConsortiumSimulatorModal
          isOpen={isConsortiumModalOpen}
          onClose={() => setIsConsortiumModalOpen(false)}
          tender={selectedTender as any}
          company={company}
        />
      )}

    </div>
  );
}
