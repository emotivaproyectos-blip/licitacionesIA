import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Clock, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Scale, 
  Info, 
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Tag,
  Building2,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  addBusinessDays, 
  countBusinessDaysBetween, 
  BusinessDaysCalculationResult, 
  ColombianHoliday,
  getColombianHolidays 
} from '../../services/businessDaysColombia';
import { 
  searchUnspscCodes, 
  UnspscCodeItem, 
  COMMON_UNSPSC_DATABASE 
} from '../../services/unspscService';

interface FreeProcurementToolsSectionProps {
  onEnterDashboard: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const FreeProcurementToolsSection: React.FC<FreeProcurementToolsSectionProps> = ({
  onEnterDashboard,
  onOpenAuth
}) => {
  const [activeTool, setActiveTool] = useState<'calendar' | 'unspsc'>('calendar');

  // Estado de la Calculadora de Días Hábiles
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [calcMode, setCalcMode] = useState<'add' | 'between'>('add');
  const [startDate, setStartDate] = useState(todayStr);
  const [daysToAdd, setDaysToAdd] = useState(3);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const calcResult: BusinessDaysCalculationResult = useMemo(() => {
    try {
      if (calcMode === 'add') {
        return addBusinessDays(startDate, Math.max(1, daysToAdd));
      } else {
        return countBusinessDaysBetween(startDate, endDate);
      }
    } catch (e) {
      return addBusinessDays(todayStr, 3);
    }
  }, [calcMode, startDate, daysToAdd, endDate, todayStr]);

  // Estado del Buscador UNSPSC
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const unspscResults = useMemo(() => {
    let list = searchUnspscCodes(searchQuery);
    if (selectedCategory !== 'todos') {
      list = list.filter(item => item.segment.toLowerCase().includes(selectedCategory.toLowerCase()));
    }
    return list;
  }, [searchQuery, selectedCategory]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div id="herramientas-gratuitas" className="py-20 px-6 max-w-6xl mx-auto">
      
      {/* Encabezado de la sección */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 dark:border-indigo-500/40 bg-indigo-500/10 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Herramientas Gratuitas de Entrada</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Calculadoras y Utilidades para <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400">
            Licitadores en Colombia
          </span>
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium">
          Diseñadas según el régimen contractual de la <strong>Ley 80 de 1993</strong> y las tablas oficiales de <strong>Colombia Compra Eficiente</strong>. De libre acceso, sin registro previo.
        </p>
      </div>

      {/* Switcher de Herramientas */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex gap-2 shadow-inner">
          <button
            onClick={() => setActiveTool('calendar')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTool === 'calendar'
                ? 'bg-white dark:bg-indigo-600 text-indigo-900 dark:text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calculadora de Días Hábiles (Ley Emiliani)</span>
          </button>
          <button
            onClick={() => setActiveTool('unspsc')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTool === 'unspsc'
                ? 'bg-white dark:bg-indigo-600 text-indigo-900 dark:text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Buscador de Códigos UNSPSC para RUP</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HERRAMIENTA 1: CALCULADORA DE DÍAS HÁBILES */}
      {/* ========================================================================= */}
      {activeTool === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xl space-y-8 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Panel de Entradas */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Scale className="w-4 h-4 text-indigo-500" />
                <span>Modalidad de Cálculo de Términos</span>
              </div>

              {/* Selector de modo */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCalcMode('add')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    calcMode === 'add'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-950 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sumar Días de Plazo
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode('between')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    calcMode === 'between'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-950 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Días entre Dos Fechas
                </button>
              </div>

              {/* Botones de presets rápidos para SECOP */}
              {calcMode === 'add' && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Términos Comunes en Contratación Estatal:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '3 Días (Subsanación Pliegos)', val: 3 },
                      { label: '5 Días (Observaciones Evaluación)', val: 5 },
                      { label: '10 Días (Manifestación Interés)', val: 10 }
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setDaysToAdd(preset.val)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                          daysToAdd === preset.val
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Campos de Fecha */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Publicación / Notificación del Acto
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    *El cómputo de términos inicia el día hábil siguiente según el Código de Procedimiento Administrativo.
                  </span>
                </div>

                {calcMode === 'add' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Número de Días Hábiles Otorgados
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={daysToAdd}
                      onChange={(e) => setDaysToAdd(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha Límite / Cierre de Ofertas
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Panel de Resultados */}
            <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
              
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-1 uppercase tracking-wider">
                  Resultado Jurídico Verificado
                </span>
                
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-xs text-slate-500 block">
                    {calcMode === 'add' ? 'Fecha y Hora Límite para Radicar en SECOP:' : 'Plazo Real Disponible:'}
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {calcMode === 'add' ? calcResult.targetDate : `${calcResult.businessDaysCount} Días Hábiles`}
                  </div>
                  {calcMode === 'add' && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                      Hasta las 23:59:59 horas del día límite (o la hora fijada en el cronograma)
                    </span>
                  )}
                </div>
              </div>

              {/* Desglose de días */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Días Hábiles</span>
                  <strong className="text-base text-indigo-600 dark:text-indigo-400">
                    {calcResult.businessDaysCount}
                  </strong>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Días Calendario</span>
                  <strong className="text-base text-slate-700 dark:text-slate-300">
                    {calcResult.calendarDaysCount}
                  </strong>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Fines de Semana</span>
                  <strong className="text-base text-slate-700 dark:text-slate-300">
                    {calcResult.weekendDaysEncountered}
                  </strong>
                </div>
              </div>

              {/* Festivos cruzados */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
                <strong className="text-amber-800 dark:text-amber-300 block mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Festivos Colombianos en el Período ({calcResult.holidaysEncountered.length}):
                </strong>
                {calcResult.holidaysEncountered.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5 text-amber-900 dark:text-amber-200">
                    {calcResult.holidaysEncountered.map((h, i) => (
                      <li key={i}><strong>{h.dateString}:</strong> {h.name}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-amber-700 dark:text-amber-400">No se cruzan días festivos oficiales en este intervalo.</span>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Marco: Ley 51 de 1983 &bull; Ley 80 de 1993</span>
                <button
                  onClick={onEnterDashboard}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Auditar Pliego Completo con IA &rarr;
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* HERRAMIENTA 2: BUSCADOR DE CÓDIGOS UNSPSC */}
      {/* ========================================================================= */}
      {activeTool === 'unspsc' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-300">
          
          {/* Barra de Búsqueda */}
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca por palabra clave (ej: software, obras, consultoría, salud) o código (ej: 81111500)..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
              />
            </div>

            {/* Filtros rápidos por segmento */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filtrar:
              </span>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'ingeniería', label: 'Software & TI' },
                { id: 'construcción', label: 'Construcción & Obras' },
                { id: 'gestión', label: 'Consultoría' },
                { id: 'transporte', label: 'Logística' },
                { id: 'salud', label: 'Salud' },
                { id: 'defensa', label: 'Seguridad' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full border text-[11px] font-bold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla de Resultados UNSPSC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {unspscResults.map((item) => (
              <div
                key={item.code}
                className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-indigo-400 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      {item.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(item.code)}
                      className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                      {copiedCode === item.code ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode === item.code ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <strong>Segmento:</strong> {item.segment}
                  </p>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Actividades Incluidas:</span>
                    <p>{item.examples}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Colombia Compra Eficiente</span>
                  <button
                    onClick={onEnterDashboard}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Ver Licitaciones Activas &rarr;
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Banner de Conversión Lead Magnet hacia LicitIA */}
      <div className="mt-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-center sm:text-left">
          <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
            ¿Quieres saber si tu empresa cumple?
          </span>
          <h4 className="text-2xl font-black">Audita tu Certificado RUP en 15 Segundos</h4>
          <p className="text-xs text-indigo-200 font-medium max-w-xl">
            Sube tu PDF del RUP para extraer tus códigos UNSPSC, calcular tu liquidez y endeudamiento, y ver qué licitaciones de SECOP II cumplen tu capacidad al 100%.
          </p>
        </div>
        <button
          onClick={onEnterDashboard}
          className="px-8 py-3.5 rounded-full bg-white text-indigo-950 font-black text-xs sm:text-sm hover:bg-slate-100 transition-all shadow-xl flex items-center gap-2 cursor-pointer shrink-0 hover:scale-105"
        >
          <span>Auditar mi RUP Gratis</span>
          <ArrowRight className="w-4 h-4 text-indigo-600" />
        </button>
      </div>

    </div>
  );
};
