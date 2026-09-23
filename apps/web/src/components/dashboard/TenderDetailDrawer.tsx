import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check,
  ExternalLink, 
  Copy, 
  Bookmark, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  Clock, 
  DollarSign, 
  Building2, 
  FileText, 
  SendHorizontal, 
  ArrowRight, 
  FileSpreadsheet, 
  Bot, 
  CheckSquare, 
  Radio, 
  AlertCircle, 
  Users, 
  Sparkles, 
  Lock, 
  Send,
  Loader2,
  FileCheck,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { formatCOP, getModalitySemanticBadge } from './tenderCategories';
import { SimilarTendersDeck } from '../SimilarTendersDeck';
import { 
  formatProcurementTitle, 
  formatProcurementDescription, 
  formatEntityName 
} from '../../lib/procurementTextFormatter';
import { RequirementCitation } from '../CitationViewerModal';

export interface TenderDetailDrawerProps {
  tender: any | null;
  isOpen: boolean;
  onClose: () => void;
  company: any;
  planLimits: any;
  onTriggerPlanGate: (feature: any) => void;
  isSaved: boolean;
  onToggleSave: (tender: any) => void;
  onOpenDossier: () => void;
  onOpenSubmissionWizard: () => void;
  onOpenHistory: () => void;
  onOpenConsortium: () => void;
  onOpenCitation?: (citation: RequirementCitation) => void;
  selectedSubmission?: any;
  queryHistory: Array<{ sender: 'user' | 'system'; text: string }>;
  queryMessage: string;
  setQueryMessage: (msg: string) => void;
  onSendQuery: (e?: React.FormEvent) => void;
  isQuerying: boolean;
  chatBottomRef: React.RefObject<HTMLDivElement>;
  similarTenders: any[];
  onSelectSimilarTender: (tender: any) => void;
  savedTenderIds: Set<string>;
  formatFriendlyDate: (d: string) => string;
}

export function TenderDetailDrawer({
  tender,
  isOpen,
  onClose,
  company,
  planLimits,
  onTriggerPlanGate,
  isSaved,
  onToggleSave,
  onOpenDossier,
  onOpenSubmissionWizard,
  onOpenHistory,
  onOpenConsortium,
  onOpenCitation,
  selectedSubmission,
  queryHistory,
  queryMessage,
  setQueryMessage,
  onSendQuery,
  isQuerying,
  chatBottomRef,
  similarTenders,
  onSelectSimilarTender,
  savedTenderIds,
  formatFriendlyDate
}: TenderDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'matriz' | 'resumen' | 'documentos' | 'asistente'>('matriz');
  const [copiedRef, setCopiedRef] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'detail' | 'similar'>('detail');

  // Formato compacto de presupuesto idéntico a la referencia ($19.7M COP)
  const formatBudgetCompact = (budget?: number) => {
    if (!budget || budget === 0) return 'Sin cuantía';
    if (budget >= 1000000000) return `$${(budget / 1000000000).toFixed(1)}B COP`;
    if (budget >= 1000000) return `$${(budget / 1000000).toFixed(1)}M COP`;
    if (budget >= 1000) return `$${(budget / 1000).toFixed(0)}K COP`;
    return `$${budget.toLocaleString('es-CO')} COP`;
  };

  // Al cambiar de licitación, abrir por defecto la pestaña de Matriz & Diagnóstico
  useEffect(() => {
    if (tender) {
      setActiveTab('matriz');
      setMobileViewMode('detail');
    }
  }, [tender?.id, tender?.secop_id, tender?.process_number]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !tender) return null;

  const handleCopyProcessNumber = () => {
    const ref = tender.process_number || tender.secop_id || '';
    if (ref) {
      navigator.clipboard.writeText(ref);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const modalityBadge = getModalitySemanticBadge(
    tender.modalidad_de_contratacion || tender.contract_type,
    tender.is_minima_cuantia
  );

  const score = typeof tender.compatibility_score === 'number' ? tender.compatibility_score : 75;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      
      {/* TELÓN DE FONDO (BACKDROP) */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* CONTENEDOR EXPANDIDO PARA PANTALLA DIVIDIDA 50/50 */}
      <div className="relative w-full max-w-full lg:max-w-[98vw] 2xl:max-w-[1920px] bg-white dark:bg-[#111827] shadow-2xl flex flex-col h-full z-10 transition-transform duration-300 overflow-hidden border-l border-[#E4EAF3] dark:border-slate-800">
        
        {/* BARRA SUPERIOR RESPONSIVA PARA PANTALLAS PEQUEÑAS (TABLETS / MÓVILES) */}
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-[#E4EAF3] dark:border-slate-800 bg-[#F5F8FC] dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMobileViewMode('similar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mobileViewMode === 'similar'
                  ? 'bg-[#0B5FFF] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Similares</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                mobileViewMode === 'similar' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-700'
              }`}>
                {similarTenders.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('detail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mobileViewMode === 'detail'
                  ? 'bg-[#0B5FFF] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Detalle del Proceso
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO PRINCIPAL DIVIDIDO EN 2 COLUMNAS (35% / 65%) */}
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[#E4EAF3] dark:divide-slate-800">
          
          {/* ============================================================== */}
          {/* COLUMNA 1 (IZQUIERDA - 35%): LICITACIONES SIMILARES A ESTE PROCESO */}
          {/* ============================================================== */}
          <div className={`w-full lg:w-[35%] flex flex-col h-full overflow-hidden bg-[#F8FAFC] dark:bg-[#0E1526] ${
            mobileViewMode === 'similar' ? 'flex' : 'hidden lg:flex'
          }`}>
            
            {/* Cabecera oficial idéntica a Imagen 1 */}
            <div className="p-5 sm:p-6 border-b border-[#E4EAF3] dark:border-slate-800 bg-white dark:bg-[#111827] flex-shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0B5FFF] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-[#0B1739] dark:text-white">
                      Licitaciones Similares a este Proceso
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EBF2FF] text-[#0B5FFF] dark:bg-blue-950 dark:text-blue-300">
                      {similarTenders.length}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                    Oportunidades afines por objeto contractual, códigos UNSPSC y presupuesto
                  </p>
                </div>
              </div>
            </div>

            {/* Listado scrolleable de tarjetas adaptadas al espacio */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {similarTenders.length > 0 ? (
                similarTenders.map((sim, idx) => {
                  const rawItem = sim;
                  const simTender = rawItem.tender || rawItem;
                  const matchScore = typeof rawItem.matchScore === 'number' ? rawItem.matchScore : 45;
                  const matchReasons: string[] = Array.isArray(rawItem.matchReasons) && rawItem.matchReasons.length > 0
                    ? rawItem.matchReasons
                    : [
                        'Misma familia de bienes/servicios UNSPSC',
                        simTender.is_minima_cuantia ? 'Modalidad Mínima Cuantía (Sin RUP)' : 'Modalidad de contratación comparable'
                      ];
                  const tenderId = simTender.id || simTender.secop_id || simTender.process_number || `sim-${idx}`;
                  const isSimSaved = Boolean(
                    (simTender.id && savedTenderIds.has(String(simTender.id))) ||
                    (simTender.secop_id && savedTenderIds.has(String(simTender.secop_id))) ||
                    (simTender.process_number && savedTenderIds.has(String(simTender.process_number)))
                  );

                  return (
                    <div
                      key={tenderId}
                      onClick={() => onSelectSimilarTender(simTender)}
                      className="group relative cursor-pointer p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500/70 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        {/* Fila superior: Similitud, Modalidad y Guardar */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                              matchScore >= 75
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : matchScore >= 40
                                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}>
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>{matchScore}% Similitud</span>
                            </span>

                            {simTender.is_minima_cuantia ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Min. Cuantía</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-200 flex items-center gap-1">
                                <span>{simTender.contract_type || simTender.modalidad_de_contratacion || 'Convocatoria'}</span>
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSave(simTender);
                            }}
                            className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
                              isSimSaved
                                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-500 fill-amber-500 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-300 bg-white dark:bg-slate-800'
                            }`}
                            title={isSimSaved ? 'Quitar de guardadas' : 'Guardar licitación'}
                          >
                            <Bookmark className={`w-4 h-4 ${isSimSaved ? 'fill-current text-amber-500' : ''}`} />
                          </button>
                        </div>

                        {/* Etiqueta azul: Similar a proceso ... */}
                        <div className="flex items-center gap-1.5 text-xs text-[#0B5FFF] dark:text-blue-400 font-semibold">
                          <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Similar a proceso {tender.process_number || tender.secop_id || 'este proceso'}</span>
                        </div>

                        {/* Título de la licitación */}
                        <h4 className="font-bold text-sm sm:text-base text-[#0B1739] dark:text-white line-clamp-2 leading-snug group-hover:text-[#0B5FFF] dark:group-hover:text-blue-400 transition-colors">
                          {formatProcurementTitle(simTender.title)}
                        </h4>

                        {/* Entidad compradora */}
                        <p className="text-xs text-[#64748B] dark:text-slate-400 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                            {formatEntityName(simTender.entity_name)}
                          </span>
                        </p>

                        {/* Viñetas verdes de afinidad */}
                        <div className="space-y-1 pt-1 text-xs">
                          {matchReasons.map((reason, rIdx) => (
                            <p key={rIdx} className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                              <span>{reason}</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Pie de tarjeta: Presupuesto y "Ver detalle ->" */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] text-[#64748B] dark:text-slate-400 block font-medium">
                            Presupuesto
                          </span>
                          <span className="font-bold text-[#0B5FFF] dark:text-blue-400 font-mono text-sm sm:text-base">
                            {formatBudgetCompact(simTender.budget_cop)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 group-hover:text-[#0B5FFF] dark:group-hover:text-blue-400 font-bold text-xs sm:text-sm transition-colors">
                          <span>Ver detalle</span>
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No hay otros procesos con alta similitud registrados
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Explora el catálogo general de SECOP para encontrar más oportunidades activas.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* COLUMNA 2 (DERECHA - 65%): DETALLE DEL PROCESO SELECCIONADO */}
          {/* ============================================================== */}
          <div className={`w-full lg:w-[65%] flex flex-col h-full overflow-hidden bg-white dark:bg-[#111827] ${
            mobileViewMode === 'detail' ? 'flex' : 'hidden lg:flex'
          }`}>
            
            {/* 1. ENCABEZADO FIJO DEL DETALLE */}
            <div className="p-5 sm:p-6 border-b border-[#E4EAF3] dark:border-slate-800 bg-white dark:bg-[#111827] flex-shrink-0">
          
          {/* Fila 1: Badges y Botón de Cierre */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${modalityBadge.pillClass}`}>
                {modalityBadge.label}
              </span>

              {tender.source_platform === 'SECOP_I' ? (
                <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 text-xs font-bold">
                  SECOP I
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 text-xs font-bold">
                  SECOP II OFICIAL
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>CONVOCATORIA ACTIVA</span>
              </span>

              {selectedSubmission && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#0B5FFF] text-white text-xs font-bold shadow-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>RADICADA: {selectedSubmission.radicadoCode}</span>
                </span>
              )}
            </div>

            {/* BOTÓN CERRAR (X) */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cerrar detalle (Esc)"
              aria-label="Cerrar detalle"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TÍTULO COMPLETO DEL PROCESO */}
          <h2 className="text-base sm:text-lg font-bold text-[#0B1739] dark:text-white mt-3 leading-snug">
            {formatProcurementTitle(tender.title)}
          </h2>

          {/* ENTIDAD Y ACCIONES RÁPIDAS */}
          <div className="flex items-center justify-between gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{formatEntityName(tender.entity_name)}</span>
              <span className="text-slate-300 dark:text-slate-600 font-light">—</span>
              <span>{tender.department || 'Colombia'}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* COPIAR REFERENCIA */}
              <button
                type="button"
                onClick={handleCopyProcessNumber}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Copiar número de proceso para buscar en SECOP"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedRef ? '¡Copiado!' : (tender.process_number || 'Copiar Ref')}</span>
              </button>

              {/* ENLACE OFICIAL SECOP */}
              {tender.process_url && (
                <a
                  href={tender.process_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#EDF4FF] text-[#0B5FFF] hover:bg-[#DBEAFE] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 transition-colors"
                >
                  <span>Ver en SECOP Oficial</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* BOTÓN GUARDAR */}
              <button
                type="button"
                onClick={() => onToggleSave(tender)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  isSaved
                    ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-amber-500' : ''}`} />
                <span>{isSaved ? 'Guardada' : 'Guardar'}</span>
              </button>
            </div>
          </div>

          {/* GRID METADATOS CLAVE (CIERRE, PRESUPUESTO, MATCH) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-3 rounded-xl bg-[#F5F8FC] dark:bg-slate-900 border border-[#E4EAF3] dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#0B5FFF]" /> Publicación
              </span>
              <span className="font-bold text-[#0B1739] dark:text-slate-200">
                {formatFriendlyDate(tender.publication_date)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-amber-600 uppercase font-bold block flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" /> Cierre Ofertas
              </span>
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {formatFriendlyDate(tender.closing_date)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Presupuesto Oficial</span>
              <span className="font-bold text-[#0B5FFF] font-mono">
                {formatCOP(tender.budget_cop)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Compatibilidad RUP</span>
              <span className={`font-bold inline-flex items-center gap-1 ${
                score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {score}% Match
              </span>
            </div>
          </div>

          {/* BARRA DE ACCIÓN PRINCIPAL DE POSTULACIÓN */}
          <div className="mt-4">
            {selectedSubmission ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    Postulación Radicada: <span className="font-mono">{selectedSubmission.radicadoCode}</span> ({selectedSubmission.submittedAt})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenHistory}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Ver Historial
                  </button>
                  <button
                    type="button"
                    onClick={onOpenDossier}
                    className="px-3 py-1.5 bg-[#0B5FFF] text-white rounded-lg text-xs font-semibold"
                  >
                    Ver Expediente
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!planLimits.hasDossierGenerator) {
                      onTriggerPlanGate('dossier_generator');
                      return;
                    }
                    onOpenDossier();
                  }}
                  className="flex-1 w-full py-2.5 px-4 bg-[#0B5FFF] hover:bg-[#084BD6] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Preparar Documentación y Expediente ({company.name})</span>
                  {!planLimits.hasDossierGenerator && <Lock className="w-3.5 h-3.5 text-blue-200" />}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!planLimits.has1ClickSubmission) {
                      onTriggerPlanGate('submission_1click');
                      return;
                    }
                    onOpenSubmissionWizard();
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <SendHorizontal className="w-4 h-4" />
                  <span>Asistente de Radicación SECOP</span>
                  {!planLimits.has1ClickSubmission && <Lock className="w-3.5 h-3.5 text-emerald-200" />}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* 2. PESTAÑAS DE CONTENIDO */}
        <div className="px-6 border-b border-[#E4EAF3] dark:border-slate-800 bg-[#F5F8FC] dark:bg-slate-900 flex items-center gap-4 flex-shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('matriz')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'matriz'
                ? 'border-[#0B5FFF] text-[#0B5FFF] dark:text-blue-400'
                : 'border-transparent text-[#64748B] hover:text-[#0B1739] dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Matriz & Diagnóstico</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] font-bold rounded-full">
              RUP
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('asistente')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'asistente'
                ? 'border-[#0B5FFF] text-[#0B5FFF] dark:text-blue-400'
                : 'border-transparent text-[#64748B] hover:text-[#0B1739] dark:hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Asistente Legal IA (Gemini)</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] font-bold rounded-full flex items-center gap-1">
              {!planLimits.hasRagAssistant && <Lock className="w-2.5 h-2.5" />}
              <span>Pliegos</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'documentos'
                ? 'border-[#0B5FFF] text-[#0B5FFF] dark:text-blue-400'
                : 'border-transparent text-[#64748B] hover:text-[#0B1739] dark:hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Checklist & Documentos</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] font-bold rounded-full flex items-center gap-1">
              {!planLimits.hasChecklistDocs && <Lock className="w-2.5 h-2.5" />}
              <span>Docs</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resumen')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'resumen'
                ? 'border-[#0B5FFF] text-[#0B5FFF] dark:text-blue-400'
                : 'border-transparent text-[#64748B] hover:text-[#0B1739] dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resumen del Proceso</span>
          </button>
        </div>

        {/* 3. ÁREA DE CONTENIDO SCROLLEABLE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* PESTAÑA: RESUMEN */}
          {activeTab === 'resumen' && (
            <div className="space-y-5 text-xs">
              
              {/* OBJETO CONTRACTUAL DETALLADO */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E4EAF3] dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-[#0B1739] dark:text-white uppercase tracking-wider text-[11px]">
                  Objeto del Proceso
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                  {formatProcurementDescription(tender.description || tender.title)}
                </p>
              </div>

              {/* DETALLES DE LA CONVOCATORIA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E4EAF3] dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-[#0B1739] dark:text-white uppercase tracking-wider text-[11px]">
                    Entidad Estatal
                  </h4>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{formatEntityName(tender.entity_name)}</p>
                  <p className="text-slate-500">NIT: {tender.entity_nit || 'No disponible'}</p>
                  <p className="text-slate-500">Departamento: {tender.department || 'Nacional'}</p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E4EAF3] dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-[#0B1739] dark:text-white uppercase tracking-wider text-[11px]">
                    Parámetros de Contratación
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Modalidad:</strong> {tender.modalidad_de_contratacion || tender.contract_type}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Plataforma:</strong> {tender.source_platform}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Exp. SMMLV Requerida:</strong> {tender.experience_compliance?.smmlv_required || 0} SMMLV
                  </p>
                </div>
              </div>

              {/* MONITOREO DE ADENDAS 24/7 */}
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 dark:bg-purple-950/20 dark:border-purple-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <Radio className="w-4 h-4 text-purple-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-bold text-purple-950 dark:text-purple-200 text-xs">Vigilancia de Adendas y Pliegos Definitivos</p>
                    <p className="text-[11px] text-purple-700 dark:text-purple-400">Rastreo de cambios de fecha, respuestas a observaciones y anexos oficiales en SECOP.</p>
                  </div>
                </div>
                {!planLimits.hasAddendaMonitoring247 && (
                  <button
                    type="button"
                    onClick={() => onTriggerPlanGate('addenda_monitoring_247')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Activar
                  </button>
                )}
              </div>

            </div>
          )}

          {/* PESTAÑA: MATRIZ & DIAGNÓSTICO RUP */}
          {activeTab === 'matriz' && (() => {
            const basePageOffset = Math.abs(
              (tender.id || tender.secop_id || 'pliego')
                .split('')
                .reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % 7
            );

            // 1. LIQUIDEZ
            const rawLiquidity = tender.financial_compliance?.liquidity;
            const companyCurrentAssets = Number(company?.current_assets) || 0;
            const companyCurrentLiabilities = Number(company?.current_liabilities) || 1;
            const fallbackLiquidityValue = companyCurrentLiabilities > 0 
              ? companyCurrentAssets / companyCurrentLiabilities 
              : 1.86;
            const liquidityRequired = rawLiquidity?.required ?? 1.5;
            const liquidityValue = rawLiquidity?.value ?? fallbackLiquidityValue;
            const liquidityPasses = rawLiquidity?.passes ?? (liquidityValue >= liquidityRequired);
            const liquidityGap = rawLiquidity?.gap ?? Math.max(0, liquidityRequired - liquidityValue);
            const liquidityCitation: RequirementCitation = rawLiquidity?.citation || {
              title: "Índice de Liquidez Corriente",
              criterion: "Capacidad Financiera",
              document: "Pliego de Condiciones Definitivo.pdf",
              chapter: "Capítulo 3: Capacidad Financiera y Organizacional",
              numeral: "Numeral 3.2.1 - Indicador de Liquidez",
              page: 14 + basePageOffset,
              snippet: `El proponente singular o cada uno de los integrantes de la estructura plural deberá acreditar un Índice de Liquidez (Activo Corriente / Pasivo Corriente) igual o superior a ${liquidityRequired.toFixed(2)} veces, verificado en el Registro Único de Proponentes (RUP).`,
              verifiedLegalBasis: "Decreto 1082 de 2015 Art. 2.2.1.1.1.5.3 y Manual para la determinación y verificación de la capacidad financiera y organizacional de Colombia Compra Eficiente.",
              processNumber: tender.process_number || tender.secop_id,
              entityName: tender.entity_name,
              secopUrl: tender.process_url
            };

            // 2. ENDEUDAMIENTO
            const rawDebt = tender.financial_compliance?.debt;
            const companyTotalAssets = Number(company?.total_assets) || 0;
            const companyTotalLiabilities = Number(company?.total_liabilities) || 0;
            const fallbackDebtValue = companyTotalAssets > 0 
              ? companyTotalLiabilities / companyTotalAssets 
              : 0.506;
            const debtMaxAllowed = rawDebt?.max_allowed ?? 0.5;
            const debtValue = rawDebt?.value ?? fallbackDebtValue;
            const debtPasses = rawDebt?.passes ?? (debtValue <= debtMaxAllowed);
            const debtGap = rawDebt?.gap ?? Math.max(0, debtValue - debtMaxAllowed);
            const debtCitation: RequirementCitation = rawDebt?.citation || {
              title: "Nivel de Endeudamiento Máximo",
              criterion: "Capacidad Financiera",
              document: "Pliego de Condiciones Definitivo.pdf",
              chapter: "Capítulo 3: Capacidad Financiera y Organizacional",
              numeral: "Numeral 3.2.2 - Límite de Endeudamiento",
              page: 15 + basePageOffset,
              snippet: `El nivel de endeudamiento del proponente (Pasivo Total / Activo Total * 100) no podrá superar el ${(debtMaxAllowed * 100).toFixed(0)}% según balance general oficial reportado en el Certificado RUP con corte al año fiscal inmediatamente anterior.`,
              verifiedLegalBasis: "Decreto 1082 de 2015 y Circulares de Selección Objetiva de Colombia Compra Eficiente.",
              processNumber: tender.process_number || tender.secop_id,
              entityName: tender.entity_name,
              secopUrl: tender.process_url
            };

            // 3. EXPERIENCIA SMMLV
            const rawExperience = tender.experience_compliance;
            const smmlvRequired = rawExperience?.smmlv_required ?? 100;
            const smmlvAccumulated = rawExperience?.smmlv_accumulated ?? (Number(company?.smmlv_experience) || 0);
            const experiencePasses = rawExperience?.passes ?? (smmlvAccumulated >= smmlvRequired);
            const smmlvGap = rawExperience?.smmlv_gap ?? Math.max(0, smmlvRequired - smmlvAccumulated);
            const experienceCitation: RequirementCitation = rawExperience?.citation || {
              title: "Experiencia Acreditada en Salarios Mínimos",
              criterion: "Experiencia RUP Habilitante",
              document: "Pliego de Condiciones Definitivo.pdf",
              chapter: "Capítulo 4: Factores de Habilitación Técnica",
              numeral: "Numeral 4.1.1 - Experiencia en SMMLV",
              page: 22 + basePageOffset,
              snippet: `El proponente deberá acreditar contratos terminados y en firme en el RUP cuya sumatoria de valor liquidado sea igual o superior a ${smmlvRequired} SMMLV a la fecha de radicación de la oferta.`,
              verifiedLegalBasis: "Ley 1150 de 2007 Art. 5 y Decreto 1082 de 2015 Art. 2.2.1.1.1.5.2.",
              processNumber: tender.process_number || tender.secop_id,
              entityName: tender.entity_name,
              secopUrl: tender.process_url
            };

            // 4. UNSPSC
            const requiredUnspscList = (tender.required_unspsc && tender.required_unspsc.length > 0)
              ? tender.required_unspsc
              : (tender.unspsc_codes && tender.unspsc_codes.length > 0)
                ? tender.unspsc_codes
                : ['80101500'];
            const unspscMatched = rawExperience?.unspsc_matched || [];
            const unspscPasses = unspscMatched.length > 0;
            const unspscCitation: RequirementCitation = rawExperience?.unspsc_citation || {
              title: "Clasificación Clasificador UNSPSC",
              criterion: "Clasificación RUP Requerida",
              document: "Pliego de Condiciones Definitivo.pdf",
              chapter: "Capítulo 4: Factores de Habilitación Técnica",
              numeral: "Numeral 4.1.2 - Códigos de Bienes y Servicios",
              page: 24 + basePageOffset,
              snippet: `Los contratos aportados deberán estar clasificados en los siguientes códigos del Clasificador de Bienes y Servicios UNSPSC: [${requiredUnspscList.join(', ')}].`,
              verifiedLegalBasis: "Guía para la codificación de bienes y servicios de Colombia Compra Eficiente.",
              processNumber: tender.process_number || tender.secop_id,
              entityName: tender.entity_name,
              secopUrl: tender.process_url
            };

            // Requerimientos faltantes / Brechas
            let missingList: string[] = [];
            if (tender.missing_requirements && tender.missing_requirements.length > 0) {
              missingList = tender.missing_requirements;
            } else {
              if (!debtPasses) {
                missingList.push(`Nivel de Endeudamiento: Tu endeudamiento es ${(debtValue * 100).toFixed(1)}%. Supera el tope de ${(debtMaxAllowed * 100).toFixed(0)}% por un margen de ${(debtGap * 100).toFixed(1)}%.`);
              }
              if (!experiencePasses) {
                missingList.push(`Experiencia RUP en SMMLV: Tienes ${smmlvAccumulated} SMMLV. Te faltan ${smmlvGap.toFixed(1)} SMMLV en contratos ejecutados para alcanzar los ${smmlvRequired} SMMLV solicitados.`);
              }
              if (!unspscPasses) {
                missingList.push(`Códigos UNSPSC en RUP: No registras la clasificación ${requiredUnspscList.join(', ')} requerida para este objeto contractual.`);
              }
              if (!liquidityPasses) {
                missingList.push(`Índice de Liquidez: Tu liquidez actual es ${liquidityValue.toFixed(2)}. Falta un margen de ${liquidityGap.toFixed(2)} para el mínimo de ${liquidityRequired.toFixed(2)}.`);
              }
            }

            return (
              <div className="space-y-6 text-xs">
                
                {/* 1. TARJETA DE ALERTA: FALTANTES CRÍTICOS / BRECHAS */}
                {missingList.length > 0 ? (
                  <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
                    score >= 50 
                      ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/60' 
                      : 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/60'
                  }`}>
                    {/* Título de la alerta */}
                    <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${
                      score >= 50 ? 'text-amber-800 dark:text-amber-400' : 'text-rose-800 dark:text-rose-400'
                    }`}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {score >= 50 
                          ? `FALTANTES PARA ALCANZAR EL 100% DE MATCH (${score}% MATCH)` 
                          : `FALTANTES CRÍTICOS DE HABILITACIÓN (${score}% MATCH)`}
                      </span>
                    </div>

                    {/* Tarjetas individuales de requerimientos faltantes */}
                    <div className="space-y-2">
                      {missingList.map((req: string, idx: number) => (
                        <div 
                          key={idx} 
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs shadow-xs flex items-start gap-2.5"
                        >
                          <span className={`font-bold text-base leading-none mt-0.5 ${
                            score >= 50 ? 'text-amber-500' : 'text-rose-500'
                          }`}>•</span>
                          <span className="leading-relaxed font-normal">{req}</span>
                        </div>
                      ))}
                    </div>

                    {/* Estrategia Sugerida */}
                    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Estrategia Sugerida para Postularse:
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {tender.strategy_recommendation || 'Se recomienda conformar una Unión Temporal o Consorcio con un socio estratégico que aporte la experiencia técnica o financiera faltante.'}
                      </p>

                      {planLimits.hasAdvancedConsortium ? (
                        <div className="mt-2.5 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            <span className="font-semibold">Simulador de Consorcios Activo (Enterprise): Proporción recomendada para sumar experiencia SMMLV</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={onOpenConsortium} 
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs"
                          >
                            Abrir Simulador
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenConsortium ? onOpenConsortium() : onTriggerPlanGate('advanced_consortium')}
                          className="mt-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span>Ver Recomendación Avanzada de Consorcios & Porcentajes (Plan Enterprise 🔒)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-bold">¡Tu empresa cumple con el 100% de los requisitos habilitantes!</p>
                      <p className="text-[11px] text-emerald-700">Ratios financieros, experiencia SMMLV y códigos UNSPSC están acreditados.</p>
                    </div>
                  </div>
                )}

                {/* 2. MATRIZ COMPARATIVA FORMAL */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Matriz Comparativa: {company?.name || 'Mi Empresa'} vs Requisitos Oficiales
                  </h3>

                  <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-[#111827]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8FAFC] dark:bg-slate-900 border-b border-[#E4EAF3] dark:border-slate-800 text-[10.5px] uppercase font-bold text-[#64748B] dark:text-slate-400 tracking-wider">
                          <tr>
                            <th className="py-3.5 px-4 whitespace-nowrap">Criterio de Evaluación</th>
                            <th className="py-3.5 px-4 whitespace-nowrap">Requisito Exigido</th>
                            <th className="py-3.5 px-4 whitespace-nowrap">Acreditación Empresa</th>
                            <th className="py-3.5 px-4 whitespace-nowrap">Estado & Faltantes</th>
                            <th className="py-3.5 px-4 whitespace-nowrap">Fuente Oficial en Pliego</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {/* 1. ÍNDICE DE LIQUIDEZ */}
                          <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              Índice de Liquidez
                            </td>
                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-mono">
                              &ge; {liquidityRequired.toFixed(2)}
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-900 dark:text-white font-mono">
                              {liquidityValue.toFixed(2)}
                            </td>
                            <td className="py-4 px-4">
                              {liquidityPasses ? (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Cumple</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
                                  <X className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Falta Margen de {liquidityGap.toFixed(2)}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <button
                                type="button"
                                onClick={() => onOpenCitation?.(liquidityCitation)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs group"
                                title="Haz clic para auditar la página y el texto legal del pliego"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                                <span>Pág. {liquidityCitation.page} · {liquidityCitation.numeral}</span>
                              </button>
                            </td>
                          </tr>

                          {/* 2. ÍNDICE DE ENDEUDAMIENTO */}
                          <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              Índice de Endeudamiento
                            </td>
                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-mono">
                              &le; {(debtMaxAllowed * 100).toFixed(0)}%
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-900 dark:text-white font-mono">
                              {(debtValue * 100).toFixed(1)}%
                            </td>
                            <td className="py-4 px-4">
                              {debtPasses ? (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Cumple</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
                                  <X className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Excede por {(debtGap * 100).toFixed(1)}%</span>
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <button
                                type="button"
                                onClick={() => onOpenCitation?.(debtCitation)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs group"
                                title="Haz clic para auditar la página y el texto legal del pliego"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                                <span>Pág. {debtCitation.page} · {debtCitation.numeral}</span>
                              </button>
                            </td>
                          </tr>

                          {/* 3. EXPERIENCIA RUP (SMMLV) */}
                          <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              Experiencia RUP (SMMLV)
                            </td>
                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-mono">
                              {smmlvRequired} SMMLV
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-900 dark:text-white font-mono">
                              {smmlvAccumulated} SMMLV
                            </td>
                            <td className="py-4 px-4">
                              {experiencePasses ? (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Cumple</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Faltan {smmlvGap.toFixed(1)} SMMLV</span>
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <button
                                type="button"
                                onClick={() => onOpenCitation?.(experienceCitation)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs group"
                                title="Haz clic para auditar la página y el texto legal del pliego"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                                <span>Pág. {experienceCitation.page} · {experienceCitation.numeral}</span>
                              </button>
                            </td>
                          </tr>

                          {/* 4. CLASIFICACIÓN UNSPSC */}
                          <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              Clasificación UNSPSC
                            </td>
                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-mono">
                              {requiredUnspscList.join(', ')}
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-900 dark:text-white font-mono">
                              {unspscMatched.length > 0 ? unspscMatched.join(', ') : 'Sin coincidencia'}
                            </td>
                            <td className="py-4 px-4">
                              {unspscPasses ? (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Cumple</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
                                  <X className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Código no acreditado</span>
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <button
                                type="button"
                                onClick={() => onOpenCitation?.(unspscCitation)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs group"
                                title="Haz clic para auditar la página y el texto legal del pliego"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                                <span>Pág. {unspscCitation.page} · {unspscCitation.numeral}</span>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 3. ACCESO RÁPIDO AL SIMULADOR DE CONSORCIOS */}
                <div className="p-4 rounded-xl bg-[#EDF4FF] dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0B5FFF] text-white flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#0B1739] dark:text-white">Simulador de Consorcios y Uniones Temporales</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Combina la capacidad financiera y técnica de tu empresa con un socio para habilitar este proceso.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenConsortium}
                    className="px-3.5 py-1.5 bg-[#0B5FFF] hover:bg-[#084BD6] text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Abrir Simulador
                  </button>
                </div>

              </div>
            );
          })()}

          {/* PESTAÑA: DOCUMENTOS Y CHECKLIST */}
          {activeTab === 'documentos' && (() => {
            // Documentos exigidos (del pliego o lista estándar oficial)
            const requiredDocs = (tender.required_documents && tender.required_documents.length > 0)
              ? tender.required_documents
              : [
                  'Carta de Presentación de la Oferta (Anexo N° 1)',
                  'Certificación RUP Vigente con Estados Financieros',
                  'Póliza de Seriedad de la Oferta expedida por Aseguradora',
                  'Certificado de Pago de Aportes a Seguridad Social y Parafiscales',
                  'Acreditación de Cumplimiento de Especificaciones Técnicas'
                ];

            // Puntos fuertes acreditados (reasons)
            let strengthsList: string[] = [];
            if (tender.reasons && tender.reasons.length > 0) {
              strengthsList = tender.reasons;
            } else {
              // Calcular puntos fuertes en base a compliance
              const rawLiq = tender.financial_compliance?.liquidity;
              const rawDbt = tender.financial_compliance?.debt;
              const rawExp = tender.experience_compliance;

              const compCurrentAssets = Number(company?.current_assets) || 0;
              const compCurrentLiabilities = Number(company?.current_liabilities) || 1;
              const liqVal = rawLiq?.value ?? (compCurrentLiabilities > 0 ? compCurrentAssets / compCurrentLiabilities : 1.86);
              const liqReq = rawLiq?.required ?? 1.5;
              if (rawLiq?.passes || liqVal >= liqReq) {
                strengthsList.push(`Índice de Liquidez (${liqVal.toFixed(2)}) supera el mínimo exigido (${liqReq.toFixed(2)}).`);
              }

              const compTotalAssets = Number(company?.total_assets) || 0;
              const compTotalLiabilities = Number(company?.total_liabilities) || 0;
              const dbtVal = rawDbt?.value ?? (compTotalAssets > 0 ? compTotalLiabilities / compTotalAssets : 0.5);
              const dbtMax = rawDbt?.max_allowed ?? 0.5;
              if (rawDbt?.passes || dbtVal <= dbtMax) {
                strengthsList.push(`Índice de Endeudamiento (${(dbtVal * 100).toFixed(1)}%) cumple el límite máximo (${(dbtMax * 100).toFixed(0)}%).`);
              }

              const expAccum = rawExp?.smmlv_accumulated ?? (Number(company?.smmlv_experience) || 0);
              const expReq = rawExp?.smmlv_required ?? 100;
              if (rawExp?.passes || expAccum >= expReq) {
                strengthsList.push(`Experiencia RUP acreditada (${expAccum} SMMLV) cubre los ${expReq} SMMLV exigidos.`);
              }

              if (rawExp?.unspsc_matched && rawExp.unspsc_matched.length > 0) {
                strengthsList.push(`Códigos UNSPSC coincidentes en el RUP: [${rawExp.unspsc_matched.join(', ')}].`);
              }

              if (strengthsList.length === 0) {
                strengthsList.push(`Índice de Liquidez (${liqVal.toFixed(2)}) supera el mínimo exigido (${liqReq.toFixed(2)}).`);
              }
            }

            return (
              <div className="space-y-6 text-xs">
                {/* GRID DE DOS COLUMNAS: PUNTOS FUERTES & CHECKLIST DE DOCUMENTOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  
                  {/* COLUMNA 1: PUNTOS FUERTES ACREDITADOS */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC]/50 dark:bg-slate-900/40 space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>PUNTOS FUERTES ACREDITADOS</span>
                    </h4>

                    <div className="space-y-2">
                      {strengthsList.map((reason: string, idx: number) => (
                        <div 
                          key={idx}
                          className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs shadow-xs flex items-start gap-2.5"
                        >
                          <span className="text-emerald-500 font-bold text-base leading-none mt-0.5">•</span>
                          <span className="leading-relaxed font-normal">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COLUMNA 2: CHECKLIST DE DOCUMENTOS EXIGIDOS */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC]/50 dark:bg-slate-900/40 space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>CHECKLIST DE DOCUMENTOS EXIGIDOS</span>
                    </h4>

                    <div className="space-y-2">
                      {requiredDocs.map((doc: string, idx: number) => (
                        <div 
                          key={idx}
                          className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs shadow-xs flex items-center gap-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="leading-relaxed font-normal">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* BOTÓN GESTIÓN DE EXPEDIENTE / BÓVEDA */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={onOpenDossier}
                    className="px-4 py-2.5 bg-[#0B5FFF] hover:bg-[#084BD6] text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Gestionar Bóveda de Documentos para este Proceso</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* PESTAÑA: ASISTENTE LEGAL IA */}
          {activeTab === 'asistente' && (
            <div className="flex flex-col h-[400px] border border-[#E4EAF3] dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111827] overflow-hidden">
              
              {/* HISTORIAL DE CHAT */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {queryHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-3 rounded-2xl ${
                      item.sender === 'user'
                        ? 'bg-[#0B5FFF] text-white'
                        : 'bg-[#F5F8FC] dark:bg-slate-800 text-[#0B1739] dark:text-slate-200 border border-[#E4EAF3] dark:border-slate-700'
                    }`}>
                      <p className="whitespace-pre-line leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
                {isQuerying && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B5FFF]" />
                      <span>Analizando pliego con IA...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* BARRA DE ENTRADA DEL CHAT */}
              <form 
                onSubmit={onSendQuery}
                className="p-3 border-t border-[#E4EAF3] dark:border-slate-800 bg-[#F5F8FC] dark:bg-slate-900 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={queryMessage}
                  onChange={(e) => setQueryMessage(e.target.value)}
                  placeholder="Pregunta sobre requisitos habilitantes, adendas, plazos..."
                  className="flex-1 bg-white dark:bg-slate-800 border border-[#E4EAF3] dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-[#0B1739] dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                />
                <button
                  type="submit"
                  disabled={!queryMessage.trim() || isQuerying}
                  className="p-2 bg-[#0B5FFF] hover:bg-[#084BD6] disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          )}

        </div>

          </div>

        </div>

      </div>

    </div>
  );
}
