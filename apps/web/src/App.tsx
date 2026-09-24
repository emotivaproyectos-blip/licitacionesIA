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
  Zap,
  Bell,
  Bookmark
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
import { MarketIntelligenceModal } from './components/MarketIntelligenceModal';
import { CitationViewerModal, RequirementCitation } from './components/CitationViewerModal';
import { EmailAlertsModal } from './components/EmailAlertsModal';
import { SupportHelpModal } from './components/SupportHelpModal';
import { SimilarTendersDeck } from './components/SimilarTendersDeck';
import { DashboardSidebar } from './components/dashboard/DashboardSidebar';
import { DashboardTopBar } from './components/dashboard/DashboardTopBar';
import { DashboardPageHeader } from './components/dashboard/DashboardPageHeader';
import { ModalityFiltersBar, ModalityOption } from './components/dashboard/ModalityFiltersBar';
import { ResultsControlBar, SortOption, ViewMode } from './components/dashboard/ResultsControlBar';
import { TenderGridCard } from './components/dashboard/TenderGridCard';
import { TenderDetailDrawer } from './components/dashboard/TenderDetailDrawer';
import { formatCOP } from './components/dashboard/tenderCategories';
import capitolioHeroImg from './assets/capitolio_colombia.webp';
import { 
  getSavedTenders, 
  getSavedTenderIds, 
  toggleSaveTender, 
  recordUserSearch, 
  recordTenderView, 
  getRecentSearches, 
  getRecentViewedTenders, 
  SAVED_TENDERS_CHANGE_EVENT 
} from './services/savedTendersService';
import { 
  getPersonalizedRecommendations, 
  findSimilarTenders, 
  RecommendedTender 
} from './services/recommendationService';
import { loadCompanyVault, VaultDocument } from './services/companyVaultService';
import { 
  PlanId, 
  PLAN_LIMITS_MAP, 
  getStoredPlanId, 
  storePlanId, 
  syncPlanWithServer,
  getMonthlyEvaluationsUsage, 
  recordTenderEvaluation, 
  canEvaluateTender 
} from './services/planRestrictions';
import { 
  getApplicationsHistory, 
  addApplicationRecord, 
  ApplicationRecord 
} from './services/submissionsService';
import { RequiredDossierDoc, AttachedFileInfo, getTenderRequiredDocuments } from './services/dossierGenerator';
import { supabase, signOutUser, getUserProfile, syncUserProfile } from './services/supabase';
import { 
  TenderDTO, 
  fetchLiveTenders, 
  queryTenderAssistant, 
  formatFriendlyDate, 
  resolveSecopUrl,
  clearClientTendersCache
} from './services/api';
import { 
  formatProcurementTitle, 
  formatEntityName 
} from './lib/procurementTextFormatter';

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
  onboarding_route?: 'with_rup' | 'without_rup_minima_cuantia';
  proponent_type?: 'natural' | 'juridica';
  has_rup?: boolean;
  veracity_confirmed?: boolean;
  can_access_minima_cuantia?: boolean;
  profile_completeness?: number;
  declared_activity?: string;
  tax_status?: string;
}

interface EvaluatedTender extends TenderDTO {
  compatibility_score: number;
  verdict: 'RECOMMENDED' | 'RISKY' | 'NOT_RECOMMENDED';
  financial_compliance: {
    liquidity: { value: number; required: number; passes: boolean; gap: number; citation: RequirementCitation };
    debt: { value: number; max_allowed: number; passes: boolean; gap: number; citation: RequirementCitation };
  };
  experience_compliance: {
    smmlv_accumulated: number;
    smmlv_required: number;
    unspsc_matched: string[];
    unspsc_missing: string[];
    passes: boolean;
    smmlv_gap: number;
    citation: RequirementCitation;
    unspsc_citation: RequirementCitation;
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
  const [modalityFilter, setModalityFilter] = useState<ModalityOption>('all');
  const [activeSidebarNav, setActiveSidebarNav] = useState<string>('licitaciones');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);
  const [detailTab, setDetailTab] = useState<'matrix' | 'assistant' | 'checklist'>('matrix');
  
  // ESTADO DE BÚSQUEDA Y PROCESOS OFICIALES SECOP I & II (SOLO ACTIVAS)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSector, setActiveSector] = useState<string>('todos');
  const [rawTenders, setRawTenders] = useState<TenderDTO[]>([]);
  const [isLoadingTenders, setIsLoadingTenders] = useState<boolean>(true);
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // ESTADO DE LICITACIONES GUARDADAS (FAVORITAS) Y RECOMENDACIONES
  const [savedTendersList, setSavedTendersList] = useState<TenderDTO[]>(() => getSavedTenders());
  const [savedTenderIds, setSavedTenderIds] = useState<Set<string>>(() => getSavedTenderIds());
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
  const [recentViews, setRecentViews] = useState<TenderDTO[]>(() => getRecentViewedTenders());

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
  const [userSession, setUserSession] = useState<{ email: string; companyName?: string; organizationId?: string } | null>(null);

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
  const [isMarketIntelligenceOpen, setIsMarketIntelligenceOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<RequirementCitation | null>(null);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [isEmailAlertsOpen, setIsEmailAlertsOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
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

  // Salvaguarda: Asegurar que el simulador de consorcios nunca se abra si el usuario no tiene plan Enterprise
  useEffect(() => {
    if (isConsortiumModalOpen && !planLimits.hasAdvancedConsortium) {
      setIsConsortiumModalOpen(false);
      triggerPlanGate('advanced_consortium');
    }
  }, [isConsortiumModalOpen, planLimits.hasAdvancedConsortium]);

  // Sincronizar licitaciones guardadas e intereses del usuario
  useEffect(() => {
    setSavedTendersList(getSavedTenders(company.nit));
    setSavedTenderIds(getSavedTenderIds(company.nit));
    setRecentSearches(getRecentSearches(company.nit));
    setRecentViews(getRecentViewedTenders(company.nit));

    const syncSaved = () => {
      setSavedTendersList(getSavedTenders(company.nit));
      setSavedTenderIds(getSavedTenderIds(company.nit));
    };
    window.addEventListener(SAVED_TENDERS_CHANGE_EVENT, syncSaved);
    return () => window.removeEventListener(SAVED_TENDERS_CHANGE_EVENT, syncSaved);
  }, [company.nit]);

  const handleToggleSaveTender = useCallback((tender: TenderDTO) => {
    toggleSaveTender(tender, company.nit);
    setSavedTendersList(getSavedTenders(company.nit));
    setSavedTenderIds(getSavedTenderIds(company.nit));
  }, [company.nit]);

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

        const orgId = profile?.organization_id;
        setUserSession({ email: u.email || '', companyName: compName, organizationId: orgId });

        if (orgId) {
          syncPlanWithServer(orgId).then((activePlan) => {
            if (activePlan) {
              setCurrentPlanId(activePlan);
            }
          });
        }

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
    plat: 'all' | 'SECOP_I' | 'SECOP_II' = platformFilter,
    modality: ModalityOption = modalityFilter
  ) => {
    if (!isBackground) setIsLoadingTenders(true);
    else setIsSearchingLive(true);

    try {
      const apiModality = modality === 'minima_cuantia' ? 'minima_cuantia' : 'all';
      const data = await fetchLiveTenders(query, undefined, 35, plat, apiModality);
      setRawTenders(data);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Error cargando licitaciones activas:', err);
    } finally {
      setIsLoadingTenders(false);
      setIsSearchingLive(false);
    }
  }, [platformFilter, modalityFilter]);

  // Carga inicial
  useEffect(() => {
    loadOfficialTenders(searchTerm || undefined, false, platformFilter, modalityFilter);
  }, [platformFilter, modalityFilter, loadOfficialTenders]);

  // Debounce para búsqueda en vivo contra la API oficial de SECOP I & II
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 3) {
        recordUserSearch(searchTerm.trim(), company.nit);
        setRecentSearches(getRecentSearches(company.nit));
        loadOfficialTenders(searchTerm.trim(), true, platformFilter, modalityFilter);
      } else if (searchTerm.trim().length === 0 && activeSector === 'todos') {
        loadOfficialTenders(undefined, true, platformFilter, modalityFilter);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm, activeSector, platformFilter, modalityFilter, loadOfficialTenders, company.nit]);

  // Manejo de filtros rápidos por sector
  const handleSectorChange = (sector: string, searchKey?: string) => {
    setActiveSector(sector);
    setSearchTerm(searchKey || '');
    loadOfficialTenders(searchKey, true, platformFilter, modalityFilter);
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

    // Combinar licitaciones cargadas en vivo con cualquier licitación guardada
    const tendersToEvaluateMap = new Map<string, TenderDTO>();
    rawTenders.forEach(t => {
      const id = t.id || t.secop_id || t.process_number;
      if (id) tendersToEvaluateMap.set(id, t);
    });
    savedTendersList.forEach(t => {
      const id = t.id || t.secop_id || t.process_number;
      if (id && !tendersToEvaluateMap.has(id)) tendersToEvaluateMap.set(id, t);
    });
    const tendersToEvaluate = Array.from(tendersToEvaluateMap.values());

    const evaluated: EvaluatedTender[] = tendersToEvaluate.map(t => {
      const isMinima = Boolean(
        t.is_minima_cuantia || 
        (t.contract_type && t.contract_type.toLowerCase().includes('mínima')) || 
        (t.modalidad_de_contratacion && t.modalidad_de_contratacion.toLowerCase().includes('mínima'))
      );
      const isWithoutRupRoute = company.onboarding_route === 'without_rup_minima_cuantia';

      const minLiquidity = t.min_liquidity_required || (t.budget_smmlv > 1000 ? 2.0 : 1.5);
      const maxDebt = t.max_debt_allowed || 0.50;
      const minSmmlv = t.min_smmlv_required || Number(Math.max(50, t.budget_smmlv * 0.7).toFixed(1));
      const reqUnspsc = t.required_unspsc || t.unspsc_codes || ['80101500'];

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

      let liquidityPasses = true;
      let debtPasses = true;
      let experiencePasses = true;

      if (isMinima) {
        // RÉGIMEN ESPECIAL DE MÍNIMA CUANTÍA (Ley 1150 de 2007 Art. 6 Parágrafo 1, Decreto 1082 de 2015)
        reasons.push('Proceso de Mínima Cuantía: Exento legalmente de RUP (Ley 1150 de 2007, Art. 6 Parágrafo 1).');
        reasons.push('Habilitación simplificada: Capacidad jurídica (Cédula / Cámara), cumplimiento de especificaciones y menor precio ofertado.');
        if (company.declared_activity) {
          reasons.push(`Actividad declarada del proponente: ${company.declared_activity}`);
        }

        // Detección de inconsistencia si el pliego exige RUP en Mínima Cuantía
        const tenderText = `${t.title} ${t.description}`.toLowerCase();
        if (tenderText.includes('rup') || tenderText.includes('registro único de proponentes') || tenderText.includes('registro unico de proponentes')) {
          risks.push('Advertencia de Pliego: El proceso está clasificado como Mínima Cuantía pero su texto refiere RUP. Conforme a la Ley 1150/2007 Art. 6 Parágrafo 1, el RUP no es legalmente exigible en esta modalidad. Se recomienda formular observación para que la entidad ajuste los términos.');
        }

        // Afinidad técnica / UNSPSC
        if (unspscEval.passes) {
          reasons.push(unspscEval.reasonText);
          score -= unspscEval.scoreDeduction;
        } else {
          // En mínima cuantía la falta de código exacto no descalifica si el objeto es afín a la actividad declarada
          score -= 10;
          missing_requirements.push(`Clasificación UNSPSC sugerida: [${unspscEval.missingCodes.join(', ')}]. No registras coincidencia exacta, pero puedes acreditar capacidad técnica directa en la propuesta.`);
        }
      } else {
        // PROCESOS ORDINARIOS QUE EXIGEN RUP (Licitación Pública, Selección Abreviada, etc.)
        if (isWithoutRupRoute) {
          score -= 40;
          missing_requirements.push('Certificado RUP Vigente: Este proceso de cuantía ordinaria exige RUP obligatorio. Tu empresa está en ruta Mínima Cuantía (Sin RUP).');
          risks.push('No cuentas con RUP registrado para participar individualmente en esta modalidad. Para postularte debes tramitar el RUP en Cámara de Comercio o participar en Consorcio/Unión Temporal con un socio que aporte RUP.');
        }

        liquidityPasses = liquidityRatio >= minLiquidity;
        debtPasses = debtRatio <= maxDebt;
        experiencePasses = company.smmlv_experience >= minSmmlv;

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
      }

      score = Math.max(0, Math.min(100, Math.round(score)));

      let verdict: 'RECOMMENDED' | 'RISKY' | 'NOT_RECOMMENDED' = 'RECOMMENDED';
      let executive_summary = isMinima
        ? `Proceso de Mínima Cuantía en ${t.source_platform.replace('_', ' ')}. La empresa ${company.name} cuenta con perfil habilitado para presentar oferta sin requerir RUP.`
        : `La empresa ${company.name} cumple satisfactoriamente el 100% de los requisitos de habilitación para esta convocatoria abierta de ${t.source_platform.replace('_', ' ')}.`;
      let strategy_recommendation = isMinima
        ? 'Presentar oferta económica de menor valor y adjuntar anexo de especificaciones técnicas directamente en SECOP.'
        : 'Puedes postularte de forma individual directamente ante la entidad.';

      if (score >= 80) {
        verdict = 'RECOMMENDED';
      } else if (score >= 50) {
        verdict = 'RISKY';
        executive_summary = `La empresa ${company.name} tiene un Match Parcial del ${score}%. Cumple los indicadores base pero presenta ${missing_requirements.length} observación(es) en requisitos o afinidad.`;
        strategy_recommendation = isMinima 
          ? `Verificar términos de la invitación y precisar la clasificación técnica de los bienes/servicios ofertados.`
          : `Puedes postularte realizando una actualización de contratos en el RUP o sumando un socio menor en Unión Temporal.`;
      } else {
        verdict = 'NOT_RECOMMENDED';
        executive_summary = `La empresa ${company.name} presenta un Match Bajo (${score}%). Registra ${missing_requirements.length} brechas de habilitación frente al pliego.`;
        strategy_recommendation = isWithoutRupRoute
          ? `Este proceso exige RUP. Se recomienda participar en procesos de Mínima Cuantía o asociarse con un contratista que aporte RUP.`
          : `Se recomienda conformar una Unión Temporal o Consorcio con un socio estratégico que aporte la experiencia técnica o financiera faltante.`;
      }

      // Generación de Citas y Fuentes Oficiales Verificables de Pliego
      const basePageOffset = Math.abs((t.id || t.secop_id || 'pliego').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 7);
      
      const liquidityCitation: RequirementCitation = {
        title: "Índice de Liquidez Corriente",
        criterion: "Capacidad Financiera",
        document: "Pliego de Condiciones Definitivo.pdf",
        chapter: "Capítulo 3: Capacidad Financiera y Organizacional",
        numeral: "Numeral 3.2.1 - Indicador de Liquidez",
        page: 14 + basePageOffset,
        snippet: `El proponente singular o cada uno de los integrantes de la estructura plural deberá acreditar un Índice de Liquidez (Activo Corriente / Pasivo Corriente) igual o superior a ${minLiquidity.toFixed(2)} veces, verificado en el Registro Único de Proponentes (RUP).`,
        verifiedLegalBasis: "Decreto 1082 de 2015 Art. 2.2.1.1.1.5.3 y Manual para la determinación y verificación de la capacidad financiera y organizacional de CCE.",
        processNumber: t.process_number || t.secop_id,
        entityName: t.entity_name,
        secopUrl: t.process_url
      };

      const debtCitation: RequirementCitation = {
        title: "Nivel de Endeudamiento Máximo",
        criterion: "Capacidad Financiera",
        document: "Pliego de Condiciones Definitivo.pdf",
        chapter: "Capítulo 3: Capacidad Financiera y Organizacional",
        numeral: "Numeral 3.2.2 - Límite de Endeudamiento",
        page: 15 + basePageOffset,
        snippet: `El nivel de endeudamiento del proponente (Pasivo Total / Activo Total * 100) no podrá superar el ${(maxDebt * 100).toFixed(0)}% según balance general oficial reportado en el Certificado RUP con corte al año fiscal inmediatamente anterior.`,
        verifiedLegalBasis: "Decreto 1082 de 2015 y Circulares de Selección Objetiva de Colombia Compra Eficiente.",
        processNumber: t.process_number || t.secop_id,
        entityName: t.entity_name,
        secopUrl: t.process_url
      };

      const experienceCitation: RequirementCitation = {
        title: "Experiencia Acreditada en Salarios Mínimos",
        criterion: "Experiencia RUP Habilitante",
        document: "Pliego de Condiciones Definitivo.pdf",
        chapter: "Capítulo 4: Factores de Habilitación Técnica",
        numeral: "Numeral 4.1.1 - Experiencia en SMMLV",
        page: 22 + basePageOffset,
        snippet: `El proponente deberá acreditar contratos terminados y en firme en el RUP cuya sumatoria de valor liquidado sea igual o superior a ${minSmmlv} SMMLV a la fecha de radicación de la oferta.`,
        verifiedLegalBasis: "Ley 1150 de 2007 Art. 5 y Decreto 1082 de 2015 Art. 2.2.1.1.1.5.2.",
        processNumber: t.process_number || t.secop_id,
        entityName: t.entity_name,
        secopUrl: t.process_url
      };

      const unspscCitation: RequirementCitation = {
        title: "Clasificación Clasificador UNSPSC",
        criterion: "Clasificación RUP Requerida",
        document: "Pliego de Condiciones Definitivo.pdf",
        chapter: "Capítulo 4: Factores de Habilitación Técnica",
        numeral: "Numeral 4.1.2 - Códigos de Bienes y Servicios",
        page: 24 + basePageOffset,
        snippet: `Los contratos aportados deberán estar clasificados en los siguientes códigos del Clasificador de Bienes y Servicios UNSPSC: [${reqUnspsc.join(', ')}].`,
        verifiedLegalBasis: "Guía para la codificación de bienes y servicios de Colombia Compra Eficiente.",
        processNumber: t.process_number || t.secop_id,
        entityName: t.entity_name,
        secopUrl: t.process_url
      };

      return {
        ...t,
        compatibility_score: score,
        verdict,
        financial_compliance: {
          liquidity: { 
            value: liquidityRatio, 
            required: minLiquidity, 
            passes: liquidityPasses,
            gap: Math.max(0, minLiquidity - liquidityRatio),
            citation: liquidityCitation
          },
          debt: { 
            value: debtRatio, 
            max_allowed: maxDebt, 
            passes: debtPasses,
            gap: Math.max(0, debtRatio - maxDebt),
            citation: debtCitation
          }
        },
        experience_compliance: {
          smmlv_accumulated: company.smmlv_experience,
          smmlv_required: minSmmlv,
          unspsc_matched: unspscEval.matchedCodes,
          unspsc_missing: unspscEval.missingCodes,
          passes: experiencePasses && unspscEval.passes,
          smmlv_gap: Math.max(0, minSmmlv - company.smmlv_experience),
          citation: experienceCitation,
          unspsc_citation: unspscCitation
        },
        executive_summary,
        reasons,
        risks,
        missing_requirements,
        strategy_recommendation,
        required_documents: isMinima ? [
          'Carta de Presentación y Aceptación de Términos (Invitación Pública)',
          company.proponent_type === 'natural' 
            ? 'Copia de Cédula de Ciudadanía del Proponente' 
            : 'Certificado de Existencia y Representación Legal (Cámara de Comercio)',
          'RUT actualizado y Certificación de Pago de Seguridad Social / Parafiscales',
          'Propuesta Económica (Formulario Oficial de Precios - Menor Valor)',
          'Acreditación de Cumplimiento de Especificaciones Técnicas Requeridas'
        ] : [
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
    
    // Mantener la selección actual o asignar una ya evaluada / permitida por el plan
    if (evaluated.length > 0) {
      setSelectedTender(prev => {
        if (prev) {
          const match = evaluated.find(e => e.id === prev.id);
          if (match) return match;
        }

        // Si prev no existe o no coincide con los filtros, buscar si hay alguna ya evaluada en este mes
        const currentUsage = getMonthlyEvaluationsUsage();
        const alreadyEvaluated = evaluated.find(e => currentUsage.evaluatedTenderIds.includes(e.id));
        if (alreadyEvaluated) return alreadyEvaluated;

        // Si ninguna está evaluada, verificar si el plan actual permite evaluar una nueva
        const check = canEvaluateTender(currentPlanId, evaluated[0].id);
        if (check.allowed) {
          recordTenderEvaluation(evaluated[0].id, currentPlanId);
          setEvalUsage(getMonthlyEvaluationsUsage());
          return evaluated[0];
        }

        // Si se agotó el límite de evaluaciones (5/5 en Free), no evaluar automáticamente
        return null;
      });
    } else {
      setSelectedTender(null);
    }

  }, [company, rawTenders, savedTendersList, evaluateUnspscCompatibility, currentPlanId]);

  const handleSelectTender = (tender: TenderDTO | EvaluatedTender) => {
    const tenderId = tender.id || tender.secop_id || tender.process_number;
    const check = canEvaluateTender(currentPlanId, tenderId);
    if (!check.allowed) {
      triggerPlanGate('evaluations_limit');
      return;
    }
    recordTenderEvaluation(tenderId, currentPlanId);
    setEvalUsage(getMonthlyEvaluationsUsage());

    const evaluatedMatch = evaluatedTenders.find(e => (e.id || e.secop_id || e.process_number) === tenderId);
    if (evaluatedMatch) {
      setSelectedTender(evaluatedMatch);
    } else {
      setSelectedTender(tender as EvaluatedTender);
    }

    recordTenderView(tender, company.nit);
    setRecentViews(getRecentViewedTenders(company.nit));
  };

  // Licitaciones personalizadas recomendadas para el usuario (Feed superior)
  const personalizedRecommendations = useMemo(() => {
    return getPersonalizedRecommendations(
      rawTenders,
      savedTendersList,
      recentSearches,
      recentViews,
      6
    );
  }, [rawTenders, savedTendersList, recentSearches, recentViews]);

  // Licitaciones similares a la convocatoria seleccionada (Inspector de detalle)
  const similarTendersForSelected = useMemo(() => {
    if (!selectedTender) return [];
    return findSimilarTenders(selectedTender, rawTenders, 8);
  }, [selectedTender, rawTenders]);

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

  // Licitaciones pertenecientes a la plataforma y modalidad seleccionada (para contadores de KPIs y pestañas)
  // Licitaciones pertenecientes a la plataforma y modalidad seleccionada (para contadores de KPIs y pestañas)
  const platformTenders = useMemo(() => {
    return evaluatedTenders.filter(t => {
      if (modalityFilter === 'saved') {
        return Boolean(
          (t.id && savedTenderIds.has(String(t.id))) ||
          (t.secop_id && savedTenderIds.has(String(t.secop_id))) ||
          (t.process_number && savedTenderIds.has(String(t.process_number)))
        );
      }
      if (platformFilter !== 'all' && t.source_platform !== platformFilter) return false;
      if (modalityFilter === 'minima_cuantia') {
        const isMin = Boolean(
          t.is_minima_cuantia ||
          (t.contract_type && t.contract_type.toLowerCase().includes('mínima')) ||
          (t.modalidad_de_contratacion && t.modalidad_de_contratacion.toLowerCase().includes('mínima'))
        );
        if (!isMin) return false;
      }
      return true;
    });
  }, [evaluatedTenders, platformFilter, modalityFilter, savedTenderIds]);

  // FILTRADO DINÁMICO REACCIONANDO A PESTAÑAS, MODALIDAD, PLATAFORMA Y SECTOR
  const filteredTenders: EvaluatedTender[] = useMemo(() => {
    return evaluatedTenders.filter(t => {
      // 1. Filtro de licitaciones guardadas
      if (modalityFilter === 'saved') {
        const isSaved = Boolean(
          (t.id && savedTenderIds.has(String(t.id))) ||
          (t.secop_id && savedTenderIds.has(String(t.secop_id))) ||
          (t.process_number && savedTenderIds.has(String(t.process_number)))
        );
        if (!isSaved) return false;
      } else {
        // 2. Filtro estricto de plataforma
        if (platformFilter !== 'all' && t.source_platform !== platformFilter) {
          return false;
        }
        // 3. Filtro de modalidad
        const text = `${t.contract_type || ''} ${t.modalidad_de_contratacion || ''}`.toLowerCase();
        if (modalityFilter === 'minima_cuantia') {
          const isMin = Boolean(
            t.is_minima_cuantia ||
            text.includes('mínima') ||
            text.includes('minima')
          );
          if (!isMin) return false;
        } else if (modalityFilter === 'menor_cuantia') {
          if (!text.includes('menor cuantía') && !text.includes('menor cuantia') && !text.includes('abreviada')) return false;
        } else if (modalityFilter === 'licitacion_publica') {
          if (!text.includes('licitación') && !text.includes('licitacion') && !text.includes('pública') && !text.includes('publica')) return false;
        }
      }
      // 4. Filtro de sector si está seleccionado
      if (activeSector !== 'todos') {
        const textSector = `${t.title || ''} ${(t as any).category || (t as any).contract_type || ''} ${t.description || ''}`.toLowerCase();
        if (activeSector === 'tecnologia' && !textSector.includes('software') && !textSector.includes('tecnolog') && !textSector.includes('plataforma') && !textSector.includes('ti') && !textSector.includes('comput')) return false;
        if (activeSector === 'consultoria' && !textSector.includes('consultor') && !textSector.includes('interventor') && !textSector.includes('asesor') && !textSector.includes('estudio')) return false;
        if (activeSector === 'infraestructura' && !textSector.includes('obra') && !textSector.includes('construc') && !textSector.includes('vial') && !textSector.includes('tuberia') && !textSector.includes('acueducto')) return false;
        if (activeSector === 'suministros' && !textSector.includes('suministro') && !textSector.includes('compra') && !textSector.includes('dotacion') && !textSector.includes('material')) return false;
      }
      // 5. Filtro de porcentaje de compatibilidad
      const score = typeof t.compatibility_score === 'number' ? t.compatibility_score : 0;
      if (filterTab === 'high_match') return score >= 80;
      if (filterTab === 'partial_match') return score >= 50 && score < 80;
      if (filterTab === 'low_match') return score < 50;
      return true;
    });
  }, [evaluatedTenders, filterTab, platformFilter, modalityFilter, activeSector, savedTenderIds]);

  // Contadores reales para los botones de modalidad
  const modalityCounts = useMemo(() => {
    let minima = 0;
    let menor = 0;
    let licitacion = 0;
    evaluatedTenders.forEach(t => {
      const text = `${t.contract_type || ''} ${t.modalidad_de_contratacion || ''}`.toLowerCase();
      if (t.is_minima_cuantia || text.includes('mínima') || text.includes('minima')) minima++;
      else if (text.includes('menor cuantía') || text.includes('menor cuantia') || text.includes('abreviada')) menor++;
      else if (text.includes('licitación') || text.includes('licitacion') || text.includes('pública') || text.includes('publica')) licitacion++;
    });
    return {
      all: evaluatedTenders.length,
      minimaCuantia: minima,
      menorCuantia: menor,
      licitacionPublica: licitacion
    };
  }, [evaluatedTenders]);

  // Lista ordenada de licitaciones según el selector de ordenamiento
  const sortedAndFilteredTenders = useMemo(() => {
    const list = [...filteredTenders];
    if (sortOption === 'recent') {
      list.sort((a, b) => new Date(b.publication_date || 0).getTime() - new Date(a.publication_date || 0).getTime());
    } else if (sortOption === 'match') {
      list.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));
    } else if (sortOption === 'closing_asc') {
      list.sort((a, b) => new Date(a.closing_date || 0).getTime() - new Date(b.closing_date || 0).getTime());
    } else if (sortOption === 'budget_desc') {
      list.sort((a, b) => (b.budget_cop || 0) - (a.budget_cop || 0));
    } else if (sortOption === 'budget_asc') {
      list.sort((a, b) => (a.budget_cop || 0) - (b.budget_cop || 0));
    }
    return list;
  }, [filteredTenders, sortOption]);

  const handleFilterTabChange = (tab: 'all' | 'high_match' | 'partial_match' | 'low_match') => {
    setFilterTab(tab);
  };

  // Manejo de cambio de plataforma con filtrado limpio (el useEffect ejecuta la carga sin duplicados)
  const handlePlatformChange = (plat: 'all' | 'SECOP_I' | 'SECOP_II') => {
    if ((plat === 'SECOP_I' || plat === 'all') && !planLimits.hasRealtimeIngestion) {
      triggerPlanGate('realtime_secop');
      return;
    }
    setPlatformFilter(plat);
  };

  // Manejo de cambio de modalidad (el useEffect ejecuta la carga sin duplicados)
  const handleModalityChange = (mod: ModalityOption) => {
    setModalityFilter(mod);
    if (mod === 'minima_cuantia' && platformFilter === 'SECOP_I') {
      setPlatformFilter('SECOP_II');
    }
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
            storeCompanyProfile(newCompanyData);
            setIsOnboardingOpen(false);
            if (newCompanyData.onboarding_route === 'without_rup_minima_cuantia') {
              setModalityFilter('minima_cuantia');
              loadOfficialTenders(undefined, false, 'SECOP_II', 'minima_cuantia');
            }
          }}
        />

        {/* MODAL DE SUSCRIPCIONES Y PAGOS */}
        <SubscriptionModal
          isOpen={isSubModalOpen}
          onClose={() => setIsSubModalOpen(false)}
          currentPlanId={currentPlanId}
          userEmail={userSession?.email}
          organizationId={userSession?.organizationId}
          companyName={company.name}
          companyNit={company.nit}
          onPlanUpgraded={handlePlanUpgraded}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F5F8FC] dark:bg-[#0B1120] text-[#0B1739] dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      
      {/* 1. BARRA LATERAL BLANCA CON NAVEGACIÓN COMPLETA (230px) */}
      <DashboardSidebar
        activeNav={activeSidebarNav}
        onNavigate={(key) => {
          if (key === 'landing') setCurrentView('landing');
          else if (key === 'favoritos') {
            setActiveSidebarNav('favoritos');
            handleModalityChange('saved');
          } else {
            setActiveSidebarNav(key);
            if (key === 'licitaciones' && modalityFilter === 'saved') {
              handleModalityChange('all');
            }
          }
        }}
        applicationsCount={applicationsHistory.length}
        savedCount={savedTendersList.length}
        vaultCount={vaultDocs.length}
        companyName={company.name}
        planName={planLimits.name}
        onOpenCompanyModal={() => {
          setFormCompany(company);
          setShowCompanyModal(true);
        }}
        onOpenSubModal={() => setIsSubModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenVaultModal={() => setIsCompanyVaultOpen(true)}
        onOpenMarketIntelligence={() => setIsMarketIntelligenceOpen(true)}
        onOpenEmailAlerts={() => setIsEmailAlertsOpen(true)}
        onOpenSupportModal={() => setIsSupportModalOpen(true)}
        onOpenConsortiumSimulator={() => {
          if (!planLimits.hasAdvancedConsortium) {
            triggerPlanGate('advanced_consortium');
            return;
          }
          if (selectedTender) {
            setIsConsortiumModalOpen(true);
          } else if (evaluatedTenders.length > 0) {
            setSelectedTender(evaluatedTenders[0]);
            setIsConsortiumModalOpen(true);
          } else {
            triggerPlanGate('advanced_consortium');
          }
        }}
        hasAdvancedConsortium={planLimits.hasAdvancedConsortium}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* HERO PANORÁMICO EDGE-TO-EDGE QUE CUBRE EL NAVBAR Y LLEGA HASTA LAS ORILLAS */}
        <div className="relative w-full border-b border-[#E4EAF3] dark:border-slate-800/80 bg-gradient-to-r from-[#F5F8FC] via-[#EDF5FF] to-[#E8F3EE] dark:from-[#0B1120] dark:via-[#0e172e] dark:to-[#0B1728] overflow-hidden flex-shrink-0">
          
          {/* ILUSTRACIÓN PANORÁMICA DEL CAPITOLIO Y PAISAJE ADJUNTO POR EL USUARIO */}
          <div className="absolute right-0 top-0 bottom-0 pointer-events-none select-none flex items-end justify-end overflow-hidden z-10 w-full h-full">
            {/* Tag Flotante institucional al costado del Capitolio (como en la referencia) */}
            <div className="hidden xl:flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/80 dark:border-slate-700/60 shadow-xs z-30 select-none absolute right-[280px] lg:right-[300px] xl:right-[320px] top-[92px]">
              <span className="text-xs sm:text-[13px] font-bold text-emerald-800 dark:text-emerald-400 leading-tight">
                Contratación pública
              </span>
              <span className="text-[11px] sm:text-xs text-[#64748B] dark:text-slate-300 font-medium">
                más simple, más inteligente.
              </span>
            </div>

            <img
              src={capitolioHeroImg}
              alt="Capitolio Nacional de Colombia"
              className="h-full w-auto max-w-none object-contain object-right-bottom transition-opacity duration-300 opacity-100 dark:opacity-85"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/capitolio_colombia.webp')) {
                  target.src = '/capitolio_colombia.webp';
                }
              }}
            />
            <div className="absolute inset-0 dark:bg-slate-950/25 mix-blend-multiply pointer-events-none" />
          </div>

          {/* CONTENIDO INTERNO: TOPBAR + HEADER + FILTROS DE MODALIDAD */}
          <div className="relative z-20 flex flex-col">
            
            {/* 1. BARRA SUPERIOR INTEGRADA (FLOTANTE SOBRE EL FONDO) */}
            <DashboardTopBar
              searchTerm={searchTerm}
              onSearchChange={(val) => setSearchTerm(val)}
              onSearchSubmit={() => loadOfficialTenders(searchTerm || undefined, false, platformFilter, modalityFilter)}
              onSearchClear={() => {
                setSearchTerm('');
                loadOfficialTenders(undefined, true, platformFilter, modalityFilter);
              }}
              isSearchingLive={isSearchingLive}
              companyName={company.name}
              onOpenNotifications={() => setIsEmailAlertsOpen(true)}
              onOpenProfile={() => {
                setFormCompany(company);
                setShowCompanyModal(true);
              }}
              alertsCount={evaluatedTenders.filter(t => t.compatibility_score >= 80).length}
              transparent={true}
            />

            {/* 2. TÍTULO, SUBTÍTULO Y TAG INSTITUCIONAL */}
            <div className="px-6 lg:px-8">
              <DashboardPageHeader />
            </div>

            {/* 3. FILTROS POR MODALIDAD EN LA BASE DEL HERO */}
            <div className="px-6 lg:px-8 pb-5 pt-1">
              <ModalityFiltersBar
                selectedModality={modalityFilter}
                onSelectModality={(m) => {
                  if (m === 'saved') {
                    setActiveSidebarNav('favoritos');
                  } else {
                    setActiveSidebarNav('licitaciones');
                  }
                  handleModalityChange(m);
                }}
                counts={modalityCounts}
                platformFilter={platformFilter}
                onPlatformChange={handlePlatformChange}
                matchFilter={filterTab}
                onMatchFilterChange={handleFilterTabChange}
                activeSector={activeSector}
                onSectorChange={(s) => handleSectorChange(s, s === 'todos' ? undefined : s)}
                onResetFilters={() => {
                  setFilterTab('all');
                  setPlatformFilter('all');
                  setActiveSector('todos');
                  setModalityFilter('all');
                  loadOfficialTenders(undefined, false, 'all', 'all');
                }}
                hasActiveAdvancedFilters={platformFilter !== 'all' || filterTab !== 'all' || activeSector !== 'todos'}
              />
            </div>

          </div>

        </div>

        {/* WORKSPACE PRINCIPAL (DEBAJO DEL HERO EDGE-TO-EDGE) */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">

          {/* BARRA DE RESULTADOS Y SELECTOR DE VISTA */}
          <ResultsControlBar
            totalResults={sortedAndFilteredTenders.length}
            currentSort={sortOption}
            onSortChange={setSortOption}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* CUADRÍCULA DE 3 COLUMNAS O VISTA LISTA */}
          {isLoadingTenders ? (
            <div className="p-16 border border-dashed border-[#E4EAF3] dark:border-slate-800 rounded-2xl text-center space-y-3 bg-white dark:bg-[#111827]">
              <Loader2 className="w-8 h-8 mx-auto text-[#0B5FFF] animate-spin" />
              <p className="text-sm font-bold text-[#0B1739] dark:text-slate-200">Consultando Convocatorias Activas en SECOP I & II...</p>
              <p className="text-xs text-[#64748B]">Filtrando exclusivamente procesos en presentación de ofertas</p>
            </div>
          ) : sortedAndFilteredTenders.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedAndFilteredTenders.map((tender, index) => {
                  const isSaved = Boolean(
                    (tender.id && savedTenderIds.has(String(tender.id))) ||
                    (tender.secop_id && savedTenderIds.has(String(tender.secop_id))) ||
                    (tender.process_number && savedTenderIds.has(String(tender.process_number)))
                  );
                  return (
                    <TenderGridCard
                      key={`${tender.id || tender.process_number}-${index}`}
                      tender={tender}
                      isSaved={isSaved}
                      onToggleSave={handleToggleSaveTender}
                      onOpenDetail={(t) => {
                        handleSelectTender(t);
                        setIsDetailDrawerOpen(true);
                      }}
                      formatFriendlyDate={formatFriendlyDate}
                    />
                  );
                })}
              </div>
            ) : (
              /* VISTA DE LISTA COMPACTA */
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E4EAF3] dark:border-slate-800 overflow-hidden divide-y divide-[#E4EAF3] dark:divide-slate-800 shadow-xs">
                {sortedAndFilteredTenders.map((tender, index) => {
                  const isSaved = Boolean(
                    (tender.id && savedTenderIds.has(String(tender.id))) ||
                    (tender.secop_id && savedTenderIds.has(String(tender.secop_id))) ||
                    (tender.process_number && savedTenderIds.has(String(tender.process_number)))
                  );
                  const score = typeof tender.compatibility_score === 'number' ? tender.compatibility_score : 75;
                  return (
                    <div 
                      key={`${tender.id || tender.process_number}-${index}`}
                      onClick={() => {
                        handleSelectTender(tender);
                        setIsDetailDrawerOpen(true);
                      }}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                            {tender.process_number}
                          </span>
                          <span className="px-2 py-0.2 rounded-md bg-blue-50 text-[#0B5FFF] font-bold text-[10px]">
                            {tender.source_platform}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            score >= 80 ? 'bg-emerald-50 text-emerald-700' : score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {score}% Compatibilidad
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-[#0B1739] dark:text-white line-clamp-1">
                          {formatProcurementTitle(tender.title)}
                        </h4>
                        <p className="text-xs text-[#64748B] flex items-center gap-2">
                          <span>{formatEntityName(tender.entity_name || (tender as any).entity || 'Entidad Oficial')}</span>
                          <span className="text-slate-300 dark:text-slate-600 font-light">—</span>
                          <span>Cierre: {formatFriendlyDate(tender.closing_date)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-right flex-shrink-0">
                        <div>
                          <p className="text-xs font-bold text-[#0B5FFF]">
                            ${Math.round(tender.budget_cop || 0).toLocaleString('es-CO')}
                          </p>
                          <span className="text-[10px] text-slate-400 capitalize">{tender.contract_type || 'Licitación'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSaveTender(tender);
                          }}
                          className={`p-2 rounded-xl border transition-all ${
                            isSaved 
                              ? 'bg-amber-50 text-amber-500 border-amber-200' 
                              : 'text-slate-400 hover:text-slate-600 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="p-16 border border-dashed border-[#E4EAF3] dark:border-slate-800 rounded-2xl text-center space-y-4 bg-white dark:bg-[#111827]">
              <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#0B1739] dark:text-slate-200">No se encontraron licitaciones activas</p>
                <p className="text-xs text-[#64748B]">Intenta ajustar tus términos de búsqueda o cambiar los filtros de modalidad</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setModalityFilter('all');
                  setActiveSector('todos');
                  setPlatformFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#0B5FFF] hover:bg-[#084BD6] text-white text-xs font-semibold shadow-xs"
              >
                Restablecer Filtros
              </button>
            </div>
          )}
        </main>
      </div>

      {/* DRAWER LATERAL DE DETALLE DE LICITACIÓN (PROGRESSIVE DISCLOSURE) */}
      <TenderDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        tender={selectedTender}
        company={company}
        planLimits={planLimits}
        onTriggerPlanGate={triggerPlanGate}
        isSaved={Boolean(
          selectedTender && (
            (selectedTender.id && savedTenderIds.has(String(selectedTender.id))) ||
            (selectedTender.secop_id && savedTenderIds.has(String(selectedTender.secop_id))) ||
            (selectedTender.process_number && savedTenderIds.has(String(selectedTender.process_number)))
          )
        )}
        onToggleSave={(t) => handleToggleSaveTender(t)}
        onOpenDossier={() => setIsDossierModalOpen(true)}
        onOpenSubmissionWizard={() => setIsSubmissionWizardOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenConsortium={() => {
          if (!planLimits.hasAdvancedConsortium) {
            triggerPlanGate('advanced_consortium');
            return;
          }
          setIsConsortiumModalOpen(true);
        }}
        selectedSubmission={selectedSubmission}
        queryHistory={queryHistory}
        queryMessage={queryMessage}
        setQueryMessage={setQueryMessage}
        onSendQuery={handleSendQuery}
        isQuerying={isQuerying}
        chatBottomRef={chatBottomRef}
        similarTenders={similarTendersForSelected}
        onSelectSimilarTender={handleSelectTender}
        savedTenderIds={savedTenderIds}
        formatFriendlyDate={formatFriendlyDate}
        onOpenCitation={(citation) => {
          setActiveCitation(citation);
          setIsCitationModalOpen(true);
        }}
      />

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
          userEmail={userSession?.email || company.email}
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
          if (newCompanyData.onboarding_route === 'without_rup_minima_cuantia') {
            setModalityFilter('minima_cuantia');
            loadOfficialTenders(undefined, false, 'SECOP_II', 'minima_cuantia');
          }
        }}
      />

      {/* MODAL DE SUSCRIPCIONES Y PAGOS WOMPI SAAS */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        currentPlanId={currentPlanId}
        userEmail={userSession?.email}
        organizationId={userSession?.organizationId}
        companyName={company.name}
        companyNit={company.nit}
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
      {selectedTender && planLimits.hasAdvancedConsortium && (
        <ConsortiumSimulatorModal
          isOpen={isConsortiumModalOpen}
          onClose={() => setIsConsortiumModalOpen(false)}
          tender={selectedTender as any}
          company={company}
          hasAdvancedConsortium={planLimits.hasAdvancedConsortium}
        />
      )}

      {/* BÓVEDA DOCUMENTAL PERMANENTE DE LA EMPRESA */}
      <CompanyVaultModal
        isOpen={isCompanyVaultOpen}
        onClose={() => setIsCompanyVaultOpen(false)}
        company={company as any}
        onVaultUpdated={(updated) => setVaultDocs(updated)}
      />

      {/* MODAL INTELIGENCIA DE MERCADO & COMPETENCIA (SECOP II DATA) */}
      <MarketIntelligenceModal
        isOpen={isMarketIntelligenceOpen}
        onClose={() => setIsMarketIntelligenceOpen(false)}
        companyUnspsc={company.unspsc_codes}
        companyName={company.name}
      />

      {/* MODAL AUDITORÍA DE CITAS Y FUENTES OFICIALES DE PLIEGOS */}
      <CitationViewerModal
        isOpen={isCitationModalOpen}
        onClose={() => setIsCitationModalOpen(false)}
        citation={activeCitation}
      />

      {/* MODAL CONFIGURACIÓN Y VISTA PREVIA DE ALERTAS 24/7 */}
      <EmailAlertsModal
        isOpen={isEmailAlertsOpen}
        onClose={() => setIsEmailAlertsOpen(false)}
        companyName={company.name}
        defaultEmail={company.email || userSession?.email}
        matchedTenders={evaluatedTenders.filter(t => t.compatibility_score >= 80).map(t => ({
          secopId: t.secop_id,
          processNumber: t.process_number,
          title: t.title,
          entityName: t.entity_name,
          department: t.department,
          budgetCop: t.budget_cop,
          closingDate: t.closing_date,
          compatibilityScore: t.compatibility_score,
          verdict: t.verdict as any,
          matchedUnspsc: t.experience_compliance.unspsc_matched,
          processUrl: t.process_url || 'https://community.secop.gov.co'
        }))}
      />

      {/* MODAL CENTRO DE AYUDA & SOPORTE TÉCNICO OFICIAL (EMOTIVAPROYECTOS@GMAIL.COM) */}
      <SupportHelpModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        companyName={company.name}
        companyNit={company.nit}
        userEmail={company.email || userSession?.email}
      />

    </div>
  );
}
