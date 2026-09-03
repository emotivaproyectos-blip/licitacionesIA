import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Building2, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Award, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  Filter, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  PieChart, 
  ShieldAlert, 
  Users, 
  BarChart3,
  MapPin,
  ChevronRight,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { 
  searchCompetitorIntelligence, 
  searchEntityIntelligence, 
  fetchPaaRadar, 
  CompetitorProfile, 
  EntityProcurementProfile, 
  PaaOpportunity 
} from '../services/marketIntelligenceService';

interface MarketIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyUnspsc?: string[];
  companyName?: string;
}

export const MarketIntelligenceModal: React.FC<MarketIntelligenceModalProps> = ({
  isOpen,
  onClose,
  companyUnspsc = [],
  companyName = 'Mi Empresa'
}) => {
  const [activeTab, setActiveTab] = useState<'competitors' | 'entities' | 'paa'>('competitors');

  // Estado pestaña 1: Competidores
  const [competitorQuery, setCompetitorQuery] = useState<string>('');
  const [competitorData, setCompetitorData] = useState<CompetitorProfile | null>(null);
  const [isSearchingCompetitor, setIsSearchingCompetitor] = useState<boolean>(false);
  const [competitorError, setCompetitorError] = useState<string | null>(null);

  // Estado pestaña 2: Entidades
  const [entityQuery, setEntityQuery] = useState<string>('');
  const [entityData, setEntityData] = useState<EntityProcurementProfile | null>(null);
  const [isSearchingEntity, setIsSearchingEntity] = useState<boolean>(false);
  const [entityError, setEntityError] = useState<string | null>(null);

  // Estado pestaña 3: Radar PAA
  const [paaList, setPaaList] = useState<PaaOpportunity[]>([]);
  const [isLoadingPaa, setIsLoadingPaa] = useState<boolean>(false);
  const [paaFilterKeyword, setPaaFilterKeyword] = useState<string>('');
  const [paaDepartment, setPaaDepartment] = useState<string>('todos');
  const [onlyMatchedUnspsc, setOnlyMatchedUnspsc] = useState<boolean>(false);

  // Formateador de dinero en pesos colombianos
  const formatMoney = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(2)}B COP`;
    }
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M COP`;
    }
    return `$${amount.toLocaleString('es-CO')} COP`;
  };

  // Carga inicial o sugerencias
  useEffect(() => {
    if (isOpen && !competitorData && !isSearchingCompetitor) {
      // Cargar un ejemplo inicial representativo para que el usuario no vea la pantalla en blanco
      handleSearchCompetitor('INFRAESTRUCTURA');
    }
    if (isOpen && paaList.length === 0) {
      handleLoadPaa();
    }
  }, [isOpen]);

  const handleSearchCompetitor = async (queryToSearch?: string) => {
    const q = queryToSearch || competitorQuery;
    if (!q || !q.trim()) return;
    setIsSearchingCompetitor(true);
    setCompetitorError(null);
    try {
      const data = await searchCompetitorIntelligence(q);
      setCompetitorData(data);
    } catch (err: any) {
      setCompetitorError(err.message || 'Error al buscar el competidor.');
    } finally {
      setIsSearchingCompetitor(false);
    }
  };

  const handleSearchEntity = async (queryToSearch?: string) => {
    const q = queryToSearch || entityQuery;
    if (!q || !q.trim()) return;
    setIsSearchingEntity(true);
    setEntityError(null);
    try {
      const data = await searchEntityIntelligence(q);
      setEntityData(data);
    } catch (err: any) {
      setEntityError(err.message || 'Error al buscar la entidad.');
    } finally {
      setIsSearchingEntity(false);
    }
  };

  const handleLoadPaa = async () => {
    setIsLoadingPaa(true);
    try {
      const data = await fetchPaaRadar(companyUnspsc, paaFilterKeyword, paaDepartment);
      setPaaList(data);
    } catch (err) {
      console.warn('Error loading PAA:', err);
    } finally {
      setIsLoadingPaa(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header con gradiente */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Inteligencia de Mercado & Competencia
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  SECOP II en Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Radiografía oficial de proveedores, contratos ganados de la competencia y radar de compras tempranas (PAA).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de pestañas */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('competitors')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'competitors'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Radiografía de Competencia
          </button>
          <button
            onClick={() => {
              setActiveTab('entities');
              if (!entityData) handleSearchEntity('ALCALDÍA MAYOR DE BOGOTÁ');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'entities'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Entidades Estatales
          </button>
          <button
            onClick={() => setActiveTab('paa')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'paa'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Radar PAA (Compras Tempranas)
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
              Antes de pliegos
            </span>
          </button>
        </div>

        {/* Contenido del Modal con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ========================================================================= */}
          {/* PESTAÑA 1: RADIOGRAFÍA DE COMPETENCIA */}
          {/* ========================================================================= */}
          {activeTab === 'competitors' && (
            <div className="space-y-6">
              {/* Buscador de competidor */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchCompetitor();
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={competitorQuery}
                      onChange={(e) => setCompetitorQuery(e.target.value)}
                      placeholder="Ingresa el NIT o razón social del competidor (ej: 900222111 o Sistemas de Información)..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingCompetitor}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {isSearchingCompetitor ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Investigar Competidor
                  </button>
                </form>

                {/* Etiquetas rápidas */}
                <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-500">
                  <span className="font-medium">Prueba con:</span>
                  {['Sistemas', 'Infraestructura', 'Consultores', 'Seguridad'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setCompetitorQuery(tag);
                        handleSearchCompetitor(tag);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {competitorError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{competitorError}</p>
                </div>
              )}

              {/* Resultados del competidor */}
              {competitorData && (
                <div className="space-y-6">
                  {/* Encabezado del perfil */}
                  <div className="p-5 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Contratista del Estado · SECOP II
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {competitorData.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span>NIT / Doc: <strong className="text-slate-700 dark:text-slate-300">{competitorData.nit}</strong></span>
                        <span>•</span>
                        <span>Contratos registrados: <strong className="text-slate-700 dark:text-slate-300">{competitorData.totalContracts}</strong></span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Adjudicado en SECOP</span>
                      <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(competitorData.totalAwardedCop)}
                      </span>
                    </div>
                  </div>

                  {/* Tarjetas métricas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                        Contratos Ganados
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {competitorData.totalContracts}
                      </p>
                      <span className="text-[11px] text-slate-400">En base de datos SECOP II</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        Ticket Promedio
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {formatMoney(competitorData.avgContractValue)}
                      </p>
                      <span className="text-[11px] text-slate-400">Por adjudicación</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                        <Building2 className="w-4 h-4 text-amber-500" />
                        Cliente Principal
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate" title={competitorData.topEntities[0]?.name}>
                        {competitorData.topEntities[0]?.name || 'Varias Entidades'}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {competitorData.topEntities[0] ? `${competitorData.topEntities[0].count} contratos adjudicados` : 'Sin datos'}
                      </span>
                    </div>
                  </div>

                  {/* Entidades que más le contratan */}
                  {competitorData.topEntities.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        Top Entidades Estatales Compradoras (¿Con quién contrata tu rival?)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {competitorData.topEntities.map((ent, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-3">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={ent.name}>
                                {ent.name}
                              </p>
                              <span className="text-[11px] text-slate-500">
                                {ent.count} {ent.count === 1 ? 'contrato' : 'contratos'} ganados
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              {formatMoney(ent.totalAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tabla de contratos recientes adjudicados */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        Historial de Contratos Adjudicados
                      </span>
                      <span className="text-xs text-slate-500 font-normal">
                        Mostrando {competitorData.recentContracts.length} adjudicaciones oficiales
                      </span>
                    </h4>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                            <tr>
                              <th className="py-3 px-4">Proceso / Entidad</th>
                              <th className="py-3 px-4">Objeto Contractual</th>
                              <th className="py-3 px-4">Valor Adjudicado</th>
                              <th className="py-3 px-4">Fecha Firma</th>
                              <th className="py-3 px-4 text-right">SECOP II</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {competitorData.recentContracts.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-4 align-top max-w-[200px]">
                                  <span className="font-bold text-slate-900 dark:text-slate-100 block truncate" title={c.reference}>
                                    {c.reference}
                                  </span>
                                  <span className="text-[11px] text-slate-500 block truncate" title={c.entityName}>
                                    {c.entityName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {c.department}
                                  </span>
                                </td>
                                <td className="py-3 px-4 align-top">
                                  <p className="text-slate-700 dark:text-slate-300 line-clamp-2" title={c.description}>
                                    {c.description}
                                  </p>
                                  {c.unspscCode && (
                                    <span className="inline-block mt-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                      UNSPSC: {c.unspscCode}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 align-top whitespace-nowrap">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatMoney(c.contractValue)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 align-top whitespace-nowrap text-slate-500">
                                  {c.signDate}
                                </td>
                                <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                                  <a
                                    href={c.processUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                                  >
                                    Ver <ArrowUpRight className="w-3 h-3" />
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 2: RADIOGRAFÍA DE ENTIDADES */}
          {/* ========================================================================= */}
          {activeTab === 'entities' && (
            <div className="space-y-6">
              {/* Buscador de entidad */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchEntity();
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={entityQuery}
                      onChange={(e) => setEntityQuery(e.target.value)}
                      placeholder="Busca cualquier entidad del Estado (ej: IDU, SENA, Alcaldía de Medellín, Ministerio de TIC)..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingEntity}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {isSearchingEntity ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Auditar Entidad
                  </button>
                </form>
              </div>

              {entityError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{entityError}</p>
                </div>
              )}

              {entityData && (
                <div className="space-y-6">
                  {/* Encabezado entidad */}
                  <div className="p-5 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Entidad Estatal Contratante
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {entityData.entityName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        NIT: <strong className="text-slate-700 dark:text-slate-300">{entityData.entityNit}</strong> · Ubicación: <strong className="text-slate-700 dark:text-slate-300">{entityData.department}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Presupuesto Adjudicado Muestreado</span>
                      <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        {formatMoney(entityData.totalAwardedCop)}
                      </span>
                    </div>
                  </div>

                  {/* Contratistas que más ganan con esta entidad */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Proveedores Más Frecuentes / Favoritos de la Entidad
                    </h4>
                    <p className="text-xs text-slate-500">
                      Empresas que concentran mayor volumen de contratación con {entityData.entityName}.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {entityData.topContractors.map((c, i) => (
                        <div
                          key={i}
                          className="p-3.5 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-3">
                            <span className="text-[10px] font-bold text-slate-400 block">#{i + 1} PROVEEDOR</span>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={c.name}>
                              {c.name}
                            </p>
                            <span className="text-[11px] text-slate-500">
                              {c.count} {c.count === 1 ? 'contrato ganado' : 'contratos ganados'}
                            </span>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                              {formatMoney(c.totalAmount)}
                            </span>
                            <button
                              onClick={() => {
                                setActiveTab('competitors');
                                setCompetitorQuery(c.name);
                                handleSearchCompetitor(c.name);
                              }}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                            >
                              Ver perfil →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 3: RADAR PAA (PLAN ANUAL DE ADQUISICIONES) */}
          {/* ========================================================================= */}
          {activeTab === 'paa' && (
            <div className="space-y-6">
              {/* Explicación y filtros */}
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                      Oportunidades Tempranas del Plan Anual de Adquisiciones (PAA)
                    </h4>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-0.5">
                      Las entidades del Estado publican qué van a comprar con meses de anticipación. Te permite preparar tu RUP, estados financieros y alianzas antes de que se abra el pliego.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLoadPaa}
                  disabled={isLoadingPaa}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPaa ? 'animate-spin' : ''}`} />
                  Actualizar PAA
                </button>
              </div>

              {/* Filtro rápido */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={paaFilterKeyword}
                    onChange={(e) => setPaaFilterKeyword(e.target.value)}
                    placeholder="Filtrar por palabra clave (ej: software, interventoría, mantenimiento, dotación)..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
                <button
                  onClick={() => setOnlyMatchedUnspsc(!onlyMatchedUnspsc)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                    onlyMatchedUnspsc
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Solo con mis Códigos RUP ({companyUnspsc.length})
                </button>
              </div>

              {/* Listado de oportunidades PAA */}
              <div className="space-y-3">
                {paaList
                  .filter((p) => {
                    if (onlyMatchedUnspsc && !p.matchedUnspsc) return false;
                    if (paaFilterKeyword && !p.description.toLowerCase().includes(paaFilterKeyword.toLowerCase()) && !p.entityName.toLowerCase().includes(paaFilterKeyword.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                            {item.entityName}
                          </span>
                          {item.matchedUnspsc && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Coincide con tu RUP
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                            UNSPSC: {item.unspscCode}
                          </span>
                        </div>

                        <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                          {item.description}
                        </h5>

                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            Mes proyectado: <strong>{item.estimatedMonth}</strong>
                          </span>
                          <span>•</span>
                          <span>Modalidad: <strong>{item.selectionModality}</strong></span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[11px] text-slate-400 block">Presupuesto Estimado</span>
                        <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(item.estimatedBudgetCop)}
                        </span>
                        <div className="mt-1">
                          <span className="text-[10px] text-slate-400">Duración: {item.durationMonths} meses</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-500" />
            <span>Información originada directamente de Datos Abiertos de Colombia Compra Eficiente (SECOP II).</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
