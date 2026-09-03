import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Mail, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  Send, 
  Eye, 
  History, 
  Sparkles, 
  AlertCircle, 
  Check, 
  ShieldCheck, 
  Radio, 
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  AlertPreferences, 
  getAlertPreferences, 
  saveAlertPreferences, 
  getAlertsHistory, 
  SentAlertHistoryItem, 
  generateDailyBriefingHtml, 
  triggerTestAlertEmail, 
  MatchedTenderAlertItem 
} from '../services/emailAlertsService';

interface EmailAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  defaultEmail?: string;
  matchedTenders?: MatchedTenderAlertItem[];
}

export const EmailAlertsModal: React.FC<EmailAlertsModalProps> = ({
  isOpen,
  onClose,
  companyName,
  defaultEmail,
  matchedTenders = []
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'preview' | 'history'>('config');
  const [prefs, setPrefs] = useState<AlertPreferences>(() => getAlertPreferences(defaultEmail));
  const [history, setHistory] = useState<SentAlertHistoryItem[]>(() => getAlertsHistory());
  const [isSaved, setIsSaved] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Muestra de procesos compatibles para la vista previa
  const sampleTenders: MatchedTenderAlertItem[] = matchedTenders.length > 0 ? matchedTenders.slice(0, 3) : [
    {
      secopId: 'CO1.REQ.10823900',
      processNumber: 'LP-002-2026',
      title: 'Adquisición de software de analítica y ecosistema de datos institucionales',
      entityName: 'ALCALDÍA MAYOR DE BOGOTÁ',
      department: 'Bogotá D.C.',
      budgetCop: 850000000,
      closingDate: '15 Sep 2026',
      compatibilityScore: 94,
      verdict: 'RECOMMENDED',
      matchedUnspsc: ['81111500', '43230000'],
      processUrl: 'https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index'
    },
    {
      secopId: 'CO1.REQ.10824110',
      processNumber: 'SAM-009-2026',
      title: 'Consultoría e interventoría especializada para aseguramiento de calidad',
      entityName: 'GOBERNACIÓN DE CUNDINAMARCA',
      department: 'Cundinamarca',
      budgetCop: 420000000,
      closingDate: '18 Sep 2026',
      compatibilityScore: 88,
      verdict: 'RECOMMENDED',
      matchedUnspsc: ['80101500'],
      processUrl: 'https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setPrefs(getAlertPreferences(defaultEmail));
      setHistory(getAlertsHistory());
      setIsSaved(false);
      setTestResult(null);
    }
  }, [isOpen, defaultEmail]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveAlertPreferences(prefs);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await triggerTestAlertEmail(companyName, prefs.destinationEmail, sampleTenders);
      setTestResult(res.message);
      setHistory(getAlertsHistory());
    } catch (e: any) {
      setTestResult('Error enviando la prueba.');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-50 via-slate-50 to-indigo-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Alertas Automáticas 24/7 & Vigilancia SECOP II
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  6:30 AM Diario
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recibe en tu correo cada mañana únicamente las licitaciones nuevas que encajan con tu RUP.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex items-center gap-2 px-6 pt-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Configuración de Alertas
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Vista Previa del Email Diario
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historial de Envíos ({history.length})
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* ========================================================================= */}
          {/* PESTAÑA 1: CONFIGURACIÓN */}
          {/* ========================================================================= */}
          {activeTab === 'config' && (
            <div className="space-y-5">
              {/* Switch de activación */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Vigilancia Activa de Licitaciones
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Rastrea automáticamente los procesos de SECOP II y evalúa compatibilidad financiera y RUP.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.enabled}
                    onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Correo de destino */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Correo Electrónico de Notificación
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={prefs.destinationEmail}
                    onChange={(e) => setPrefs({ ...prefs, destinationEmail: e.target.value })}
                    placeholder="ej: licitaciones@miempresa.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400 block">
                  A este correo enviaremos el briefing ejecutivo con los enlaces directos a las ofertas.
                </span>
              </div>

              {/* Frecuencia de envío */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Frecuencia de Notificación
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'daily_6am', title: 'Diario (6:30 AM)', desc: 'Ideal para empezar el día con el radar listo' },
                    { id: 'instant', title: 'Tiempo Real', desc: 'Apenas SECOP publica una compatible' },
                    { id: 'weekly', title: 'Semanal (Lunes)', desc: 'Resumen consolidado de la semana' }
                  ].map((freq) => (
                    <div
                      key={freq.id}
                      onClick={() => setPrefs({ ...prefs, frequency: freq.id as any })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        prefs.frequency === freq.id
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold block">{freq.title}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">{freq.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Umbral de Match */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Umbral Mínimo de Compatibilidad RUP
                  </label>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    &ge; {prefs.minMatchScore}% Match
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {[70, 80, 90].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, minMatchScore: score })}
                      className={`py-2 px-3 rounded-xl border font-bold transition-all ${
                        prefs.minMatchScore === score
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      &ge; {score}% {score === 80 && '(Recomendado)'} {score === 90 && '(Solo Top)'}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Filtra el ruido: No te llegarán procesos donde tu empresa tenga brechas de habilitación grandes.
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 2: VISTA PREVIA DEL CORREO */}
          {/* ========================================================================= */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Previsualización del formato que llegará a <strong>{prefs.destinationEmail}</strong>
                </span>
                <button
                  onClick={handleSendTest}
                  disabled={isSendingTest}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Enviar Prueba al Correo</span>
                </button>
              </div>

              {testResult && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{testResult}</span>
                </div>
              )}

              {/* Renderizado de mockup del correo */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-950 p-4">
                <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                  
                  {/* Encabezado Mockup */}
                  <div className="bg-indigo-900 p-4 text-white">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                      Vigilancia Diaria SECOP II
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">
                      Buenos días, {companyName} ☕
                    </h4>
                    <p className="text-[11px] text-indigo-200">
                      Hoy encontramos {sampleTenders.length} procesos con más del {prefs.minMatchScore}% de afinidad con tu RUP.
                    </p>
                  </div>

                  {/* Listado Mockup */}
                  <div className="p-3 space-y-2.5">
                    {sampleTenders.map((t, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                            {t.compatibilityScore}% Match
                          </span>
                          <span className="text-[10px] text-slate-400">{t.department}</span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{t.title}</p>
                        <p className="text-[11px] text-slate-500">{t.entityName}</p>
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <strong className="text-emerald-600">${(t.budgetCop / 1000000).toFixed(0)}M COP</strong>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Ver Pliego &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 3: HISTORIAL DE ENVÍOS */}
          {/* ========================================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Historial de Briefings y Alertas Despachadas
              </h4>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Fecha y Hora</th>
                      <th className="py-2.5 px-3">Destinatario</th>
                      <th className="py-2.5 px-3">Licitaciones Enviadas</th>
                      <th className="py-2.5 px-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-200">
                          {new Date(h.sentAt).toLocaleString('es-CO')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {h.recipient}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                          {h.matchedCount} convocatorias
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <Check className="w-3 h-3" /> Entregado
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ¡Preferencias Guardadas!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              Guardar Configuración
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
