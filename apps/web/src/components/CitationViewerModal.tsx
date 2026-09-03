import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  ShieldCheck, 
  BookOpen, 
  Check, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  Scale, 
  Bookmark, 
  Search,
  Highlighter,
  ArrowRight
} from 'lucide-react';

export interface RequirementCitation {
  title: string;
  criterion: string;
  document: string;
  chapter: string;
  numeral: string;
  page: number;
  snippet: string;
  verifiedLegalBasis: string;
  processNumber?: string;
  entityName?: string;
  secopUrl?: string;
}

interface CitationViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: RequirementCitation | null;
}

export const CitationViewerModal: React.FC<CitationViewerModalProps> = ({
  isOpen,
  onClose,
  citation
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !citation) return null;

  const handleCopy = () => {
    const textToCopy = `"${citation.snippet}"\n\nFuente: ${citation.document} - ${citation.chapter}, ${citation.numeral} (Pág. ${citation.page})\nMarco Jurídico: ${citation.verifiedLegalBasis}\nProceso: ${citation.processNumber || 'SECOP II'} - ${citation.entityName || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header con gradiente */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cita & Fuente Verificada en Pliego
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Auditado 100%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evidencia textual extraída directamente del expediente contractual oficial.
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

        {/* Contenido */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* Tarjeta de Metadatos de la Cita */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Criterio</span>
              <strong className="text-slate-900 dark:text-slate-100 truncate block mt-0.5" title={citation.criterion}>
                {citation.criterion}
              </strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Página Oficial</span>
              <strong className="text-indigo-600 dark:text-indigo-400 text-sm block mt-0.5">
                Página {citation.page}
              </strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-2">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Documento Fuente</span>
              <strong className="text-slate-900 dark:text-slate-100 truncate block mt-0.5" title={citation.document}>
                {citation.document}
              </strong>
            </div>
          </div>

          {/* Numeral y Capítulo */}
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Bookmark className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>
              <strong>Ubicación:</strong> {citation.chapter} &bull; <strong>{citation.numeral}</strong>
            </span>
          </div>

          {/* Fragmento Textual con Efecto de Resaltador */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                Fragmento Textual Extraído del Pliego (Verbatim)
              </span>
              <span className="text-[11px] text-slate-400">Texto original del pliego</span>
            </div>

            <div className="relative p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-slate-800 dark:text-slate-200 font-serif leading-relaxed text-sm shadow-inner">
              <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-sans font-bold bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                <FileText className="w-3 h-3" /> Pág. {citation.page}
              </div>
              <p className="italic pr-12">
                &ldquo;{citation.snippet}&rdquo;
              </p>
            </div>
          </div>

          {/* Marco Normativo y Fundamento Jurídico */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Scale className="w-3.5 h-3.5 text-indigo-500" />
              <span>Fundamento Normativo (Colombia Compra Eficiente):</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
              {citation.verifiedLegalBasis}
            </p>
          </div>

          {/* Proceso Relacionado */}
          {citation.processNumber && (
            <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Proceso: <strong>{citation.processNumber}</strong></span>
              {citation.entityName && <span className="truncate max-w-[250px]">{citation.entityName}</span>}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Cita Copiada!' : 'Copiar Cita Jurídica'}</span>
          </button>

          <div className="flex items-center gap-2">
            {citation.secopUrl && (
              <a
                href={citation.secopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1"
              >
                <span>Ver Pliego en SECOP</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
