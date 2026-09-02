import React, { useState } from 'react';
import { 
  X, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  FileCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  DollarSign, 
  Calendar, 
  Award, 
  Check, 
  ShieldCheck, 
  Filter, 
  SendHorizontal, 
  ChevronRight, 
  FileText, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Layers, 
  Globe2, 
  BellRing, 
  Inbox,
  Trash2
} from 'lucide-react';
import { 
  ApplicationRecord, 
  SubmissionStatus, 
  syncApplicationsWithLiveSecop, 
  saveApplicationsHistory,
  deleteApplicationRecord,
  clearApplicationsHistory
} from '../services/submissionsService';
import { formatCOP } from '../services/dossierGenerator';
import { formatFriendlyDate } from '../services/api';

interface ApplicationsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: ApplicationRecord[];
  onApplicationsChange: (updated: ApplicationRecord[]) => void;
  onOpenSubmissionReceipt?: (app: ApplicationRecord) => void;
  companyNit?: string;
  companyName?: string;
}

export const ApplicationsHistoryModal: React.FC<ApplicationsHistoryModalProps> = ({
  isOpen,
  onClose,
  applications,
  onApplicationsChange,
  onOpenSubmissionReceipt,
  companyNit,
  companyName
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'with_response' | 'in_evaluation' | 'awarded'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const result = await syncApplicationsWithLiveSecop(companyNit);
      onApplicationsChange(result.applications);
      setSyncNotice(`Sincronización completada: ${result.updatedCount} procesos verificados en SECOP I & II.`);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err) {
      console.error('Error sincronizando con SECOP:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      const updated = deleteApplicationRecord(confirmDeleteId, companyNit);
      onApplicationsChange(updated);
      setConfirmDeleteId(null);
    }
  };

  const handleClearAll = () => {
    setConfirmClearAll(true);
  };

  const confirmClear = () => {
    const updated = clearApplicationsHistory(companyNit);
    onApplicationsChange(updated);
    setConfirmClearAll(false);
  };

  // Filtrado de postulaciones
  const filteredApps = applications.filter(app => {
    // Filtro por pestaña
    if (filterTab === 'with_response' && !app.entityResponse.hasResponse) return false;
    if (filterTab === 'in_evaluation' && app.status !== 'EN_EVALUACION') return false;
    if (filterTab === 'awarded' && app.status !== 'ADJUDICADA') return false;

    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchProcess = app.processNumber.toLowerCase().includes(q);
      const matchEntity = app.entityName.toLowerCase().includes(q);
      const matchTitle = app.title.toLowerCase().includes(q);
      const matchRadicado = app.radicadoCode.toLowerCase().includes(q);
      return matchProcess || matchEntity || matchTitle || matchRadicado;
    }

    return true;
  });

  const totalCount = applications.length;
  const withResponseCount = applications.filter(a => a.entityResponse.hasResponse).length;
  const inEvaluationCount = applications.filter(a => a.status === 'EN_EVALUACION').length;
  const awardedCount = applications.filter(a => a.status === 'ADJUDICADA').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ENCABEZADO DEL HISTORIAL */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Historial de Postulaciones & Respuestas Oficiales
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  SECOP I & II EN VIVO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rastreo del estado procesal, informes preliminares de evaluación, subsanaciones y adjudicaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* BOTÓN LIMPIAR HISTORIAL */}
            {applications.length > 0 && (
              <button
                onClick={handleClearAll}
                title="Limpiar todas las postulaciones de prueba para esta empresa"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold text-xs transition-colors border border-slate-200 dark:border-slate-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpiar Historial</span>
              </button>
            )}

            {/* BOTÓN SINCRONIZAR EN TIEMPO REAL CON SECOP */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-xs transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isSyncing ? 'Verificando SECOP...' : 'Sincronizar Estados en Vivo'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICACIÓN DE SINCRONIZACIÓN */}
        {syncNotice && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 px-6 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* CUERPO DEL MODAL (KPIS + FILTROS + LISTADO) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/40 dark:bg-slate-900/20">
          
          {/* TARJETAS DE INDICADORES (KPIS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Total Postuladas</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalCount}</p>
              <span className="text-[10px] text-slate-400">Ofertas Radicadas</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block flex items-center gap-1">
                <BellRing className="w-3.5 h-3.5" /> Con Respuesta Oficial
              </span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{withResponseCount}</p>
              <span className="text-[10px] text-slate-400">Informes o Subsanaciones</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block">En Evaluación</span>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{inEvaluationCount}</p>
              <span className="text-[10px] text-slate-400">Revisión por Comité</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block">Adjudicadas</span>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{awardedCount}</p>
              <span className="text-[10px] text-slate-400">Contratos Obtenidos</span>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA Y PESTAÑAS DE FILTRADO */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            
            {/* PESTAÑAS DE FILTRO */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg text-xs font-semibold w-full sm:w-auto">
              <button
                onClick={() => setFilterTab('all')}
                className={`py-1.5 px-3 rounded-md transition-colors ${
                  filterTab === 'all'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todas ({totalCount})
              </button>

              <button
                onClick={() => setFilterTab('with_response')}
                className={`py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 ${
                  filterTab === 'with_response'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                <span>Con Respuestas ({withResponseCount})</span>
              </button>

              <button
                onClick={() => setFilterTab('in_evaluation')}
                className={`py-1.5 px-3 rounded-md transition-colors ${
                  filterTab === 'in_evaluation'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                En Evaluación ({inEvaluationCount})
              </button>

              <button
                onClick={() => setFilterTab('awarded')}
                className={`py-1.5 px-3 rounded-md transition-colors ${
                  filterTab === 'awarded'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Adjudicadas ({awardedCount})
              </button>
            </div>

            {/* BUSCADOR */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por proceso, entidad o radicado..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* LISTA DE POSTULACIONES Y DETALLE DE RESPUESTAS */}
          <div className="space-y-4">
            {filteredApps.length > 0 ? (
              filteredApps.map((app) => {
                const isExpanded = expandedAppId === app.id;
                const hasResp = app.entityResponse.hasResponse;
                const isSecop1 = app.sourcePlatform === 'SECOP_I';

                return (
                  <div
                    key={app.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-slate-950 border transition-all shadow-sm ${
                      hasResp
                        ? 'border-emerald-200 dark:border-emerald-800/80 ring-1 ring-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* CABECERA DE LA POSTULACIÓN */}
                    <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {app.processNumber}
                          </span>

                          {isSecop1 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10.5px] font-bold border border-amber-300 dark:border-amber-700">
                              SECOP I
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[10.5px] font-bold border border-blue-200 dark:border-blue-800">
                              SECOP II
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono text-[10.5px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            <span>Radicado: {app.radicadoCode}</span>
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug mt-1">
                          {app.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{app.entityName}</span>
                          <span>•</span>
                          <span>{app.department}</span>
                        </p>
                      </div>

                      {/* ESTADO Y VALOR PROPUESTO */}
                      <div className="text-right space-y-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          app.status === 'INFORME_PRELIMINAR'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : app.status === 'SUBSANACION_REQUERIDA'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                            : app.status === 'ADJUDICADA'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {app.status === 'INFORME_PRELIMINAR' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {app.status === 'SUBSANACION_REQUERIDA' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {app.status === 'EN_EVALUACION' && <Clock className="w-3.5 h-3.5" />}
                          {app.status === 'ADJUDICADA' && <Award className="w-3.5 h-3.5" />}
                          
                          <span>
                            {app.status === 'INFORME_PRELIMINAR' && 'Informe Preliminar Publicado'}
                            {app.status === 'SUBSANACION_REQUERIDA' && 'Subsanación Requerida'}
                            {app.status === 'EN_EVALUACION' && 'En Evaluación de Ofertas'}
                            {app.status === 'ADJUDICADA' && 'Adjudicada (Ganada 🎉)'}
                          </span>
                        </span>

                        <div className="text-xs">
                          <span className="text-slate-400 block text-[10px]">Valor Propuesto</span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">
                            {formatCOP(app.proposedValue)} COP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BLOQUE DESTACADO: RESPUESTA OFICIAL DE LA ENTIDAD CONTRATANTE */}
                    <div className="mt-4">
                      {hasResp ? (
                        <div className={`p-4 rounded-xl border text-xs space-y-3 ${
                          app.entityResponse.responseType === 'INFORME_PRELIMINAR'
                            ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                            : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                        }`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                              {app.entityResponse.responseType === 'INFORME_PRELIMINAR' ? (
                                <span className="p-1 rounded bg-emerald-600 text-white font-bold">
                                  <Award className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="p-1 rounded bg-amber-600 text-white font-bold">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <span>{app.entityResponse.title}</span>
                            </div>

                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              Fecha de Emisión: {app.entityResponse.responseDate}
                            </span>
                          </div>

                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {app.entityResponse.summary}
                          </p>

                          {/* PUNTAJE Y ORDEN DE ELEGIBILIDAD */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                            {app.entityResponse.scoreAwarded && (
                              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Calificación Obtenida</span>
                                <span className="font-bold text-slate-900 dark:text-emerald-400 text-xs">
                                  {app.entityResponse.scoreAwarded}
                                </span>
                              </div>
                            )}

                            {app.entityResponse.eligibilityRank && (
                              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Orden de Elegibilidad</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">
                                  {app.entityResponse.eligibilityRank}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* ACCIÓN REQUERIDA Y FECHA LÍMITE */}
                          {app.entityResponse.actionRequired && (
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <span className="font-bold text-amber-900 dark:text-amber-300 block">Acción Recomendada:</span>
                                <span className="text-slate-700 dark:text-slate-300">{app.entityResponse.actionRequired}</span>
                                {app.entityResponse.actionDeadline && (
                                  <span className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-1">
                                    ⏰ Fecha Límite de Atención: {app.entityResponse.actionDeadline}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <Clock className="w-4 h-4 text-blue-500 animate-pulse flex-shrink-0" />
                            <span>
                              <strong>En Revisión Activa:</strong> La entidad se encuentra revisando las ofertas. Se notificará tan pronto se publique el informe preliminar.
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">Radicada el {app.submittedAt}</span>
                        </div>
                      )}
                    </div>

                    {/* LÍNEA DE TIEMPO EXPANDIBLE */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Línea de Tiempo del Procedimiento en SECOP
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          {app.timeline.map((item, idx) => (
                            <div 
                              key={idx} 
                              className={`p-3 rounded-lg border text-xs space-y-1 ${
                                item.status === 'completed'
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                  : item.status === 'current'
                                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700 ring-1 ring-blue-500/20 font-semibold'
                                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">{item.title}</span>
                                {item.status === 'completed' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                              <span className="text-[10px] text-slate-400 block">{item.date}</span>
                              <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-snug">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* BOTONES DE ACCIÓN */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Ocultar Línea de Tiempo' : 'Ver Línea de Tiempo'}</span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {app.processUrl && (
                          <a
                            href={app.processUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
                          >
                            <span>Ver en {isSecop1 ? 'SECOP I' : 'SECOP II'} Oficial</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingle(app.id, e)}
                          title="Eliminar esta postulación del historial"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-400" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No se encontraron postulaciones con este filtro</p>
                <p className="text-[11px] text-slate-400">
                  Las licitaciones que radiques desde el asistente aparecerán automáticamente registradas aquí para su seguimiento.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── DIÁLOGO DE CONFIRMACIÓN: ELIMINAR UNA POSTULACIÓN ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Eliminar postulación</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              ¿Deseas eliminar este registro de postulación de tu historial?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIÁLOGO DE CONFIRMACIÓN: LIMPIAR HISTORIAL COMPLETO ── */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Limpiar historial completo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              ¿Deseas eliminar <strong>todas</strong> las postulaciones del historial de esta empresa?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmClear}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
              >
                Sí, limpiar todo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
