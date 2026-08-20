import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  CheckCircle2, 
  Printer, 
  Archive, 
  ExternalLink, 
  FileCheck, 
  Layers, 
  FileSpreadsheet, 
  HelpCircle,
  Building2,
  DollarSign,
  Share2,
  Sparkles,
  Loader2,
  SendHorizontal,
  ArrowRight,
  UploadCloud,
  Paperclip,
  Check,
  Trash2
} from 'lucide-react';
import { 
  CompanyData, 
  TenderData, 
  generateLetterOfOffer, 
  generateFinancialMatrix, 
  generateChecklistDoc, 
  generateEconomicProposal, 
  generateDossierZip, 
  triggerFileDownload 
} from '../services/dossierGenerator';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyData;
  tender: TenderData;
  signedLetter?: File | null;
  onSignedLetterChange?: (file: File | null) => void;
  onStartSubmission?: () => void;
}

type DocKey = 'letter' | 'matrix' | 'checklist' | 'economy';

export const DossierModal: React.FC<DossierModalProps> = ({
  isOpen,
  onClose,
  company,
  tender,
  signedLetter,
  onSignedLetterChange,
  onStartSubmission
}) => {
  const [activeDoc, setActiveDoc] = useState<DocKey>('letter');
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const handleSignedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (onSignedLetterChange) {
        onSignedLetterChange(file);
      }
    }
  };

  const handleRemoveSignedFile = () => {
    if (onSignedLetterChange) {
      onSignedLetterChange(null);
    }
  };

  const docFiles: Record<DocKey, { title: string; filename: string; getHtml: () => string; icon: React.ReactNode; badge: string }> = {
    letter: {
      title: signedLetter ? 'Anexo 1 - Carta Firmada (Oficial)' : 'Anexo 1 - Carta de Presentación',
      filename: signedLetter ? `01_Anexo_1_Carta_Firmada_${signedLetter.name}` : `01_Anexo_1_Carta_Presentacion_${tender.process_number}.doc`,
      getHtml: () => generateLetterOfOffer(company, tender),
      icon: <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      badge: signedLetter ? '✓ Firmada' : 'Obligatorio (Falta Firma)'
    },
    matrix: {
      title: 'Matriz Financiera & RUP',
      filename: `02_Matriz_Financiera_RUP_${tender.process_number}.doc`,
      getHtml: () => generateFinancialMatrix(company, tender),
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      badge: 'Habilitante'
    },
    checklist: {
      title: 'Checklist de Documentos',
      filename: `03_Checklist_Habilitantes_${tender.process_number}.doc`,
      getHtml: () => generateChecklistDoc(company, tender),
      icon: <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      badge: 'Verificación'
    },
    economy: {
      title: 'Propuesta Económica',
      filename: `04_Propuesta_Economica_${tender.process_number}.doc`,
      getHtml: () => generateEconomicProposal(company, tender),
      icon: <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      badge: 'Económico'
    }
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const signedInfo = signedLetter ? { file: signedLetter, name: signedLetter.name } : null;
      const blob = await generateDossierZip(company, tender, signedInfo);
      const zipName = `Expediente_${tender.process_number.replace(/[^a-zA-Z0-9_-]/g, '_')}_${company.name.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
      triggerFileDownload(blob, zipName);
    } catch (err) {
      console.error('Error al generar el ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadCurrentDoc = () => {
    if (activeDoc === 'letter' && signedLetter) {
      triggerFileDownload(signedLetter, signedLetter.name);
      return;
    }
    const current = docFiles[activeDoc];
    const content = current.getHtml();
    const mimeType = 'application/msword;charset=utf-8';
    const blob = new Blob([content], { type: mimeType });
    triggerFileDownload(blob, current.filename);
  };

  const handlePrintCurrentDoc = () => {
    const current = docFiles[activeDoc];
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(current.getHtml());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ENCABEZADO DEL MODAL */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Expediente de Postulación Oficial
                </h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                  tender.source_platform === 'SECOP_I'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                }`}>
                  {tender.source_platform.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Proceso: <span className="font-semibold text-slate-800 dark:text-slate-200">{tender.process_number}</span> • Postulante: <span className="font-semibold text-slate-800 dark:text-slate-200">{company.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* BOTÓN RADICACIÓN ASISTIDA DIRECTA */}
            {onStartSubmission && (
              <button
                onClick={() => {
                  onClose();
                  onStartSubmission();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
              >
                <SendHorizontal className="w-4 h-4" />
                <span>Radicar Oferta en SECOP</span>
              </button>
            )}

            {/* BOTÓN DESCARGAR EXPEDIENTE COMPLETO ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Comprimiendo ZIP...</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>Descargar Expediente (.ZIP)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CUERPO DEL MODAL (LISTA DE DOCUMENTOS + PREVISUALIZADOR) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* PANEL LATERAL DE DOCUMENTOS (4 COLS) */}
          <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-2 overflow-y-auto">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-2">
              Documentos del Expediente (4)
            </p>

            {(Object.keys(docFiles) as DocKey[]).map((key) => {
              const doc = docFiles[key];
              const isSelected = activeDoc === key;

              return (
                <button
                  key={key}
                  onClick={() => setActiveDoc(key)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-white/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      {doc.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {doc.filename}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${
                    key === 'letter' && signedLetter 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300'
                      : key === 'letter'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {doc.badge}
                  </span>
                </button>
              );
            })}

            {/* CAJA INFORMATIVA DE RADICACIÓN DIRECTA */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs mt-4 space-y-2">
              <p className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Postulación Asistida
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                El aplicativo radicará el expediente automáticamente ante la entidad contratante.
              </p>
              {onStartSubmission && (
                <button
                  onClick={() => {
                    onClose();
                    onStartSubmission();
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors mt-1"
                >
                  <span>Postularse en 1 Clic</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* PREVISUALIZADOR DEL DOCUMENTO ACTIVO (8 COLS) */}
          <div className="md:col-span-8 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
            
            {/* BARRA DE HERRAMIENTAS DE PREVISUALIZACIÓN */}
            <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {docFiles[activeDoc].title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({docFiles[activeDoc].filename})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrintCurrentDoc}
                  title="Imprimir / Guardar como PDF"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  onClick={handleDownloadCurrentDoc}
                  title="Descargar este documento"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
              </div>
            </div>

            {/* ZONA DE CARGA DE CARTA FIRMADA */}
            {activeDoc === 'letter' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                {signedLetter ? (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-600 text-white font-bold">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-300">
                          Carta de Presentación Oficial Firmada: <span className="underline">{signedLetter.name}</span>
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Este archivo firmado sustituye la plantilla base y se incluirá en el paquete ZIP y en la radicación.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <label className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-100 cursor-pointer">
                        <span>Cambiar Archivo</span>
                        <input type="file" onChange={handleSignedFileUpload} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" />
                      </label>

                      <button
                        onClick={handleRemoveSignedFile}
                        title="Eliminar archivo firmado y volver al borrador del sistema"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-600 text-white font-bold">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          Requisito Obligatorio: Adjuntar Carta de Presentación Firmada
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Para confirmar y radicar la oferta ante la entidad, debes adjuntar este documento firmado por el Representante Legal (PDF / Word / Imagen).
                        </p>
                      </div>
                    </div>

                    <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors flex items-center gap-1.5 flex-shrink-0">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Adjuntar Carta Firmada</span>
                      <input type="file" onChange={handleSignedFileUpload} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* VISTA PREVIA DEL DOCUMENTO EN TIEMPO REAL */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-100/50 dark:bg-slate-900/20">
              <div className="max-w-3xl mx-auto bg-white text-slate-900 shadow-md border border-slate-200 rounded-lg p-8 min-h-[600px]">
                <div 
                  dangerouslySetInnerHTML={{ __html: docFiles[activeDoc].getHtml() }} 
                />
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
