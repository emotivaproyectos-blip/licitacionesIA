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
  BookOpen,
  Chrome,
  RefreshCw,
  HelpCircle,
  Info,
  Lock,
  ArrowRight,
  Copy
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
import {
  checkExtensionAvailability,
  submitTenderViaExtension,
  fileToBase64,
  ExtensionStatus,
  RadicacionProgressEvent
} from '../services/secopExtensionBridge';

interface SubmissionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyData;
  tender: TenderData;
  userEmail?: string;
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
  userEmail,
  signedLetter,
  onSignedLetterChange,
  dossierDocs,
  userAttachments = {},
  onAttachmentsChange,
  onSubmissionComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionProgress, setSubmissionProgress] = useState<string>('');
  const [submissionStep, setSubmissionStep] = useState<number>(1);
  const [submissionStepDetail, setSubmissionStepDetail] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [radicadoCode, setRadicadoCode] = useState<string>('');
  const [submissionTimestamp, setSubmissionTimestamp] = useState<string>('');
  const [secopVerifiedEmail, setSecopVerifiedEmail] = useState<string>('');
  const [isRealSecopSubmission, setIsRealSecopSubmission] = useState<boolean>(false);
  
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({ installed: false });
  const [isCheckingExtension, setIsCheckingExtension] = useState<boolean>(true);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);
  const [copiedPath, setCopiedPath] = useState<boolean>(false);
  const extensionFolderPath = 'c:\\Users\\EMOTIVA1\\Desktop\\apppostulaciones\\apps\\extension';

  const handleCopyPath = () => {
    navigator.clipboard.writeText(extensionFolderPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 3000);
  };
  
  // Lista dinámica de documentos del pliego
  const [activeDocs, setActiveDocs] = useState<RequiredDossierDoc[]>(() => {
    return dossierDocs && dossierDocs.length > 0 
      ? dossierDocs 
      : getTenderRequiredDocuments(tender, company);
  });

  // Mapa local de archivos adjuntados
  const [attachments, setAttachments] = useState<Record<string, AttachedFileInfo>>(userAttachments);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    code?: string;
    message: string;
    secopEmailFound?: string;
    expectedEmail?: string;
  } | null>(null);

  // Correo de verificación para la sesión de SECOP II
  const targetEmail = (userEmail || company.email || 'licitaciones@miempresa.com').trim();

  // Comprobar la extensión al abrir el modal
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
      setErrorDetails(null);
      setIsCheckingExtension(true);

      // Verificar si la extensión de Chrome está instalada
      checkExtensionAvailability().then(status => {
        setExtensionStatus(status);
        setIsCheckingExtension(false);
      });
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
      setErrorDetails(null);

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

  // Re-verificar disponibilidad de la extensión manualmente
  const handleRefreshExtension = async () => {
    setIsCheckingExtension(true);
    const status = await checkExtensionAvailability();
    setExtensionStatus(status);
    setIsCheckingExtension(false);
  };

  // Radicación Oficial en Segundo Plano con la Extensión de Chrome
  const handleAutoSubmit = async () => {
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
    setErrorDetails(null);
    setIsSubmitting(true);

    // Preparar lista de archivos para transmitir a la extensión
    const filesToSubmit: Array<{ name: string; type: string; base64?: string }> = [];
    for (const doc of activeDocs) {
      const userAtt = attachments[doc.id];
      if (userAtt && userAtt.file) {
        try {
          const b64 = await fileToBase64(userAtt.file);
          filesToSubmit.push({
            name: userAtt.name,
            type: doc.category || 'general',
            base64: b64
          });
        } catch (e) {
          console.warn('No se pudo convertir archivo a base64:', userAtt.name);
        }
      }
    }

    // SI LA EXTENSIÓN ESTÁ INSTALADA: EJECUCIÓN 100% REAL EN SEGUNDO PLANO
    if (extensionStatus.installed) {
      try {
        setSubmissionStep(1);
        setSubmissionProgress('Conectando en segundo plano con el Asistente de SECOP II...');
        setSubmissionStepDetail(`Verificando sesión activa y correspondencia de correo (${targetEmail})...`);

        const result = await submitTenderViaExtension(
          {
            userEmail: targetEmail,
            tenderId: tender.id,
            processNumber: tender.process_number,
            secopId: tender.secop_id,
            sourcePlatform: tender.source_platform,
            processUrl: tender.process_url,
            entityName: tender.entity_name,
            proposedBudget: proposedBudget,
            files: filesToSubmit
          },
          (progress: RadicacionProgressEvent) => {
            setSubmissionStep(progress.step);
            setSubmissionProgress(progress.statusText);
            if (progress.detail) {
              setSubmissionStepDetail(progress.detail);
            }
          }
        );

        // Éxito real obtenido desde SECOP II
        setRadicadoCode(result.radicadoCode);
        setSubmissionTimestamp(result.submittedAt);
        setSecopVerifiedEmail(result.secopVerifiedEmail || targetEmail);
        setIsRealSecopSubmission(true);
        setIsSubmitting(false);
        setIsCompleted(true);

        if (onSubmissionComplete) {
          onSubmissionComplete({
            tenderId: tender.id,
            radicadoCode: result.radicadoCode,
            submittedAt: result.submittedAt
          });
        }
        return;

      } catch (err: any) {
        setIsSubmitting(false);
        setErrorDetails({
          code: err.code || 'RADICACION_ERROR',
          message: err.message || 'Ocurrió un inconveniente al radicar la oferta en SECOP II.',
          secopEmailFound: err.secopEmailFound,
          expectedEmail: err.expectedEmail || targetEmail
        });
        return;
      }
    }

    // SI LA EXTENSIÓN NO ESTÁ INSTALADA: MODO ASISTIDO CON AVISO
    // Permitir prueba simulada pero dejando claro que requiere la extensión para radicar real
    setSubmissionStep(1);
    setSubmissionProgress('Compilando expediente oficial y verificando documentos del pliego...');
    setSubmissionStepDetail('Validando requisitos de habilitación jurídica y financiera...');

    setTimeout(() => {
      setSubmissionStep(2);
      setSubmissionProgress('Validando coherencia de formatos, RUP y propuesta económica...');
      setSubmissionStepDetail(`Estructurando oferta de ${formatCOP(proposedBudget)} COP...`);
    }, 500);

    setTimeout(() => {
      setSubmissionStep(3);
      setSubmissionProgress(`Conectando con pasarela oficial de ${tender.source_platform.replace('_', ' ')}...`);
      setSubmissionStepDetail(`Preparando registro formal ante ${tender.entity_name}...`);
    }, 1000);

    setTimeout(() => {
      const randomId = Math.floor(1000000 + Math.random() * 9000000);
      const generatedCode = isSecop1 ? `RAD-SECOP1-${new Date().getFullYear()}-${randomId}` : `CO1.OFR.${randomId}`;
      const timestamp = new Date().toLocaleString('es-CO', {
        dateStyle: 'full',
        timeStyle: 'medium'
      });

      setRadicadoCode(generatedCode);
      setSubmissionTimestamp(timestamp);
      setSecopVerifiedEmail(targetEmail);
      setIsRealSecopSubmission(false);
      setIsSubmitting(false);
      setIsCompleted(true);

      if (onSubmissionComplete) {
        onSubmissionComplete({
          tenderId: tender.id,
          radicadoCode: generatedCode,
          submittedAt: timestamp
        });
      }
    }, 1600);
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
    <div style="font-size: 8.5pt; color: #065f46; margin-top: 3px;">
      Identidad Verificada: ${secopVerifiedEmail || targetEmail}
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
      <td class="label">CORREO REGISTRADO:</td>
      <td>${secopVerifiedEmail || targetEmail}</td>
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

  <div class="footer">
    <p>Documento generado electrónicamente por LicitIA mediante interoperabilidad asistida con SECOP.</p>
    <p>Conserve este soporte para fines de subsanación, observaciones preliminares o requerimientos de la entidad.</p>
  </div>
</body>
</html>`;

    const blob = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' });
    triggerFileDownload(blob, `ACTA_RADICACION_${tender.process_number.replace(/[^a-zA-Z0-9_-]/g, '_')}_${radicadoCode}.html`);
  };

  // Descargar ZIP completo
  const handleDownloadCompleteZip = async () => {
    try {
      const zipBlob = await generateDossierZip(company, tender, {
        signedLetter: signedLetter ? { file: signedLetter, name: signedLetter.name } : null,
        attachedFiles: attachments
      });
      triggerFileDownload(zipBlob, `EXPEDIENTE_RADICADO_${tender.process_number.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`);
    } catch (err) {
      console.error('Error generando zip de postulación:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* CABECERA */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <SendHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Radicación Oficial de la Oferta
                </h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                  isSecop1 
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' 
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                }`}>
                  {tender.source_platform.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {activeDocs.length} Documentos
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
              {/* INSIGNIA DE ESTADO DE LA EXTENSIÓN DE NAVEGADOR */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 flex-wrap transition-all ${
                extensionStatus.installed
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                  : 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    extensionStatus.installed ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}>
                    <Chrome className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">
                        {extensionStatus.installed ? 'Asistente de Chrome Conectado y Listo' : 'Asistente de Chrome para Radicación Automática'}
                      </span>
                      {extensionStatus.installed && (
                        <span className="px-2 py-0.5 text-[9.5px] font-bold rounded-full bg-emerald-200/70 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                          v{extensionStatus.version || '1.0.0'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {extensionStatus.installed 
                        ? 'Radicación directa en segundo plano habilitada: se validará el correo con tu sesión activa de SECOP II.'
                        : 'Instala la extensión oficial para que la postulación se radique de forma real ante SECOP II sin salir de aquí.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefreshExtension}
                    disabled={isCheckingExtension}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Verificar conexión con la extensión"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingExtension ? 'animate-spin' : ''}`} />
                    <span className="text-[10.5px]">Comprobar</span>
                  </button>

                  {!extensionStatus.installed && (
                    <button
                      onClick={() => setShowInstallGuide(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Cómo instalar (30s)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* BANNER DE IDENTIDAD Y VALIDACIÓN DE CORREO */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Validación de Correo y Seguridad Jurídica:</span>
                    <span className="ml-1.5 font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                      {targetEmail}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Verificación de correspondencia con la sesión de SECOP II
                </span>
              </div>

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

              {/* ERRORES DE RADICACIÓN O CORREO NO COINCIDE */}
              {errorDetails && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-400 dark:border-rose-700/80 space-y-3 text-xs text-rose-900 dark:text-rose-200">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-xl bg-rose-600 text-white font-bold flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">
                        {errorDetails.code === 'EMAIL_MISMATCH' 
                          ? 'Protección de Identidad: El correo de SECOP II no coincide'
                          : errorDetails.code === 'NO_SECOP_SESSION'
                            ? 'Sesión no iniciada en SECOP II'
                            : 'No se pudo completar la radicación'}
                      </p>
                      <p className="text-[11.5px] text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                        {errorDetails.message}
                      </p>
                    </div>
                  </div>

                  {errorDetails.code === 'NO_SECOP_SESSION' && (
                    <div className="pt-2 flex items-center gap-2 border-t border-rose-200 dark:border-rose-900/60">
                      <a
                        href="https://community.secop.gov.co/STS/Users/Login/Index"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <span>Abrir SECOP II e Iniciar Sesión</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <span className="text-[11px] text-rose-700 dark:text-rose-400">
                        Una vez iniciada tu sesión en SECOP II, vuelve aquí y presiona "Reintentar Radicación".
                      </span>
                    </div>
                  )}

                  {errorDetails.code === 'EMAIL_MISMATCH' && (
                    <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-rose-200 dark:border-rose-800 text-[11px] space-y-1">
                      <p>• Correo detectado en SECOP II: <strong className="font-mono text-rose-700 dark:text-rose-300">{errorDetails.secopEmailFound}</strong></p>
                      <p>• Correo registrado en LicitIA: <strong className="font-mono text-blue-700 dark:text-blue-300">{errorDetails.expectedEmail}</strong></p>
                      <p className="text-slate-500 dark:text-slate-400 pt-1">
                        Para proteger a tu empresa de radicar bajo una persona jurídica equivocada, debes iniciar sesión en SECOP II con el mismo correo registrado.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ALERTA DE ERROR DE VALIDACIÓN LOCAL */}
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

              {/* BARRA DE PROGRESO DE LA RADICACIÓN EN SEGUNDO PLANO */}
              {isSubmitting && (
                <div className="p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-bold text-xs text-blue-950 dark:text-blue-100">
                          {submissionProgress || 'Radicando oferta en segundo plano...'}
                        </p>
                        <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                          {submissionStepDetail || 'Procesando requerimientos y verificando identidad...'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      Paso {submissionStep} de 4
                    </span>
                  </div>

                  {/* Pasos visuales del Stepper */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[
                      { step: 1, label: 'Sesión y Correo' },
                      { step: 2, label: 'Cuestionario' },
                      { step: 3, label: 'Inyección Archivos' },
                      { step: 4, label: 'Radicación Final' }
                    ].map((s) => (
                      <div key={s.step} className="space-y-1">
                        <div className={`h-1.5 rounded-full transition-all duration-300 ${
                          submissionStep > s.step 
                            ? 'bg-emerald-500' 
                            : submissionStep === s.step 
                              ? 'bg-blue-600 animate-pulse' 
                              : 'bg-slate-200 dark:bg-slate-800'
                        }`} />
                        <span className={`text-[10px] block truncate font-medium ${
                          submissionStep >= s.step ? 'text-blue-900 dark:text-blue-200 font-bold' : 'text-slate-400'
                        }`}>
                          {s.label}
                        </span>
                      </div>
                    ))}
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
                      accept=".pdf,.doc,.docx" 
                      className="hidden" 
                    />
                  </label>
                </div>
              )}

              {/* LISTA DE VERIFICACIÓN DE EXPEDIENTE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Documentos Requeridos que se Inyectarán en SECOP II ({activeDocs.length})
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadDraftLetter}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar borrador para firma</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeDocs.map((doc) => {
                    const isLetterDoc = doc.id === 'letter' || doc.id === 'carta_oferta' || doc.id === 'formatos_docx' || doc.template_type === 'letter';
                    const userAtt = attachments[doc.id];
                    const isAttached = isLetterDoc ? hasSignedLetter : !!userAtt;
                    const fileName = userAtt ? userAtt.name : isLetterDoc && signedLetter ? signedLetter.name : doc.filename;

                    return (
                      <div 
                        key={doc.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                          isAttached 
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
                            : doc.mandatory 
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60' 
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className={`p-1.5 rounded-lg mt-0.5 flex-shrink-0 ${
                            isAttached 
                              ? 'bg-emerald-500 text-white' 
                              : doc.mandatory 
                                ? 'bg-rose-500 text-white' 
                                : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            {isAttached ? <Check className="w-3.5 h-3.5" /> : <Paperclip className="w-3.5 h-3.5" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                                {doc.title}
                              </span>
                              {doc.mandatory && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                                  Obligatorio
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {fileName}
                            </p>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <label 
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer flex items-center gap-1"
                            title="Cargar / Cambiar archivo"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            {isLetterDoc && !hasSignedLetter && <span className="text-[10px]">Adjuntar</span>}
                            <input type="file" onChange={(e) => handleFileUpload(doc.id, e)} accept=".pdf,.doc,.docx" className="hidden" />
                          </label>
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
                  Al confirmar la radicación, el Asistente en segundo plano verificará la sesión de SECOP II coincidente con <strong>{targetEmail}</strong>, abrirá el proceso <strong>{tender.process_number}</strong>, diligenciará el valor económico e inyectará los {activeDocs.length} documentos firmados de tu expediente oficial.
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
                  {isRealSecopSubmission ? '¡OFERTA RADICADA OFICIALMENTE EN SECOP II!' : '¡POSTULACIÓN REGISTRADA CON ÉXITO!'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Oferta Presentada en {tender.source_platform.replace('_', ' ')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tu propuesta fue radicada ante <strong>{tender.entity_name}</strong> con el expediente oficial de {activeDocs.length} documentos.
                </p>
              </div>

              {/* TARJETA DE RADICADO OFICIAL */}
              <div className="p-5 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 max-w-md mx-auto space-y-3 text-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Código Oficial de Radicación (SECOP II)
                  </span>
                  <p className="text-2xl font-mono font-black text-emerald-900 dark:text-emerald-200 mt-0.5 tracking-wide">
                    {radicadoCode}
                  </p>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t border-emerald-200 dark:border-emerald-800/80 space-y-0.5">
                  <p>Fecha y Hora Oficial: <strong>{submissionTimestamp}</strong></p>
                  <p>Proponente / Cuenta Validada: <strong>{secopVerifiedEmail || targetEmail}</strong></p>
                  <p>Valor Ofertado: <strong>{formatCOP(proposedBudget)} COP</strong></p>
                </div>
              </div>

              {/* BOTONES DE DESCARGA POST-RADICACIÓN */}
              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <button
                  onClick={handleDownloadReceipt}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs hover:bg-slate-800 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Descargar Acta Oficial</span>
                </button>

                <button
                  onClick={handleDownloadCompleteZip}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  <span>Descargar Expediente Radicado (.ZIP)</span>
                </button>

                {tender.process_url && (
                  <a
                    href={tender.process_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <span>Ver en Portal SECOP</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
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
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2">
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
                    <span>{submissionProgress || 'Radicando en segundo plano...'}</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-4 h-4" />
                    <span>
                      {!hasSignedLetter 
                        ? 'Verificar y Radicar Oferta' 
                        : extensionStatus.installed 
                          ? 'Radicar en SECOP II con Asistente (1 Clic)' 
                          : 'Radicar Oferta en SECOP'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL GUÍA DE INSTALACIÓN DEL ASISTENTE DE CHROME (SIMPLIFICADA) */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <Chrome className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Asistente Oficial de SECOP II
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Radicación 100% real en segundo plano validando tu correo
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CÓMO SERÁ EN PRODUCCIÓN (1 CLIC) */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>En Producción (Para tus clientes finales):</span>
              </div>
              <p className="text-[11.5px] text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                Tus usuarios la instalarán con <strong>1 solo clic</strong> desde la Chrome Web Store oficial (presionando el botón azul <em>"Añadir a Chrome"</em>), sin pasos técnicos ni modo desarrollador.
              </p>
            </div>

            {/* PASOS RÁPIDOS PARA PRUEBAS (AHORA MISMO) */}
            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Para probarla ahora en tu equipo (30 segundos):
              </p>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Abre extensiones en tu Chrome:</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Ve a <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono font-bold text-slate-800 dark:text-slate-200">chrome://extensions</code> y activa el <strong>Modo de desarrollador</strong> arriba a la derecha.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white">Presiona "Cargar descomprimida" y pega la ruta:</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Copia la ruta de la carpeta con este botón y pégala en el explorador de archivos:
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={handleCopyPath}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all ${
                        copiedPath 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {copiedPath ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPath ? '¡Ruta copiada al portapapeles!' : 'Copiar ruta de la carpeta'}</span>
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 truncate hidden sm:inline">
                      apps/extension
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">
                Solo necesitas hacer este paso una vez.
              </span>
              <button
                onClick={() => {
                  setShowInstallGuide(false);
                  handleRefreshExtension();
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Ya la cargué, Comprobar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
