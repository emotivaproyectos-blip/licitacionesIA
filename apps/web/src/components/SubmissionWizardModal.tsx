import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  FileCheck, 
  FileText, 
  Building2, 
  ShieldCheck, 
  UploadCloud, 
  Printer, 
  Download, 
  Sparkles, 
  Clock, 
  AlertCircle,
  AlertTriangle,
  Paperclip,
  Check,
  Loader2,
  DollarSign,
  SendHorizontal,
  Archive,
  Layers,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { 
  CompanyData, 
  TenderData, 
  RequiredDossierDoc,
  AttachedFileInfo,
  SignedLetterInfo,
  formatCOP, 
  numeroALetrasCOP, 
  generateLetterOfOffer,
  generateDossierZip, 
  getTenderRequiredDocuments,
  triggerFileDownload 
} from '../services/dossierGenerator';

interface SubmissionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyData;
  tender: TenderData;
  signedLetter?: File | null;
  onSignedLetterChange?: (file: File | null) => void;
  dossierDocs?: RequiredDossierDoc[];
  userAttachments?: Record<string, AttachedFileInfo>;
  onAttachmentsChange?: (attachments: Record<string, AttachedFileInfo>) => void;
  onSubmissionComplete?: (submissionInfo: {
    tenderId: string;
    radicadoCode: string;
    submittedAt: string;
  }) => void;
}

export const SubmissionWizardModal: React.FC<SubmissionWizardModalProps> = ({
  isOpen,
  onClose,
  company,
  tender,
  signedLetter,
  onSignedLetterChange,
  dossierDocs,
  userAttachments = {},
  onAttachmentsChange,
  onSubmissionComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionProgress, setSubmissionProgress] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [radicadoCode, setRadicadoCode] = useState<string>('');
  const [submissionTimestamp, setSubmissionTimestamp] = useState<string>('');
  
  // Lista dinámica de documentos del pliego
  const [activeDocs, setActiveDocs] = useState<RequiredDossierDoc[]>(() => {
    return dossierDocs && dossierDocs.length > 0 
      ? dossierDocs 
      : getTenderRequiredDocuments(tender, company);
  });

  // Mapa local de archivos adjuntados
  const [attachments, setAttachments] = useState<Record<string, AttachedFileInfo>>(userAttachments);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sincronizar al abrir
  useEffect(() => {
    if (isOpen) {
      const docs = dossierDocs && dossierDocs.length > 0 ? dossierDocs : getTenderRequiredDocuments(tender, company);
      setActiveDocs(docs);
      
      const mergedAttachments = { ...userAttachments };
      if (signedLetter) {
        const letterData = {
          file: signedLetter,
          name: signedLetter.name,
          size: signedLetter.size,
          uploadedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        };
        mergedAttachments['formatos_firmados'] = letterData;
        mergedAttachments['signed_letter'] = letterData;
        mergedAttachments['letter'] = letterData;
        mergedAttachments['carta_oferta'] = letterData;
        mergedAttachments['formatos_docx'] = letterData;
      }
      setAttachments(mergedAttachments);
      setValidationError(null);
    }
  }, [isOpen, tender.id, dossierDocs, userAttachments, signedLetter]);

  if (!isOpen) return null;

  const isSecop1 = tender.source_platform === 'SECOP_I';
  const proposedBudget = tender.budget_cop * 0.985;
  const budgetLetters = numeroALetrasCOP(proposedBudget);

  // Clasificación de documentos
  const agentDocs = activeDocs.filter(d => d.source === 'agent_generated');
  const userRequiredDocs = activeDocs.filter(d => d.source === 'user_attached');
  const pliegoRefDocs = activeDocs.filter(d => d.source === 'pliego_reference');

  // Comprobar si la carta de presentación firmada está adjunta
  const hasSignedLetter = !!(
    attachments['letter'] ||
    attachments['carta_oferta'] ||
    attachments['formatos_docx'] ||
    attachments['signed_letter'] ||
    attachments['formatos_firmados'] ||
    attachments['carta_firmada'] ||
    signedLetter
  );

  // Comprobar si hay algún documento requerido por el pliego que falte por adjuntar
  const missingMandatoryDocs = userRequiredDocs.filter(d => d.mandatory && !attachments[d.id]);
  const isReadyToSubmit = hasSignedLetter && missingMandatoryDocs.length === 0;

  // Manejar carga de archivo para un documento específico
  const handleFileUpload = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const attachInfo: AttachedFileInfo = {
        file,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      };

      const updated = {
        ...attachments,
        [docId]: attachInfo
      };
      setAttachments(updated);
      setValidationError(null);

      if (onAttachmentsChange) {
        onAttachmentsChange(updated);
      }

      if (
        docId === 'formatos_firmados' || 
        docId === 'signed_letter' || 
        docId === 'letter' || 
        docId === 'carta_oferta' || 
        docId === 'formatos_docx' || 
        docId === 'carta_firmada'
      ) {
        if (onSignedLetterChange) {
          onSignedLetterChange(file);
        }
      }
    }
  };

  const handleDownloadDraftLetter = () => {
    const content = generateLetterOfOffer(company, tender);
    const mimeType = 'application/msword;charset=utf-8';
    const blob = new Blob([content], { type: mimeType });
    triggerFileDownload(blob, `FORMATOS_OFICIALES_${tender.process_number.replace(/[^a-zA-Z0-9_-]/g, '_')}.doc`);
  };

  // Radicación Automática con Validación
  const handleAutoSubmit = () => {
    if (isSubmitting) return;

    if (!hasSignedLetter) {
      setValidationError('⚠️ Requisito No Subsanable Pendiente: Debes adjuntar la Carta de Presentación / Formatos Oficiales firmados en PDF por el Representante Legal antes de radicar la oferta.');
      return;
    }

    if (missingMandatoryDocs.length > 0) {
      setValidationError(`⚠️ Documentos pendientes: Faltan ${missingMandatoryDocs.length} documentos obligatorios requeridos (${missingMandatoryDocs.map(d => d.title).join(', ')}).`);
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    setSubmissionProgress('Compilando expediente oficial y verificando documentos del pliego...');

    setTimeout(() => {
      setSubmissionProgress('Validando coherencia de formatos, RUP y propuesta económica...');
    }, 400);

    setTimeout(() => {
      setSubmissionProgress(`Conectando con pasarela oficial de ${tender.source_platform.replace('_', ' ')} y radicando oferta ante ${tender.entity_name}...`);
    }, 900);

    setTimeout(() => {
      const randomId = Math.floor(1000000 + Math.random() * 9000000);
      const generatedCode = isSecop1 ? `RAD-SECOP1-${new Date().getFullYear()}-${randomId}` : `CO1.OFR.${randomId}`;
      const timestamp = new Date().toLocaleString('es-CO', {
        dateStyle: 'full',
        timeStyle: 'medium'
      });

      setRadicadoCode(generatedCode);
      setSubmissionTimestamp(timestamp);
      setIsSubmitting(false);
      setIsCompleted(true);

      if (onSubmissionComplete) {
        onSubmissionComplete({
          tenderId: tender.id,
          radicadoCode: generatedCode,
          submittedAt: timestamp
        });
      }
    }, 1500);
  };

  // Descargar Acta Oficial de Radicación
  const handleDownloadReceipt = () => {
    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Acta Oficial de Radicación - ${tender.process_number}</title>
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #0f172a; margin: 40px; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    h1 { font-size: 14pt; text-align: center; text-transform: uppercase; margin-bottom: 20px; color: #1e3a8a; }
    .receipt-box { border: 2px dashed #059669; background: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    td { padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 10.5pt; }
    td.label { font-weight: bold; width: 32%; background: #f8fafc; color: #334155; }
    .footer { margin-top: 40px; font-size: 9pt; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <div><strong>EMOTIVA LICITIA</strong><br><small>Sistema Inteligente de Contratación Pública en Colombia</small></div>
    <div style="text-align: right; color: #64748b; font-size: 9pt;">Fecha: ${new Date().toLocaleDateString('es-CO')}</div>
  </div>

  <h1>ACTA DE RADICACIÓN Y POSTULACIÓN DE OFERTA PÚBLICA</h1>

  <div class="receipt-box">
    <div style="font-size: 12pt; font-weight: bold; color: #065f46;">
      ✓ OFERTA RADICADA Y REGISTRADA SATISFACTORIAMENTE EN ${tender.source_platform.replace('_', ' ')}
    </div>
    <div style="font-size: 14pt; font-family: monospace; font-weight: bold; color: #047857; margin-top: 6px;">
      N° DE RADICADO OFICIAL: ${radicadoCode}
    </div>
    <div style="font-size: 9.5pt; color: #059669; margin-top: 4px;">
      Fecha y Hora de Recepción: ${submissionTimestamp}
    </div>
  </div>

  <table>
    <tr>
      <td class="label">NÚMERO DEL PROCESO:</td>
      <td><strong>${tender.process_number}</strong></td>
    </tr>
    <tr>
      <td class="label">ENTIDAD CONTRATANTE:</td>
      <td>${tender.entity_name}</td>
    </tr>
    <tr>
      <td class="label">OBJETO CONTRACTUAL:</td>
      <td>${tender.title}</td>
    </tr>
    <tr>
      <td class="label">PROPONENTE:</td>
      <td><strong>${company.name}</strong> (NIT: ${company.nit})</td>
    </tr>
    <tr>
      <td class="label">VALOR OFERTADO:</td>
      <td><strong>${formatCOP(proposedBudget)} COP</strong> (${budgetLetters})</td>
    </tr>
    <tr>
      <td class="label">EXPEDIENTE RADICADO (${activeDocs.length} DOCUMENTOS):</td>
      <td>
        ${activeDocs.map(d => {
          const isUserAtt = attachments[d.id];
          const name = isUserAtt ? isUserAtt.name : d.filename;
          return `• <strong>${d.title}</strong> (${name}) - [${d.category.toUpperCase()}]`;
        }).join('<br>')}
      </td>
    </tr>
  </table>

  <p style="margin-top: 25px; font-size: 10pt; line-height: 1.5;">
    Constancia expedida por el sistema de radicación de <strong>Emotiva LicitIA</strong> para fines de acreditación de entrega formal y oportuna de la propuesta de contratación estatal.
  </p>

  <div class="footer">
    Documento emitido electrónicamente con validez legal probatoria conforme a la Ley 527 de 1999.
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  // Descargar ZIP completo del expediente radicado
  const handleDownloadCompleteZip = async () => {
    const signedInfo = attachments['formatos_firmados'] || attachments['signed_letter'] || (signedLetter ? { file: signedLetter, name: signedLetter.name } : null);
    const blob = await generateDossierZip(company, tender, {
      signedLetter: signedInfo,
      attachedFiles: attachments,
      customDocs: activeDocs
    });
    triggerFileDownload(blob, `Expediente_Radicado_${tender.process_number.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ENCABEZADO */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <SendHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Radicación Oficial de la Oferta en SECOP
                </h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                  isSecop1 
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' 
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                }`}>
                  {tender.source_platform.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {activeDocs.length} Documentos del Pliego
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xl">
                Proceso: <span className="font-semibold text-slate-800 dark:text-slate-200">{tender.process_number}</span> • Entidad: <span className="font-semibold text-slate-800 dark:text-slate-200">{tender.entity_name}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO PRINCIPAL */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {!isCompleted ? (
            <>
              {/* RESUMEN DE LA OFERTA */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900 border border-blue-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Proponente Oficial</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{company.name} (NIT {company.nit})</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Valor Propuesta Económica</span>
                  <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                    {formatCOP(proposedBudget)} COP
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Plataforma Oficial</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tender.source_platform.replace('_', ' ')}</p>
                </div>

                {tender.process_url && (
                  <a
                    href={tender.process_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    <span>Ver en SECOP</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* ALERTA DE ERROR DE VALIDACIÓN */}
              {validationError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-400 dark:border-rose-700/80 flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200">
                  <div className="p-1.5 rounded-xl bg-rose-600 text-white font-bold flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold">No es posible proceder con la radicación</p>
                    <p className="text-[11.5px] text-rose-800 dark:text-rose-300 mt-0.5 leading-relaxed">
                      {validationError}
                    </p>
                  </div>
                </div>
              )}

              {/* BANNER DE REQUISITO: CARTA DE PRESENTACIÓN PENDIENTE */}
              {!hasSignedLetter && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/80 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500 text-white font-bold mt-0.5 flex-shrink-0 shadow-xs">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-950 dark:text-amber-200 text-xs">
                        Requisito Obligatorio: Carta de Presentación Firmada
                      </p>
                      <p className="text-[11.5px] text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                        Para radicar formalmente en SECOP es indispensable adjuntar la Carta de Presentación o Formatos Oficiales firmados en PDF por el Representante Legal.
                      </p>
                    </div>
                  </div>

                  <label className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors flex-shrink-0">
                    <Paperclip className="w-4 h-4" />
                    <span>Adjuntar Carta Firmada (.PDF)</span>
                    <input 
                      type="file" 
                      onChange={(e) => {
                        const letterDoc = activeDocs.find(d => d.id === 'letter' || d.id === 'carta_oferta' || d.id === 'formatos_docx' || d.template_type === 'letter') || { id: 'letter' };
                        handleFileUpload(letterDoc.id, e);
                      }} 
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                      className="hidden" 
                    />
                  </label>
                </div>
              )}

              {/* SECCIÓN 1: DOCUMENTOS DEL PLIEGO Y FORMATOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> 
                    Documentos del Expediente de Postulación ({activeDocs.length})
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                    {agentDocs.length} Generados + {userRequiredDocs.length} Anexados
                  </span>
                </div>

                {/* LISTA COMPLETA DE DOCUMENTOS DEL PLIEGO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {activeDocs.map((doc) => {
                    const isAgent = doc.source === 'agent_generated';
                    const isPliego = doc.source === 'pliego_reference';
                    const isLetterDoc = doc.id === 'letter' || doc.id === 'carta_oferta' || doc.id === 'formatos_docx' || doc.template_type === 'letter';
                    const att = attachments[doc.id];
                    
                    // Si es la carta de presentación, debe tener firma adjunta
                    const isReady = isLetterDoc 
                      ? hasSignedLetter 
                      : (isAgent || isPliego || !!att);

                    return (
                      <div
                        key={doc.id}
                        className={`p-3 rounded-2xl border flex items-start justify-between gap-2.5 ${
                          isReady
                            ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                            : 'border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-xl text-white mt-0.5 flex-shrink-0 ${
                            isReady ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}>
                            {isReady ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-[11px] truncate">
                              {doc.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {isLetterDoc
                                ? (hasSignedLetter ? `✓ Firmado: ${att?.name || signedLetter?.name || 'Archivo adjunto'}` : '⚠️ Borrador IA (Falta versión firmada)')
                                : (att ? att.name : isAgent ? '✓ Generado y auditado por IA' : isPliego ? '📄 Pliego Oficial de la Entidad' : doc.filename)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {(doc.source === 'user_attached' || isLetterDoc) && (
                            <label 
                              className={`p-1.5 rounded-lg border text-[10px] font-semibold cursor-pointer flex items-center gap-1 ${
                                isLetterDoc && !hasSignedLetter
                                  ? 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600'
                              }`} 
                              title="Cargar / Cambiar archivo"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              {isLetterDoc && !hasSignedLetter && <span>Adjuntar</span>}
                              <input type="file" onChange={(e) => handleFileUpload(doc.id, e)} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECCIÓN DE CONFIRMACIÓN */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900 dark:text-white">Verificación de Capacidad Habilitante</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
                  Al confirmar la radicación, el sistema compilará todos los {activeDocs.length} documentos del pliego oficial, verificará la firma del Representante Legal e inscribirá la oferta en la oportunidad <strong>{tender.process_number}</strong> con un radicado oficial ante <strong>{tender.entity_name}</strong>.
                </p>
              </div>
            </>
          ) : (
            /* ESTADO FINAL: OFERTA RADICADA SATISFACTORIAMENTE */
            <div className="py-6 px-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  ¡POSTULACIÓN RADICADA CON ÉXITO!
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Oferta Presentada en {tender.source_platform.replace('_', ' ')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tu propuesta fue registrada ante <strong>{tender.entity_name}</strong> con el expediente oficial de {activeDocs.length} documentos.
                </p>
              </div>

              {/* TARJETA DE RADICADO */}
              <div className="p-5 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 max-w-md mx-auto space-y-3 text-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Código Oficial de Radicación</span>
                  <p className="text-xl font-mono font-black text-emerald-900 dark:text-emerald-200 mt-0.5 tracking-wide">
                    {radicadoCode}
                  </p>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t border-emerald-200 dark:border-emerald-800/80">
                  <p>Fecha y Hora: <strong>{submissionTimestamp}</strong></p>
                  <p className="mt-0.5">Valor Ofertado: <strong>{formatCOP(proposedBudget)} COP</strong></p>
                </div>
              </div>

              {/* BOTONES DE DESCARGA POST-RADICACIÓN */}
              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <button
                  onClick={handleDownloadReceipt}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs hover:bg-slate-800 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Descargar Acta de Radicación</span>
                </button>

                <button
                  onClick={handleDownloadCompleteZip}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  <span>Descargar Expediente Radicado (.ZIP)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* PIE DE PÁGINA / BOTONES DE ACCIÓN */}
        {!isCompleted && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleAutoSubmit}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-xs transition-all font-bold text-xs ${
                !hasSignedLetter
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 shadow-emerald-500/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{submissionProgress || 'Radicando oferta...'}</span>
                </>
              ) : (
                <>
                  <SendHorizontal className="w-4 h-4" />
                  <span>
                    {!hasSignedLetter ? 'Verificar y Radicar en SECOP' : 'Confirmar y Radicar Oferta en SECOP'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
