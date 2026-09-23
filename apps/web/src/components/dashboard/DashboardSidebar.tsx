import React from 'react';
import { 
  Home, 
  LayoutGrid, 
  Inbox, 
  Bookmark, 
  BarChart3, 
  Folder, 
  Bell, 
  Sparkles, 
  FileSpreadsheet, 
  Settings, 
  Headphones, 
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import emotivaLogo from '../../assets/logo.webp';

export interface DashboardSidebarProps {
  activeNav: string;
  onNavigate: (key: string) => void;
  applicationsCount: number;
  savedCount: number;
  vaultCount: number;
  companyName: string;
  planName: string;
  onOpenCompanyModal: () => void;
  onOpenSubModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenVaultModal: () => void;
  onOpenMarketIntelligence: () => void;
  onOpenEmailAlerts: () => void;
  onOpenConsortiumSimulator: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function DashboardSidebar({
  activeNav,
  onNavigate,
  applicationsCount,
  savedCount,
  vaultCount,
  companyName,
  planName,
  onOpenCompanyModal,
  onOpenSubModal,
  onOpenHistoryModal,
  onOpenVaultModal,
  onOpenMarketIntelligence,
  onOpenEmailAlerts,
  onOpenConsortiumSimulator,
  isDarkMode,
  onToggleTheme
}: DashboardSidebarProps) {

  const navItems = [
    {
      key: 'inicio',
      label: 'Inicio',
      icon: Home,
      action: () => onNavigate('landing')
    },
    {
      key: 'licitaciones',
      label: 'Licitaciones',
      icon: LayoutGrid,
      action: () => onNavigate('licitaciones'),
      active: activeNav === 'licitaciones'
    },
    {
      key: 'postulaciones',
      label: 'Mis Postulaciones',
      icon: Inbox,
      badge: applicationsCount > 0 ? applicationsCount : undefined,
      action: onOpenHistoryModal,
      active: activeNav === 'postulaciones'
    },
    {
      key: 'favoritos',
      label: 'Mis Favoritos',
      icon: Bookmark,
      badge: savedCount > 0 ? savedCount : undefined,
      action: () => onNavigate('favoritos'),
      active: activeNav === 'favoritos'
    },
    {
      key: 'mercado',
      label: 'Monitor de Mercado',
      icon: BarChart3,
      action: onOpenMarketIntelligence,
      active: activeNav === 'mercado'
    },
    {
      key: 'documentos',
      label: 'Documentos',
      icon: Folder,
      badge: vaultCount > 0 ? vaultCount : undefined,
      action: onOpenVaultModal,
      active: activeNav === 'documentos'
    },
    {
      key: 'alertas',
      label: 'Alertas',
      icon: Bell,
      action: onOpenEmailAlerts,
      active: activeNav === 'alertas'
    },
    {
      key: 'inteligencia',
      label: 'Inteligencia IA',
      icon: Sparkles,
      action: onOpenConsortiumSimulator,
      active: activeNav === 'inteligencia'
    },
    {
      key: 'reportes',
      label: 'Reportes',
      icon: FileSpreadsheet,
      action: onOpenHistoryModal,
      active: activeNav === 'reportes'
    },
    {
      key: 'configuracion',
      label: 'Configuración',
      icon: Settings,
      action: onOpenCompanyModal,
      active: activeNav === 'configuracion'
    }
  ];

  const getInitials = (name: string) => {
    if (!name) return 'EL';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <aside className="w-[230px] flex-shrink-0 bg-white dark:bg-[#111827] border-r border-[#E4EAF3] dark:border-slate-800 flex flex-col justify-between py-5 px-3.5 sticky top-0 h-screen z-40 select-none transition-colors">
      
      {/* 1. SECCIÓN SUPERIOR: LOGO Y NAVEGACIÓN */}
      <div className="flex flex-col gap-6">
        
        {/* LOGO CORPORATIVO EMOTIVA LICITIA */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 px-2 cursor-pointer group"
          title="Emotiva LicitIA - Inicio"
        >
          {/* Emblema corporativo oficial Emotiva */}
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <img 
              src={emotivaLogo} 
              alt="Emotiva LicitIA" 
              className="w-full h-full object-contain drop-shadow-sm" 
            />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-medium text-[#64748B] dark:text-slate-400 tracking-tight">
              Emotiva
            </span>
            <span className="text-lg font-extrabold text-[#0B1739] dark:text-white tracking-tight">
              Licit<span className="text-[#0B5FFF]">IA</span>
            </span>
          </div>
        </div>

        {/* LISTADO DE NAVEGACIÓN */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <button
                key={item.key}
                type="button"
                onClick={item.action}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#EDF4FF] text-[#0B5FFF] font-semibold dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-[#64748B] hover:text-[#0B1739] hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0B5FFF] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#0B5FFF] text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. SECCIÓN INFERIOR: SOPORTE, TEMA Y PERFIL DE EMPRESA */}
      <div className="flex flex-col gap-3 pt-3 border-t border-[#E4EAF3] dark:border-slate-800">
        
        {/* BLOQUE CENTRO DE SOPORTE */}
        <a
          href="mailto:soporte@licitia.co?subject=Consulta%20Soporte%20Emotiva%20LicitIA"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F5F8FC] hover:bg-[#EDF4FF] dark:bg-slate-800/50 dark:hover:bg-slate-800 text-[#0B1739] dark:text-slate-200 border border-[#E4EAF3] dark:border-slate-700/60 transition-colors group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#0B5FFF] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-semibold text-[#0B1739] dark:text-white leading-tight">
              ¿Necesitas ayuda?
            </span>
            <span className="text-[10px] text-[#64748B] dark:text-slate-400">
              Centro de soporte
            </span>
          </div>
        </a>

        {/* TARJETA DE USUARIO / EMPRESA CON PLAN */}
        <div 
          onClick={onOpenSubModal}
          className="flex items-center justify-between p-2 rounded-xl border border-[#E4EAF3] dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 bg-white dark:bg-[#111827] cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 group"
          title="Ver suscripción y plan activo"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0B5FFF] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs">
              {getInitials(companyName)}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs font-bold text-[#0B1739] dark:text-white truncate group-hover:text-[#0B5FFF] transition-colors">
                {companyName || 'Empresa SAS'}
              </span>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">
                {planName || 'Plan Pro'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B5FFF] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>

        {/* SELECTOR CLARO / OSCURO DISCRETO */}
        <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-[#64748B] dark:text-slate-400">
          <span>Modo {isDarkMode ? 'Oscuro' : 'Claro'}</span>
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>
    </aside>
  );
}
