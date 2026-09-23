import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Bookmark, 
  ArrowRight, 
  DollarSign, 
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Check
} from 'lucide-react';
import { 
  getTenderCategoryVisual, 
  getModalitySemanticBadge, 
  formatCOP 
} from './tenderCategories';
import { 
  formatProcurementTitle, 
  formatEntityName 
} from '../../lib/procurementTextFormatter';

export interface TenderGridCardProps {
  tender: any;
  isSaved: boolean;
  onToggleSave: (tender: any) => void;
  onOpenDetail: (tender: any) => void;
  formatFriendlyDate: (dateStr: string) => string;
}

export function TenderGridCard({
  tender,
  isSaved,
  onToggleSave,
  onOpenDetail,
  formatFriendlyDate
}: TenderGridCardProps) {
  const [imageError, setImageError] = useState(false);

  // Obtener imagen y tags contextuales
  const categoryVisual = getTenderCategoryVisual(tender);
  
  // Badge semántico de modalidad
  const modalityBadge = getModalitySemanticBadge(
    tender.modalidad_de_contratacion || tender.contract_type,
    tender.is_minima_cuantia
  );

  // Coincidencia RUP / Match
  const score = typeof tender.compatibility_score === 'number' ? tender.compatibility_score : 75;
  
  let matchBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700';
  if (score < 50) {
    matchBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700';
  } else if (score < 80) {
    matchBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700';
  }

  // Tags secundarios (máximo 3)
  const secondaryTags = [
    ...categoryVisual.tags.slice(0, 2),
    tender.source_platform === 'SECOP_I' ? 'SECOP I' : 'SECOP II'
  ].slice(0, 3);

  return (
    <div 
      className="tender-card flex flex-col justify-between overflow-hidden group cursor-pointer"
      onClick={() => onOpenDetail(tender)}
    >
      <div>
        {/* A. IMAGEN SUPERIOR CON BADGES FLOTANTES */}
        <div className="relative h-32 sm:h-36 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          {!imageError ? (
            <img 
              src={categoryVisual.imageUrl} 
              alt={tender.title || 'Licitación pública'}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryVisual.fallbackGradient} flex items-center justify-center`}>
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
          )}

          {/* Sutil overlay degradado para resaltar los badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

          {/* BADGE DE COINCIDENCIA FLOTANTE (ARRIBA DERECHA) */}
          <div className="absolute top-2.5 right-2.5">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs backdrop-blur-xs flex items-center gap-1 ${matchBadgeClass}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              <span>{score}% Match</span>
            </span>
          </div>

          {/* ETIQUETA DE MODALIDAD FLOTANTE (ABAJO IZQUIERDA) */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-xs ${modalityBadge.pillClass}`}>
              {modalityBadge.label}
            </span>
          </div>
        </div>

        {/* B, C, D: CONTENIDO ESENCIAL */}
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          
          {/* TÍTULO DEL PROCESO (2 A 3 LÍNEAS LEGIBLES) */}
          <h3 
            className="text-[13px] sm:text-sm font-bold text-[#0B1739] dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-[#0B5FFF] transition-colors"
            title={formatProcurementTitle(tender.title)}
          >
            {formatProcurementTitle(tender.title)}
          </h3>

          {/* ENTIDAD CONTRANTE */}
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span className="truncate font-medium" title={formatEntityName(tender.entity_name)}>
              {formatEntityName(tender.entity_name)}
            </span>
          </div>

          {/* INFORMACIÓN ESENCIAL: CIERRE Y PRESUPUESTO */}
          <div className="space-y-1.5 text-xs text-[#64748B] dark:text-slate-400">
            {/* FECHA DE CIERRE */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>
                Cierre: <strong className="text-[#0B1739] dark:text-slate-200">{formatFriendlyDate(tender.closing_date)}</strong>
              </span>
            </div>

            {/* PRESUPUESTO OFICIAL */}
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="font-bold text-[#0B1739] dark:text-slate-100 font-mono text-[13px]">
                {formatCOP(tender.budget_cop)}
              </span>
            </div>
          </div>

          {/* ETIQUETAS SECUNDARIAS (SECTOR, CATEGORÍA O FUENTE) */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {secondaryTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-[#F5F8FC] dark:bg-slate-800/80 border border-[#E4EAF3] dark:border-slate-700 text-[#64748B] dark:text-slate-300 text-[10.5px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

        </div>
      </div>

      {/* F. ACCIONES INFERIORES */}
      <div 
        className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-[#E4EAF3] dark:border-slate-800/80 bg-white dark:bg-[#111827] flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BOTÓN GUARDAR (MARCADOR) */}
        <button
          type="button"
          onClick={() => onToggleSave(tender)}
          className={`p-2 rounded-xl border transition-all ${
            isSaved
              ? 'bg-amber-50 text-amber-500 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700 shadow-xs'
              : 'border-[#E4EAF3] dark:border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-300 bg-white dark:bg-[#111827]'
          }`}
          title={isSaved ? "Quitar de convocatorias guardadas" : "Guardar convocatoria"}
          aria-label={isSaved ? "Quitar de guardadas" : "Guardar licitación"}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-amber-500' : ''}`} />
        </button>

        {/* BOTÓN VER DETALLE -> */}
        <button
          type="button"
          onClick={() => onOpenDetail(tender)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EDF4FF] hover:bg-[#DBEAFE] dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0B5FFF] dark:text-blue-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          <span>Ver detalle</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
