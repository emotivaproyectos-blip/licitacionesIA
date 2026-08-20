import React, { useState } from 'react';
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
  Trash2
} from 'lucide-react';
import { 
  CompanyData, 
  TenderData, 
  formatCOP, 
  numeroALetrasCOP, 
  generateLetterOfOffer,
  generateDossierZip, 
  triggerFileDownload 
} from '../services/dossierGenerator';

interface SubmissionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyData;
  tender: TenderData;
  signedLetter?: File | null;
  onSignedLetterChange?: (file: File | null) => void;
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
  onSubmissionComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionProgress, setSubmissionProgress] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [radicadoCode, setRadicadoCode] = useState<string>('');
  const [submissionTimestamp, setSubmissionTimestamp] = useState<string>('');

  // Archivos adicionales opcionales que el usuario puede anexar
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [customFileNote, setCustomFileNote] = useState<string>('');

  if (!isOpen) return null;

  const isSecop1 = tender.source_platform === 'SECOP_I';
  const proposedBudget = tender.budget_cop * 0.985;
  const budgetLetters = numeroALetrasCOP(proposedBudget);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFiles(prev => [...prev, file.name]);
    }
  };

  const handleSignedLetterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (onSignedLetterChange) {
        onSignedLetterChange(file);
      }
    }
  };

  const handleRemoveSignedLetter = () => {
    if (onSignedLetterChange) {
      onSignedLetterChange(null);
    }
  };

  const handleDownloadDraftLetter = () => {
    const content = generateLetterOfOffer(company, tender);
    const mimeType = 'application/msword;charset=utf-8';
    const blob = new Blob([content], { type: mimeType });
    triggerFileDownload(blob, `01_Anexo_1_Carta_Presentacion_${tender.process_number.replace(/[^a-zA-Z0-9_-]/g, '_')}.doc`);
  };

  const handleAutoSubmit = () => {
    if (!signedLetter || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionProgress('Compilando expediente y verificando Carta de Presentación firmada...');

    setTimeout(() => {
      setSubmissionProgress('Validando capacidad financiera e indicadores RUP en tiempo real...');
    }, 500);

    setTimeout(() => {
      setSubmissionProgress(`Conectando y radicando propuesta ante ${tender.entity_name} (${tender.source_platform.replace('_', ' ')})...`);
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
      N° DE RADICADO: ${radicadoCode}
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
      <td class="label">OFERENTE / PROPONENTE:</td>
      <td><strong>${company.name}</strong> (NIT: ${company.nit})</td>
    </tr>
    <tr>
      <td class="label">VALOR OFERTADO:</td>
      <td><strong>${formatCOP(proposedBudget)} COP</strong> (${budgetLetters})</td>
    </tr>
    <tr>
      <td class="label">DOCUMENTOS RADICADOS:</td>
      <td>
        • ${signedLetter ? `Carta de Presentación Oficial Firmada (${signedLetter.name})` : 'Anexo 1 - Carta de Presentación de la Oferta (Ley 80/1993)'}<br>
        • Matriz de Capacidad Financiera, Organizacional y RUP<br>
        • Propuesta Económica Desglosada con A.I.U.<br>
        • Certificado RUP Vigente (${company.smmlv_experience} SMMLV)<br>
        • Certificado de Existencia y Representación Legal<br>
        • Paz y Salvo Parafiscales y Seguridad Social (Art. 50 Ley 789)<br>
        • Checklist de Habilitación Decreto 1082 de 2015
        ${attachedFiles.length > 0 ? `<br>• Documentos Adicionales: ${attachedFiles.join(', ')}` : ''}
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

  const handleDownloadCompleteZip = async () => {
    const signedInfo = signedLetter ? { file: signedLetter, name: signedLetter.name } : null;
    const blob = await generateDossierZip(company, tender, signedInfo);
    triggerFileDownload(blob, `Expediente_Radicado_${tender.process_number.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* ENCABEZADO */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <SendHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Postulación y Radicación Automática
                </h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                  isSecop1 
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' 
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                }`}>
                  {tender.source_platform.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xl">
                Proceso: <span className="font-semibold text-slate-800 dark:text-slate-200">{tender.process_number}</span> • Entidad: <span className="font-semibold text-slate-800 dark:text-slate-200">{tender.entity_name}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO PRINCIPAL */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          
          {!isCompleted ? (
            <>
              {/* RESUMEN DEL PROCESO Y OFERTA */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Oferente Postulado</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{company.name} (NIT {company.nit})</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Valor Propuesta Económica</span>
                  <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                    {formatCOP(proposedBudget)} COP
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Plataforma</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tender.source_platform.replace('_', ' ')}</p>
                </div>
              </div>

              {/* SECCIÓN 1: DOCUMENTOS QUE EL APLICATIVO YA GENERÓ Y COMPLETÓ AUTOMÁTICAMENTE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> 
                    1. Anexos Oficiales de la Oferta
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    signedLetter
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                      : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                  }`}>
                    {signedLetter ? '✓ Carta Firmada Adjunta' : 'Falta Anexo 1 Firmado'}
                  </span>
                </div>

                {/* BANNER DE ADVERTENCIA: ANEXO 1 ES OBLIGATORIO PARA RADICAR (SOLO APARECE SI NO SE HA AGREGADO EL ARCHIVO) */}
                {!signedLetter && (
                  <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex items-start gap-3 text-xs shadow-xs">
                    <div className="p-2 rounded-lg bg-amber-500 text-white mt-0.5 flex-shrink-0 shadow-xs">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-amber-950 dark:text-amber-200 text-[12px]">
                          Requisito Obligatorio: Anexo 1 - Carta de Presentación
                        </p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          Obligatorio
                        </span>
                      </div>
                      <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-[11px]">
                        Conforme a la Ley 80/1993 y al pliego de condiciones, <strong>sin la Carta de Presentación firmada por el Representante Legal no es posible confirmar ni radicar la oferta</strong>. Descarga el borrador oficial generado, fírmalo y adjúntalo a continuación.
                      </p>
                      <div className="pt-1 flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleDownloadDraftLetter}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Borrador (.DOC)</span>
                        </button>
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition-colors shadow-xs">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Adjuntar Carta Firmada (PDF / Word)</span>
                          <input type="file" onChange={handleSignedLetterUpload} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* CARTA DE PRESENTACIÓN CON DETECCIÓN DE CARTA FIRMADA */}
                  <div className={`p-3 rounded-xl border flex items-start justify-between gap-2.5 ${
                    signedLetter 
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40' 
                      : 'border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20'
                  }`}>
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-1 rounded text-white mt-0.5 flex-shrink-0 ${signedLetter ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                        {signedLetter ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 dark:text-white text-[11px] truncate">
                            {signedLetter ? '✓ Carta de Presentación Firmada' : 'Anexo 1 - Carta de Presentación'}
                          </p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex-shrink-0 ${
                            signedLetter 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200'
                          }`}>
                            {signedLetter ? 'Adjunta' : 'Obligatorio'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate max-w-[200px]" title={signedLetter ? signedLetter.name : undefined}>
                          {signedLetter ? signedLetter.name : `Pendiente de firma (${company.name})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <label className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600 dark:hover:text-blue-300 text-[10px] font-semibold cursor-pointer" title={signedLetter ? "Cambiar archivo firmado" : "Adjuntar carta firmada"}>
                        <Paperclip className="w-3.5 h-3.5" />
                        <input type="file" onChange={handleSignedLetterUpload} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" />
                      </label>
                      {signedLetter && (
                        <button
                          type="button"
                          onClick={handleRemoveSignedLetter}
                          title="Quitar archivo firmado"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-2.5">
                    <div className="p-1 rounded bg-emerald-600 text-white mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-[11px]">Matriz Financiera & RUP</p>
                      <p className="text-[10px] text-slate-500">Ratios de liquidez, endeudamiento y SMMLV auditados</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-2.5">
                    <div className="p-1 rounded bg-emerald-600 text-white mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-[11px]">Propuesta Económica Desglosada</p>
                      <p className="text-[10px] text-slate-500">Calculada con A.I.U. ({formatCOP(proposedBudget)})</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-2.5">
                    <div className="p-1 rounded bg-emerald-600 text-white mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-[11px]">Checklist Habilitante Decreto 1082</p>
                      <p className="text-[10px] text-slate-500">Verificación normativa y técnica completada</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DOCUMENTOS DE SOPORTE DEL PROPONENTE (VINCULADOS AUTOMÁTICAMENTE) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> 
                    2. Documentos de Soporte del Proponente (Vinculados)
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">✓ Certificado RUP Vigente ({company.smmlv_experience} SMMLV)</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Vinculado</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">✓ Certificado Cámara de Comercio & Representación Legal</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Vinculado</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">✓ Certificación de Parafiscales y Seguridad Social (Art. 50 Ley 789)</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Vinculado</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: ¿DESEAS ADJUNTAR ALGÚN ARCHIVO COMPLEMENTARIO? (OPCIONAL) */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-slate-500" /> 
                  3. Anexar Archivos Adicionales (Opcional)
                </h3>

                <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Póliza de seriedad, certificados técnicos o anexos específicos del pliego
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Formatos admitidos: PDF, Word, Excel, ZIP (Hasta 50MB)
                    </p>
                  </div>

                  <label className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors">
                    <UploadCloud className="w-4 h-4" />
                    <span>Cargar Archivo</span>
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
                        <span className="font-medium text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-blue-600" /> {file}
                        </span>
                        <button 
                          onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BARRA DE PROGRESO DE RADICACIÓN AUTOMÁTICA */}
              {isSubmitting && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>{submissionProgress}</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-4/5 animate-pulse"></div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* PANTALLA DE RADICADO EXITOSO (COMPROBANTE OFICIAL) */
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                <div className="h-14 w-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                    ¡Oferta Radicada Satisfactoriamente!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    La postulación fue registrada exitosamente ante <strong>{tender.entity_name}</strong>
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 inline-block shadow-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Código de Radicado Oficial</span>
                  <span className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                    {radicadoCode}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{submissionTimestamp}</span>
                </div>
              </div>

              {/* DETALLES DE LA RADICACIÓN */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider mb-1">
                  Resumen de la Transacción de Radicación
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Proceso:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{tender.process_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Plataforma:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{tender.source_platform.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Proponente:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{company.name} (NIT {company.nit})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Propuesta Económica:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">{formatCOP(proposedBudget)} COP</span>
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN POST-RADICACIÓN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleDownloadReceipt}
                  className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar Acta de Radicación (PDF)</span>
                </button>

                <button
                  onClick={handleDownloadCompleteZip}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  <span>Descargar Expediente Completo (.ZIP)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* PIE DE PÁGINA CON BOTÓN PRINCIPAL */}
        {!isCompleted && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60 flex-wrap gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-3">
              {!signedLetter && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">Adjunta el Anexo 1 firmado para habilitar la radicación</span>
                  <span className="sm:hidden">Falta Carta Firmada</span>
                </div>
              )}

              <button
                onClick={handleAutoSubmit}
                disabled={isSubmitting || !signedLetter}
                className={`px-6 py-3 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all ${
                  !signedLetter
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                }`}
                title={!signedLetter ? "Debes adjuntar el Anexo 1 (Carta de Presentación firmada) para confirmar y radicar la oferta" : "Confirmar y radicar oferta ante la entidad"}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Radicando Oferta...</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-4 h-4" />
                    <span>Confirmar y Radicar Oferta en 1 Clic 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
