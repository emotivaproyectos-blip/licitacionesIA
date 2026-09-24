import React from 'react';
import { Search, Bell, X, Loader2 } from 'lucide-react';

export interface DashboardTopBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  isSearchingLive?: boolean;
  companyName: string;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  alertsCount?: number;
  transparent?: boolean;
}

export function DashboardTopBar({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  isSearchingLive = false,
  companyName,
  onOpenNotifications,
  onOpenProfile,
  alertsCount = 0,
  transparent = false
}: DashboardTopBarProps) {

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'EL';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <header className={`px-6 lg:px-8 py-3.5 flex items-center justify-between z-30 transition-colors ${
      transparent 
        ? 'bg-transparent border-b-0' 
        : 'h-18 bg-white dark:bg-[#111827] border-b border-[#E4EAF3] dark:border-slate-800 sticky top-0'
    }`}>
      
      {/* 1. BUSCADOR SUPERIOR AMPLIO */}
      <div className="flex-1 max-w-3xl mr-6">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {isSearchingLive ? (
              <Loader2 className="w-4 h-4 text-[#0B5FFF] animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-[#64748B]" />
            )}
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por entidad, objeto, código SECOP, palabra clave…"
            className="w-full bg-white dark:bg-slate-900 border border-[#E4EAF3] dark:border-slate-800 rounded-2xl pl-10 pr-24 py-2.5 text-xs text-[#0B1739] dark:text-slate-100 placeholder-[#64748B] focus:outline-none focus:border-[#0B5FFF] focus:ring-2 focus:ring-[#0B5FFF]/15 transition-all shadow-xs"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={onSearchClear}
              className="absolute right-22 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* BOTÓN AZUL BUSCAR */}
          <button
            type="button"
            onClick={onSearchSubmit}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-[#0B5FFF] hover:bg-[#084BD6] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Buscar</span>
          </button>
        </div>
      </div>

      {/* 2. CONTROLES DERECHOS: ALERTAS Y PERFIL */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        {/* BOTÓN DE NOTIFICACIONES / ALERTAS */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2.5 text-slate-500 hover:text-[#0B1739] dark:text-slate-400 dark:hover:text-white rounded-xl bg-white dark:bg-slate-900 border border-[#E4EAF3] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          title="Ver alertas de contratación"
        >
          <Bell className="w-4.5 h-4.5 text-[#64748B]" />
          {alertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0B5FFF] ring-2 ring-white dark:ring-slate-900"></span>
          )}
        </button>

        {/* AVATAR DE USUARIO */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="w-9 h-9 rounded-full bg-[#0B5FFF] hover:bg-[#084BD6] text-white flex items-center justify-center text-xs font-bold shadow-xs transition-transform hover:scale-105"
          title={`Cuenta: ${companyName || 'Empresa SAS'}`}
        >
          {getInitials(companyName)}
        </button>

      </div>
    </header>
  );
}
