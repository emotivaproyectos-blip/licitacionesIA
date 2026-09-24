import React, { useState } from 'react';
import { 
  X, 
  Headphones, 
  Send, 
  Mail, 
  Check, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  Building2, 
  Phone, 
  MessageSquare,
  Sparkles,
  HelpCircle,
  FileQuestion,
  Wrench,
  Users
} from 'lucide-react';

const SUPPORT_EMAIL = 'emotivaproyectos@gmail.com';
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'https://emotiva-licitia-api.onrender.com';

interface SupportHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  companyNit?: string;
  userEmail?: string;
}

const CATEGORIES = [
  { id: 'licitacion', label: 'Asesoría en un Pliego o Licitación', icon: FileQuestion },
  { id: 'consorcios', label: 'Consorcios & Uniones Temporales', icon: Users },
  { id: 'tecnico', label: 'Inconveniente Técnico en la Plataforma', icon: Wrench },
  { id: 'planes', label: 'Planes, Facturación o Suscripción', icon: Sparkles },
  { id: 'otro', label: 'Otra Consulta o Requerimiento', icon: HelpCircle },
];

export const SupportHelpModal: React.FC<SupportHelpModalProps> = ({
  isOpen,
  onClose,
  companyName,
  companyNit = '',
  userEmail = ''
}) => {
  const [category, setCategory] = useState('licitacion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [senderEmail, setSenderEmail] = useState(userEmail || '');
  const [phone, setPhone] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentCategoryObj = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  const fullEmailSubject = `[Ayuda LicitIA - ${currentCategoryObj.label}] ${subject || 'Consulta'} - ${companyName || 'Empresa'}`;

  const fullEmailBody = `SOLICITUD DE ASISTENCIA Y SOPORTE TÉCNICO - EMOTIVA LICITIA
=============================================================
Empresa / Razón Social: ${companyName || 'No especificada'}
NIT: ${companyNit || 'No especificado'}
Correo de respuesta: ${senderEmail || 'No especificado'}
Teléfono / WhatsApp: ${phone || 'No especificado'}
Tipo de ayuda solicitada: ${currentCategoryObj.label}

ASUNTO:
${subject || 'Sin asunto'}

DETALLE DEL MENSAJE / CONSULTA:
${message || 'Sin mensaje adicional'}

=============================================================
Destino oficial de atención: ${SUPPORT_EMAIL}
Enviado desde el Centro de Ayuda de Emotiva LicitIA
`;

  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(fullEmailSubject)}&body=${encodeURIComponent(fullEmailBody)}`;
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}&su=${encodeURIComponent(fullEmailSubject)}&body=${encodeURIComponent(fullEmailBody)}`;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(fullEmailBody);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Por favor escribe el detalle de tu consulta antes de enviar.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Registro en backend (no bloqueante)
      fetch(`${API_BASE_URL}/api/v1/support/send-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName || 'Empresa',
          company_nit: companyNit || '',
          sender_email: senderEmail || 'cliente@licitia.co',
          phone: phone || '',
          subject: subject || 'Consulta general',
          message: message,
          category: currentCategoryObj.label
        })
      }).catch(err => console.warn('Backend support endpoint warning:', err));

      // 2. Disparar el cliente de correo oficial a emotivaproyectos@gmail.com
      const mailtoLink = document.createElement('a');
      mailtoLink.href = mailtoUrl;
      mailtoLink.target = '_blank';
      mailtoLink.rel = 'noopener noreferrer';
      document.body.appendChild(mailtoLink);
      mailtoLink.click();
      document.body.removeChild(mailtoLink);

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error al preparar envío:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-7 space-y-5 overflow-y-auto max-h-[92vh] relative">
        
        {/* ENCABEZADO MODAL */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 flex-shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-full border border-blue-200">
                  CANAL OFICIAL DE ATENCIÓN
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Activo
                </span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mt-0.5">
                Centro de Ayuda & Soporte LicitIA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Envía tus consultas directamente a nuestro equipo especializado en compras públicas.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TARJETA DEL CORREO DESTINO */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Correo de destino oficial:</span>
              <span className="text-xs sm:text-sm font-extrabold text-blue-900 dark:text-blue-200 tracking-tight">
                {SUPPORT_EMAIL}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Copiar dirección de correo"
            >
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmail ? '¡Copiado!' : 'Copiar Correo'}</span>
            </button>
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Abrir en Gmail Web"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Gmail</span>
            </a>
          </div>
        </div>

        {/* MENSAJE DE ÉXITO TRAS ENVIAR */}
        {isSubmitted && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 space-y-2 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>¡Solicitud enviada a {SUPPORT_EMAIL}!</span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Hemos preparado y remitido tu mensaje. Si tu cliente de correo se abrió, solo dale a <strong>Enviar</strong> para confirmar el despacho. Nuestro equipo de soporte te responderá directamente a <strong>{senderEmail || 'tu correo'}</strong> a la mayor brevedad.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={gmailWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Confirmar y Enviar en Gmail</span>
              </a>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
              >
                {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMessage ? 'Mensaje Copiado' : 'Copiar Texto'}</span>
              </button>
            </div>
          </div>
        )}

        {/* FORMULARIO DE MENSAJE DIRECTO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* TIPO DE CONSULTA */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
              ¿Sobre qué tema necesitas ayuda?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DATOS DE LA EMPRESA Y CONTACTO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Empresa / Razón Social
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={companyName}
                  readOnly
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 dark:text-slate-300 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Tu Correo para Responderte
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="ej: contacto@tuempresa.com"
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ASUNTO Y TELÉFONO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Asunto de la Consulta
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Duda sobre pliego de licitación CO1.REQ.1082..."
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Teléfono / WhatsApp (Opcional)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="300 123 4567"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* CUERPO DEL MENSAJE */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
              ¿En qué podemos ayudarte? Describe detalladamente tu requerimiento:
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe aquí tu consulta, número de proceso SECOP, duda sobre la plataforma, pliegos o asistencia requerida..."
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none"
            />
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Se despachará a: <strong>{SUPPORT_EMAIL}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Cerrar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Enviando...' : 'Enviar Mensaje de Ayuda'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
