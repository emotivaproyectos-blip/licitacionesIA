import React from 'react';
import { LayoutGrid, List, ChevronDown } from 'lucide-react';

export type SortOption = 'recent' | 'match' | 'budget_desc' | 'budget_asc' | 'closing_asc';
export type ViewMode = 'grid' | 'list';

export interface ResultsControlBarProps {
  totalResults: number;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ResultsControlBar({
  totalResults,
  currentSort,
  onSortChange,
  viewMode,
  onViewModeChange
}: ResultsControlBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-[#E4EAF3] dark:border-slate-800">
      
      {/* 1. CONTADOR DE OPORTUNIDADES ENCONTRADAS */}
      <div className="flex items-center gap-2">
        <span className="text-base sm:text-lg font-bold text-[#0B1739] dark:text-white">
          {totalResults}
        </span>
        <span className="text-sm font-medium text-[#64748B] dark:text-slate-400">
          oportunidades encontradas
        </span>
      </div>

      {/* 2. ORDENAMIENTO Y SELECTOR DE VISTA */}
      <div className="flex items-center gap-3">
        
        {/* DROPDOWN ORDENAR POR */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B] dark:text-slate-400 hidden sm:inline">
            Ordenar por
          </span>
          <div className="relative">
            <select
              value={currentSort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="appearance-none bg-white dark:bg-[#111827] border border-[#E4EAF3] dark:border-slate-800 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-[#0B1739] dark:text-slate-200 focus:outline-none focus:border-[#0B5FFF] shadow-xs cursor-pointer"
            >
              <option value="recent">Más recientes</option>
              <option value="match">Mayor coincidencia</option>
              <option value="closing_asc">Próximas a cerrar</option>
              <option value="budget_desc">Mayor presupuesto</option>
              <option value="budget_asc">Menor presupuesto</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* SELECTOR ENTRE VISTA CUADRÍCULA Y LISTA */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-[#E4EAF3] dark:border-slate-800">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-[#0B5FFF] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Vista de cuadrícula (Tarjetas)"
            aria-label="Vista de cuadrícula"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-[#0B5FFF] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Vista de lista"
            aria-label="Vista de lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
