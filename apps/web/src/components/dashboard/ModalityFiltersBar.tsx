import React, { useState, useRef, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Layers, 
  Zap, 
  Building, 
  X, 
  Database,
  Filter,
  ChevronDown
} from 'lucide-react';

export type ModalityOption = 'all' | 'minima_cuantia' | 'menor_cuantia' | 'licitacion_publica' | 'saved';

export interface ModalityFiltersBarProps {
  selectedModality: ModalityOption;
  onSelectModality: (modality: ModalityOption) => void;
  counts: {
    all: number;
    minimaCuantia: number;
    menorCuantia: number;
    licitacionPublica: number;
  };
  // Filtros secundarios para "Más filtros"
  platformFilter: 'all' | 'SECOP_I' | 'SECOP_II';
  onPlatformChange: (p: 'all' | 'SECOP_I' | 'SECOP_II') => void;
  matchFilter: 'all' | 'high_match' | 'partial_match' | 'low_match';
  onMatchFilterChange: (m: 'all' | 'high_match' | 'partial_match' | 'low_match') => void;
  activeSector: string;
  onSectorChange: (s: string) => void;
  onResetFilters: () => void;
  hasActiveAdvancedFilters: boolean;
}

export function ModalityFiltersBar({
  selectedModality,
  onSelectModality,
  counts,
  platformFilter,
  onPlatformChange,
  matchFilter,
  onMatchFilterChange,
  activeSector,
  onSectorChange,
  onResetFilters,
  hasActiveAdvancedFilters
}: ModalityFiltersBarProps) {
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cerrar despliegue al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMoreFiltersOpen(false);
      }
    }
    if (isMoreFiltersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreFiltersOpen]);

  return (
    <div className="relative flex flex-col gap-2.5 pt-2">
      {/* 1. FILA DE BOTONES DE MODALIDAD Y MÁS FILTROS */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar flex-wrap sm:flex-nowrap">
        
        {/* 1. TODAS */}
        <button
          type="button"
          onClick={() => onSelectModality('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer ${
            selectedModality === 'all'
              ? 'bg-[#0B5FFF] text-white shadow-[#0B5FFF]/20'
              : 'bg-white dark:bg-[#111827] text-[#0B1739] dark:text-slate-200 border border-[#E4EAF3] dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Todas</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedModality === 'all'
              ? 'bg-white/20 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            {counts.all}
          </span>
        </button>

        {/* 2. MÍNIMA CUANTÍA */}
        <button
          type="button"
          onClick={() => onSelectModality('minima_cuantia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer border ${
            selectedModality === 'minima_cuantia'
              ? 'bg-[#EAFBF3] text-[#0E7A4A] border-[#0E7A4A] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-600 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-[#111827] text-[#0E7A4A] dark:text-emerald-400 border-[#E4EAF3] dark:border-slate-800 hover:bg-[#EAFBF3]/40'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>Mínima Cuantía</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
            {counts.minimaCuantia}
          </span>
        </button>

        {/* 3. MENOR CUANTÍA */}
        <button
          type="button"
          onClick={() => onSelectModality('menor_cuantia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer border ${
            selectedModality === 'menor_cuantia'
              ? 'bg-[#F5EEFE] text-[#6B21A8] border-[#6B21A8] dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-600 ring-2 ring-purple-500/20'
              : 'bg-white dark:bg-[#111827] text-[#6B21A8] dark:text-purple-400 border-[#E4EAF3] dark:border-slate-800 hover:bg-[#F5EEFE]/40'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <span>Menor Cuantía</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
            {counts.menorCuantia}
          </span>
        </button>

        {/* 4. LICITACIÓN PÚBLICA */}
        <button
          type="button"
          onClick={() => onSelectModality('licitacion_publica')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer border ${
            selectedModality === 'licitacion_publica'
              ? 'bg-[#FFF8E7] text-[#B45309] border-[#B45309] dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-600 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-[#111827] text-[#B45309] dark:text-amber-400 border-[#E4EAF3] dark:border-slate-800 hover:bg-[#FFF8E7]/40'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span>Licitación Pública</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
            {counts.licitacionPublica}
          </span>
        </button>

        {/* 5. BOTÓN "MÁS FILTROS" */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer border ${
            isMoreFiltersOpen || hasActiveAdvancedFilters
              ? 'bg-[#EDF4FF] text-[#0B5FFF] border-[#0B5FFF] dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-[#111827] text-[#64748B] dark:text-slate-300 border-[#E4EAF3] dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Más filtros</span>
          {hasActiveAdvancedFilters && (
            <span className="w-2 h-2 rounded-full bg-[#0B5FFF]"></span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreFiltersOpen ? 'rotate-180 text-[#0B5FFF]' : 'text-slate-400'}`} />
        </button>
      </div>

      {/* 2. DESPLIEGUE COMPLETO DE OPCIONES DEL FILTRO */}
      {isMoreFiltersOpen && (
        <div 
          ref={panelRef}
          className="w-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md rounded-2xl border border-[#E4EAF3] dark:border-slate-800 shadow-xl p-4 sm:p-5 transition-all duration-200 animate-in fade-in slide-in-from-top-2"
        >
          {/* ENCABEZADO DEL DESPLIEGUE */}
          <div className="flex items-center justify-between border-b border-[#E4EAF3] dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EDF4FF] dark:bg-blue-950/60 text-[#0B5FFF] flex items-center justify-center">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-[#0B1739] dark:text-white">
                  Filtros Avanzados
                </span>
                <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                  Ajusta la plataforma oficial, nivel de coincidencia RUP y sector económico
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveAdvancedFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMoreFiltersOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar despliegue"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* GRID DE OPCIONES DESPLEGADAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            
            {/* PLATAFORMA SECOP */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#0B5FFF]" />
                Plataforma Oficial
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onPlatformChange('all')}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition-colors cursor-pointer border ${
                    platformFilter === 'all'
                      ? 'bg-[#0B5FFF] text-white font-bold border-[#0B5FFF] shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => onPlatformChange('SECOP_II')}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition-colors cursor-pointer border ${
                    platformFilter === 'SECOP_II'
                      ? 'bg-[#0B5FFF] text-white font-bold border-[#0B5FFF] shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  SECOP II
                </button>
                <button
                  type="button"
                  onClick={() => onPlatformChange('SECOP_I')}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition-colors cursor-pointer border ${
                    platformFilter === 'SECOP_I'
                      ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  SECOP I
                </button>
              </div>
            </div>

            {/* RANGO DE COINCIDENCIA / MATCH RUP */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Coincidencia RUP (Match)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onMatchFilterChange('all')}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition-colors cursor-pointer border ${
                    matchFilter === 'all'
                      ? 'bg-[#0B5FFF] text-white font-bold border-[#0B5FFF] shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => onMatchFilterChange('high_match')}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition-colors cursor-pointer border ${
                    matchFilter === 'high_match'
                      ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
                      : 'bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  ≥80% (Alto)
                </button>
                <button
                  type="button"
                  onClick={() => onMatchFilterChange('partial_match')}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition-colors cursor-pointer border ${
                    matchFilter === 'partial_match'
                      ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs'
                      : 'bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                  }`}
                >
                  50-79% (Parcial)
                </button>
                <button
                  type="button"
                  onClick={() => onMatchFilterChange('low_match')}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition-colors cursor-pointer border ${
                    matchFilter === 'low_match'
                      ? 'bg-rose-600 text-white font-bold border-rose-600 shadow-xs'
                      : 'bg-rose-50/60 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                  }`}
                >
                  &lt;50% (Bajo)
                </button>
              </div>
            </div>

            {/* SECTOR ECONÓMICO */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-500" />
                Sector Económico
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'todos', label: 'Todos los sectores' },
                  { id: 'tecnologia', label: 'Software & TI' },
                  { id: 'consultoria', label: 'Consultoría' },
                  { id: 'infraestructura', label: 'Obras Civiles' },
                  { id: 'suministros', label: 'Suministros' }
                ].map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => onSectorChange(sec.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer border ${
                      activeSector === sec.id
                        ? 'bg-[#0B5FFF] text-white font-bold border-[#0B5FFF] shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* PIE DE FILTROS AVANZADOS */}
          <div className="mt-4 pt-3 border-t border-[#E4EAF3] dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="text-[#64748B] dark:text-slate-400 text-[11px]">
              {hasActiveAdvancedFilters ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  • Filtros activos aplicados a los resultados
                </span>
              ) : (
                <span>Explorando todas las licitaciones públicas de SECOP</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsMoreFiltersOpen(false)}
              className="px-4 py-1.5 bg-[#0B5FFF] hover:bg-[#084BD6] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Listo
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
