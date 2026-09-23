/**
 * Componente de Tarjetas de Licitaciones Similares y Recomendadas
 * Renderiza tarjetas atractivas con porcentaje de afinidad, motivo explicativo,
 * presupuesto y botones de acción rápida ("Ver proceso" y "Guardar").
 */

import React from 'react';
import { 
  Sparkles, 
  Bookmark, 
  Building, 
  Calendar, 
  Clock, 
  Zap, 
  ArrowRight, 
  TrendingUp,
  Tag
} from 'lucide-react';
import type { RecommendedTender } from '../services/recommendationService';
import type { TenderDTO } from '../services/api';
import { formatFriendlyDate } from '../services/api';
import { formatProcurementTitle, formatEntityName } from '../lib/procurementTextFormatter';

interface SimilarTendersDeckProps {
  recommendations: RecommendedTender[];
  title?: string;
  subtitle?: string;
  variant?: 'carousel' | 'grid';
  onSelectTender: (tender: TenderDTO) => void;
  onToggleSave: (tender: TenderDTO) => void;
  savedTenderIds: Set<string>;
  emptyMessage?: string;
}

export const SimilarTendersDeck: React.FC<SimilarTendersDeckProps> = ({
  recommendations,
  title = 'Licitaciones Recomendadas para Ti',
  subtitle = 'Identificadas según tus licitaciones guardadas y búsquedas recientes',
  variant = 'carousel',
  onSelectTender,
  onToggleSave,
  savedTenderIds,
  emptyMessage = 'Guarda licitaciones o realiza búsquedas para recibir recomendaciones personalizadas.'
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      {/* CABECERA DE SECCIÓN */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{title}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                {recommendations.length}
              </span>
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CONTENIDO: CARRUSEL O GRID */}
      <div 
        className={
          variant === 'carousel'
            ? 'flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 snap-x'
            : 'grid grid-cols-1 sm:grid-cols-2 gap-3'
        }
      >
        {recommendations.map((rec) => {
          const { tender, matchScore, matchReasons, sourceTag } = rec;
          const tenderId = tender.id || tender.secop_id || tender.process_number;
          const isSaved = Boolean(
            (tender.id && savedTenderIds.has(String(tender.id))) ||
            (tender.secop_id && savedTenderIds.has(String(tender.secop_id))) ||
            (tender.process_number && savedTenderIds.has(String(tender.process_number)))
          );

          let matchColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
          if (matchScore < 75 && matchScore >= 55) {
            matchColor = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
          } else if (matchScore < 55) {
            matchColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
          }

          const budgetFormatted = tender.budget_cop
            ? (tender.budget_cop >= 1000000 
                ? `$${(tender.budget_cop / 1000000).toFixed(1)}M` 
                : `$${(tender.budget_cop / 1000).toFixed(0)}K`)
            : 'No especificado';

          return (
            <div
              key={tenderId}
              onClick={() => onSelectTender(tender)}
              className={`group relative flex-shrink-0 cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 ${
                variant === 'carousel' ? 'w-[290px] snap-start' : 'w-full'
              } bg-white/95 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/70 shadow-xs hover:shadow-md flex flex-col justify-between`}
            >
              <div className="space-y-2">
                {/* FILA SUPERIOR: SCORE & GUARDAR */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${matchColor}`}>
                      <TrendingUp className="w-2.5 h-2.5" />
                      <span>{matchScore}% Similitud</span>
                    </span>
                    {tender.is_minima_cuantia && (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700 flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 text-emerald-600" />
                        Min. Cuantía
                      </span>
                    )}
                  </div>

                  {/* BOTÓN DE GUARDAR / FAVORITO */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(tender);
                    }}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isSaved
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-500 fill-amber-500 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-300'
                    }`}
                    title={isSaved ? 'Quitar de guardadas' : 'Guardar en mis licitaciones'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-amber-500' : ''}`} />
                  </button>
                </div>

                {/* ETIQUETA DE MOTIVO DESTACADO */}
                {sourceTag && (
                  <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                    <Tag className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{sourceTag}</span>
                  </div>
                )}

                {/* TÍTULO DEL OBJETO CONTRACTUAL */}
                <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {formatProcurementTitle(tender.title)}
                </h4>

                {/* ENTIDAD COMPRADORA */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                  <Building className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{formatEntityName(tender.entity_name)}</span>
                </p>

                {/* MOTIVOS CLAVE */}
                {matchReasons && matchReasons.length > 0 && (
                  <div className="space-y-0.5 pt-1">
                    {matchReasons.slice(0, 2).map((reason, idx) => (
                      <p key={idx} className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span className="truncate">{reason}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* PIE DE TARJETA: PRESUPUESTO & ACCIÓN */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[9.5px] text-slate-400 block font-semibold">Presupuesto</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-[11px]">
                    {budgetFormatted} COP
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-bold text-[11px] transition-colors">
                  <span>Ver detalle</span>
                  <ArrowRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
