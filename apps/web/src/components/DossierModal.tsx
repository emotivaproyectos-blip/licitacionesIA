import React, { useState, useEffect } from 'react';
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
  Trash2,
  Plus,
  AlertCircle,
  AlertTriangle,
  FileUp,
  ShieldCheck,
  Eye,
  RefreshCw,
  Bot,
  ClipboardPaste,
  FileSearch,
  BookOpen,
  Folder
} from 'lucide-react';
import { 
  CompanyData, 
  TenderData, 
  RequiredDossierDoc,
  AttachedFileInfo,
  SignedLetterInfo,
  formatCOP,
  generateLetterOfOffer, 
  generateFinancialMatrix, 
  generateChecklistDoc, 
  generateEconomicProposal, 
  generateIntegrityCert,
  generateMipymeCert,
  generateRiskMatrixDoc,
  getTenderRequiredDocuments,
  parseSecopDocumentTable,
  generateDossierZip, 
  triggerFileDownload,
  dataUrlToBlob 
} from '../services/dossierGenerator';
import { auditTenderDocumentsApi } from '../services/api';
import { loadCompanyVault, matchVaultDocsToRequirements } from '../services/companyVaultService';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyData;
  tender: TenderData;
  signedLetter?: File | null;
  onSignedLetterChange?: (file: File | null) => void;
  dossierDocs?: RequiredDossierDoc[];
  onDocListChange?: (docs: RequiredDossierDoc[]) => void;
  userAttachments?: Record<string, AttachedFileInfo>;
  onAttachmentsChange?: (attachments: Record<string, AttachedFileInfo>) => void;
  onOpenVault?: () => void;
  onStartSubmission?: () => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({
  isOpen,
  onClose,
  company,
  tender,
  signedLetter,
  onSignedLetterChange,
  dossierDocs,
  onDocListChange,
  userAttachments: initialUserAttachments = {},
  onAttachmentsChange,
  onOpenVault,
  onStartSubmission
}) => {
  // Lista de documentos requeridos (dinámica y auditada por el Agente IA según el pliego)
  const [docList, setDocList] = useState<RequiredDossierDoc[]>(() => {
    return dossierDocs && dossierDocs.length > 0 ? dossierDocs : getTenderRequiredDocuments(tender, company);
  });
  const [activeDocId, setActiveDocId] = useState<string>('');
  
  // Mapa de archivos adjuntados por el usuario para cada documento requerido
  const [userAttachments, setUserAttachments] = useState<Record<string, AttachedFileInfo>>(initialUserAttachments);
  
  // Estados de IA y auditoría
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSummary, setAuditSummary] = useState<string>('');
  const [vaultAutoAttachedCount, setVaultAutoAttachedCount] = useState<number>(0);
  const [filterTab, setFilterTab] = useState<'all' | 'agent' | 'user' | 'reference'>('all');
  const [isZipping, setIsZipping] = useState(false);

  // Modal para agregar documento individual personalizado
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [customDocCategory, setCustomDocCategory] = useState<'juridico' | 'financiero' | 'tecnico' | 'economico'>('tecnico');
  const [missingLetterAlert, setMissingLetterAlert] = useState(false);

  // Inicializar o sincronizar cuando se abre el modal o cambia la licitación
  useEffect(() => {
    if (isOpen) {
      const defaultDocs = getTenderRequiredDocuments(tender, company);
      setDocList(defaultDocs);
      if (defaultDocs.length > 0) {
        setActiveDocId(defaultDocs[0].id);
      }
      
      // AUTOVINCULACIÓN INTELIGENTE CON LA BÓVEDA EMPRESARIAL
      const vaultDocs = loadCompanyVault(company.nit, company.name);
      const newAttachments = { ...initialUserAttachments };
      let autoAttached = 0;

      defaultDocs.forEach(reqDoc => {
        if (reqDoc.source === 'user_attached' && !newAttachments[reqDoc.id]) {
          const matchResult = matchVaultDocsToRequirements([reqDoc.title, reqDoc.filename, reqDoc.id], vaultDocs);
          const matchedKey = Object.keys(matchResult.matched)[0];
          if (matchedKey && matchResult.matched[matchedKey]) {
            const vDoc = matchResult.matched[matchedKey];
            const realBlob = vDoc.fileDataUrl ? dataUrlToBlob(vDoc.fileDataUrl) : undefined;
            newAttachments[reqDoc.id] = {
              name: vDoc.filename,
              size: vDoc.sizeBytes,
              file: realBlob || undefined,
              fileDataUrl: vDoc.fileDataUrl,
              uploadedAt: '⚡ Vinculado desde Bóveda'
            };
            autoAttached++;
          }
        }
      });

      // Si hay una carta firmada previa, mapearla
      if (signedLetter) {
        const letterData = {
          file: signedLetter,
          name: signedLetter.name,
          size: signedLetter.size,
          uploadedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        };
        newAttachments['formatos_firmados'] = letterData;
        newAttachments['signed_letter'] = letterData;
        newAttachments['letter'] = letterData;
        newAttachments['carta_oferta'] = letterData;
        newAttachments['formatos_docx'] = letterData;
        newAttachments['carta_firmada'] = letterData;
      }

      setUserAttachments(newAttachments);
      setVaultAutoAttachedCount(autoAttached);

      // Ejecutar auditoría del agente con la API o pliego
      handleAuditTender(false);
    }
  }, [isOpen, tender.id, tender.process_number, tender.process_url]);

  useEffect(() => {
    if (onDocListChange && docList.length > 0) {
      onDocListChange(docList);
    }
  }, [docList]);

  useEffect(() => {
    if (onAttachmentsChange) {
      onAttachmentsChange(userAttachments);
    }
  }, [userAttachments]);

  // Función para auditar el pliego con el Agente IA
  const handleAuditTender = async (isManual = true) => {
    setIsAuditing(true);
    try {
      const auditResult = await auditTenderDocumentsApi(tender, company);
      let activeDocs = docList;

      if (auditResult && auditResult.documents && auditResult.documents.length > 0) {
        setDocList(auditResult.documents);
        setActiveDocId(auditResult.documents[0].id);
        setAuditSummary(auditResult.audit_summary || `Pliego auditado: ${auditResult.total_documents} documentos exigidos según la convocatoria.`);
        activeDocs = auditResult.documents;
      } else {
        const localDocs = getTenderRequiredDocuments(tender, company);
        setDocList(localDocs);
        if (localDocs.length > 0) setActiveDocId(localDocs[0].id);
        const agentCount = localDocs.filter(d => d.source === 'agent_generated').length;
        const userCount = localDocs.filter(d => d.source === 'user_attached').length;
        const refCount = localDocs.filter(d => d.source === 'pliego_reference').length;
        setAuditSummary(`Pliego auditado para ${tender.process_number}: ${localDocs.length} documentos (${agentCount} a estructurar + ${userCount} a anexar por el proponente` + (refCount > 0 ? ` + ${refCount} de pliego oficial` : '') + `).`);
        activeDocs = localDocs;
      }

      // Sincronizar autovinculación de Bóveda con los documentos auditados
      const vaultDocs = loadCompanyVault(company.nit, company.name);
      setUserAttachments(prev => {
        const next = { ...prev };
        let count = 0;
        activeDocs.forEach(reqDoc => {
          if (reqDoc.source === 'user_attached' && !next[reqDoc.id]) {
            const matchResult = matchVaultDocsToRequirements([reqDoc.title, reqDoc.filename, reqDoc.id], vaultDocs);
            const matchedKey = Object.keys(matchResult.matched)[0];
            if (matchedKey && matchResult.matched[matchedKey]) {
              const vDoc = matchResult.matched[matchedKey];
              const realBlob = vDoc.fileDataUrl ? dataUrlToBlob(vDoc.fileDataUrl) : undefined;
              next[reqDoc.id] = {
                name: vDoc.filename,
                size: vDoc.sizeBytes,
                file: realBlob || undefined,
                fileDataUrl: vDoc.fileDataUrl,
                uploadedAt: '⚡ Vinculado desde Bóveda'
              };
              count++;
            }
          }
        });
        if (count > 0) setVaultAutoAttachedCount(c => c + count);
        return next;
      });
    } catch (err) {
      console.warn('Error en auditoría IA:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  if (!isOpen) return null;

  // Documento actualmente seleccionado
  const currentDoc = docList.find(d => d.id === activeDocId) || docList[0] || {
    id: 'letter',
    title: 'Anexo 1 - Carta de Presentación de la Propuesta',
    category: 'juridico',
    mandatory: true,
    source: 'agent_generated',
    template_type: 'letter',
    filename: `01_Carta_Presentacion_${tender.process_number}.doc`,
    legal_basis: 'Decreto 1082 de 2015',
    description: 'Carta formal con identificación del proponente y valor de la oferta.'
  };

  // Generación de HTML para documentos autogenerados
  const getDocHtml = (doc: RequiredDossierDoc): string => {
    switch (doc.template_type || doc.id) {
      case 'letter':
      case 'formatos_docx':
      case 'carta_oferta':
        return generateLetterOfOffer(company, tender);
      case 'matrix':
        return generateFinancialMatrix(company, tender);
      case 'economy':
      case 'propuesta_economica':
        return generateEconomicProposal(company, tender);
      case 'integrity':
        return generateIntegrityCert(company, tender);
      case 'mipyme':
      case 'oficio_decreto_287':
        return generateMipymeCert(company, tender);
      case 'risk_matrix':
      case 'matriz_riesgos':
        return generateRiskMatrixDoc(company, tender);
      default:
        return generateChecklistDoc(company, tender);
    }
  };

  // Manejador de carga de archivos adjuntos del usuario
  const handleFileUpload = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const attachInfo: AttachedFileInfo = {
        file,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      };

      setUserAttachments(prev => ({
        ...prev,
        [docId]: attachInfo
      }));

      // Si es la carta de presentación o formatos firmados, propagar
      if (
        docId === 'signed_letter' || 
        docId === 'formatos_firmados' || 
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

  // Eliminar archivo adjuntado
  const handleRemoveAttachment = (docId: string) => {
    setUserAttachments(prev => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });

    if (
      docId === 'signed_letter' || 
      docId === 'formatos_firmados' || 
      docId === 'letter' || 
      docId === 'carta_oferta' || 
      docId === 'formatos_docx' || 
      docId === 'carta_firmada'
    ) {
      if (onSignedLetterChange) {
        onSignedLetterChange(null);
      }
    }
  };

  // Agregar documento personalizado
  const handleAddCustomDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDocTitle.trim()) return;

    const newId = `custom_${Date.now()}`;
    const newDoc: RequiredDossierDoc = {
      id: newId,
      title: customDocTitle.trim(),
      category: customDocCategory,
      mandatory: false,
      source: 'user_attached',
      filename: `${customDocTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
      legal_basis: 'Documento Específico Solicitado por Pliego',
      description: 'Archivo personalizado anexado por el proponente para completar el expediente.'
    };

    setDocList(prev => [...prev, newDoc]);
    setActiveDocId(newId);
    setCustomDocTitle('');
    setIsAddingCustom(false);
  };

  // Métricas de progreso
  const totalRequired = docList.length;
  const agentGeneratedCount = docList.filter(d => d.source === 'agent_generated').length;
  const userRequiredDocs = docList.filter(d => d.source === 'user_attached');
  const pliegoRefDocs = docList.filter(d => d.source === 'pliego_reference');
  const userAttachedCount = userRequiredDocs.filter(d => !!userAttachments[d.id]).length;
  
  // Lo que cuenta para estar "Listo para radicar" son los generados por IA + los adjuntados por el usuario
  const totalActionable = agentGeneratedCount + userRequiredDocs.length;
  const totalReady = agentGeneratedCount + userAttachedCount;
  const progressPercent = totalActionable > 0 ? Math.round((totalReady / totalActionable) * 100) : 100;

  // Filtrado de lista
  const filteredDocs = docList.filter(d => {
    if (filterTab === 'agent') return d.source === 'agent_generated';
    if (filterTab === 'user') return d.source === 'user_attached';
    if (filterTab === 'reference') return d.source === 'pliego_reference';
    return true;
  });

  // Descargar ZIP completo organizado en carpetas
  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const signedInfo = userAttachments['formatos_firmados'] || userAttachments['signed_letter'] || (signedLetter ? { file: signedLetter, name: signedLetter.name } : null);
      
      const blob = await generateDossierZip(company, tender, {
        signedLetter: signedInfo,
        attachedFiles: userAttachments,
        customDocs: docList
      });

      const zipName = `Expediente_${tender.process_number.replace(/[^a-zA-Z0-9_-]/g, '_')}_${company.name.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
      triggerFileDownload(blob, zipName);
    } catch (err) {
      console.error('Error al generar el ZIP:', err);
      alert('Ocurrió un error al compilar el expediente ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  // Descargar el documento actual
  const handleDownloadCurrentDoc = () => {
    const isAttached = userAttachments[currentDoc.id];
    if (isAttached) {
      if (isAttached.file) {
        triggerFileDownload(isAttached.file as Blob, isAttached.name);
        return;
      }
      if (isAttached.fileDataUrl) {
        const blob = dataUrlToBlob(isAttached.fileDataUrl);
        if (blob) {
          triggerFileDownload(blob, isAttached.name);
          return;
        }
      }
    }

    if (currentDoc.source === 'agent_generated') {
      const content = getDocHtml(currentDoc);
      const mimeType = 'application/msword;charset=utf-8';
      const blob = new Blob([content], { type: mimeType });
      triggerFileDownload(blob, currentDoc.filename);
    }
  };

  // Imprimir documento
  const handlePrintCurrentDoc = () => {
    if (currentDoc.source === 'agent_generated') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(getDocHtml(currentDoc));
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-6xl w-full flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* =========================================================================
            1. ENCABEZADO DEL MODAL
        ========================================================================== */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Expediente de Postulación Oficial
                </h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                  tender.source_platform === 'SECOP_I'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                }`}>
                  {tender.source_platform.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{docList.length} Documentos Reales del Pliego (Sincronizado Automáticamente)</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Proceso: <span className="font-semibold text-slate-800 dark:text-slate-200">{tender.process_number}</span> • Postulante: <span className="font-semibold text-slate-800 dark:text-slate-200">{company.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* BOTÓN ABRIR BÓVEDA DOCUMENTAL */}
            {onOpenVault && (
              <button
                onClick={onOpenVault}
                title="Ver o gestionar los documentos permanentes en tu Bóveda Empresarial"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold text-xs border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                <Folder className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Bóveda Empresarial</span>
              </button>
            )}

            {/* BOTÓN RE-SINCRONIZAR CON AGENTE IA */}
            <button
              onClick={() => handleAuditTender(true)}
              disabled={isAuditing}
              title="El Agente IA re-examina el link y los pliegos oficiales para detectar los documentos de esta licitación"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Sincronizando...' : 'Re-sincronizar Pliego'}</span>
            </button>

            {/* BOTÓN RADICACIÓN ASISTIDA DIRECTA CON VERIFICACIÓN */}
            {onStartSubmission && (
              <button
                onClick={onStartSubmission}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105"
                title="Verifica los requisitos del pliego y abre el asistente de radicación oficial"
              >
                <SendHorizontal className="w-4 h-4" />
                <span>Radicar Oferta</span>
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
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA DE ESTADO DE AUDITORÍA IA */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900/60 px-6 py-2 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-medium">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>{auditSummary || `Pliego auditado para ${tender.process_number}: ${docList.length} documentos extraídos exactamente del pliego de condiciones.`}</span>
            {vaultAutoAttachedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-[10.5px]">
                ⚡ {vaultAutoAttachedCount} vinculados de Bóveda
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {tender.process_url && (
              <a
                href={tender.process_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
              >
                <span>Ver Proceso Oficial en SECOP II</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* =========================================================================
            2. CUERPO DEL MODAL (LISTA LATERAL + PREVISUALIZADOR / CARGA)
        ========================================================================== */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* PANEL LATERAL DE DOCUMENTOS (4 COLS) */}
          <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-3 overflow-y-auto">
            
            {/* FILTROS SEGMENTADOS DE DOCUMENTOS */}
            <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-[11px] font-semibold">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1 px-1.5 rounded-lg transition-all text-center ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todos ({docList.length})
              </button>
              <button
                onClick={() => setFilterTab('agent')}
                className={`flex-1 py-1 px-1.5 rounded-lg transition-all text-center ${
                  filterTab === 'agent'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🤖 IA ({agentGeneratedCount})
              </button>
              <button
                onClick={() => setFilterTab('user')}
                className={`flex-1 py-1 px-1.5 rounded-lg transition-all text-center ${
                  filterTab === 'user'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📎 Anexar ({userRequiredDocs.length})
              </button>
              {pliegoRefDocs.length > 0 && (
                <button
                  onClick={() => setFilterTab('reference')}
                  className={`flex-1 py-1 px-1.5 rounded-lg transition-all text-center ${
                    filterTab === 'reference'
                      ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  📄 Pliego ({pliegoRefDocs.length})
                </button>
              )}
            </div>

            {/* LISTA DE DOCUMENTOS */}
            <div className="space-y-2">
              {filteredDocs.map((doc) => {
                const isSelected = activeDocId === doc.id;
                const isAgentGen = doc.source === 'agent_generated';
                const isPliegoRef = doc.source === 'pliego_reference';
                const attachInfo = userAttachments[doc.id];
                const isAttached = !!attachInfo;

                let badgeText = isAgentGen 
                  ? (isAttached ? '✓ Firmado Adjunto' : '✓ Generado por IA') 
                  : isPliegoRef 
                  ? '📄 Pliego Oficial' 
                  : isAttached 
                  ? '✓ Adjuntado' 
                  : '⚠️ Pendiente';

                let badgeClass = isAgentGen
                  ? (isAttached 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-semibold'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-semibold')
                  : isPliegoRef
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                  : isAttached
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold';

                return (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-white/70 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                        isAgentGen 
                          ? (isAttached ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400')
                          : isPliegoRef
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                          : isAttached
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      }`}>
                        {isAgentGen ? (isAttached ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />) : isPliegoRef ? <BookOpen className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {doc.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {isAttached ? attachInfo.name : doc.filename}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-semibold border flex-shrink-0 ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* BOTÓN PARA AGREGAR DOCUMENTO PERSONALIZADO */}
            {!isAddingCustom ? (
              <button
                onClick={() => setIsAddingCustom(true)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-600 dark:text-slate-400 hover:text-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Documento Adicional</span>
              </button>
            ) : (
              <form onSubmit={handleAddCustomDoc} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2 text-xs">
                <p className="font-bold text-slate-900 dark:text-white text-[11px]">Nuevo Documento Requerido</p>
                <input
                  type="text"
                  placeholder="Nombre del documento..."
                  value={customDocTitle}
                  onChange={e => setCustomDocTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  autoFocus
                />
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={customDocCategory}
                    onChange={e => setCustomDocCategory(e.target.value as any)}
                    className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px]"
                  >
                    <option value="tecnico">Técnico</option>
                    <option value="juridico">Jurídico</option>
                    <option value="financiero">Financiero</option>
                    <option value="economico">Económico</option>
                  </select>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustom(false)}
                      className="px-2 py-1 text-slate-400 hover:text-slate-600 text-[11px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!customDocTitle.trim()}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px]"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>

          {/* =========================================================================
              3. ÁREA PRINCIPAL: DETALLE DEL DOCUMENTO + PREVISUALIZADOR / ZONA DE CARGA
          ========================================================================== */}
          <div className="md:col-span-8 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
            
            {/* BARRA DE HERRAMIENTAS SUPERIOR DEL DOCUMENTO ACTIVO */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-900/40 flex-wrap gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {currentDoc.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {currentDoc.category}
                  </span>
                  {currentDoc.mandatory && (
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      Obligatorio
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400 font-mono">
                  {currentDoc.legal_basis} • {currentDoc.filename}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentDoc.source === 'agent_generated' && (
                  <>
                    <button
                      onClick={handlePrintCurrentDoc}
                      title="Imprimir o exportar como PDF"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir / PDF</span>
                    </button>

                    <button
                      onClick={handleDownloadCurrentDoc}
                      title="Descargar plantilla formal en Word (.doc)"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar .DOC</span>
                    </button>
                  </>
                )}

                {currentDoc.source === 'user_attached' && userAttachments[currentDoc.id] && (
                  <button
                    onClick={handleDownloadCurrentDoc}
                    title="Descargar archivo que has adjuntado"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Adjunto</span>
                  </button>
                )}

                {currentDoc.source === 'pliego_reference' && tender.process_url && (
                  <a
                    href={tender.process_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir en SECOP II</span>
                  </a>
                )}
              </div>
            </div>

            {/* CASO A: DOCUMENTO GENERADO POR EL AGENTE (CON OPCIÓN DE FIRMA SI ES FORMATOS / CARTA) */}
            {currentDoc.source === 'agent_generated' ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* BANNER DE SUBIDA DE FORMATO O CARTA FIRMADA */}
                {(currentDoc.id === 'letter' || currentDoc.id === 'formatos_docx' || currentDoc.template_type === 'letter' || currentDoc.id === 'carta_oferta' || currentDoc.template_type === 'economy' || currentDoc.id === 'propuesta_economica') && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                    {userAttachments[currentDoc.id] || userAttachments['formatos_firmados'] || userAttachments['signed_letter'] || signedLetter ? (
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-emerald-600 text-white font-bold">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-emerald-900 dark:text-emerald-300">
                              Documento Firmado Oficial Adjunto: <span className="underline">{userAttachments[currentDoc.id]?.name || userAttachments['formatos_firmados']?.name || userAttachments['signed_letter']?.name || signedLetter?.name}</span>
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              Este archivo firmado sustituye la plantilla base y se empaquetará en el expediente oficial.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <label className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-100 cursor-pointer">
                            <span>Cambiar Archivo</span>
                            <input type="file" onChange={(e) => handleFileUpload(currentDoc.id, e)} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" />
                          </label>

                          <button
                            onClick={() => handleRemoveAttachment(currentDoc.id)}
                            title="Eliminar archivo firmado y volver al borrador"
                            className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 flex items-center justify-between gap-4 text-xs flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-blue-600 text-white font-bold">
                            <UploadCloud className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {currentDoc.title} Diligenciado por IA
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Descarga el documento generado, fírmalo por el Representante Legal y adjúntalo aquí en PDF para la radicación.
                            </p>
                          </div>
                        </div>

                        <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors flex items-center gap-1.5 flex-shrink-0">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Adjuntar Versión Firmada (PDF)</span>
                          <input type="file" onChange={(e) => handleFileUpload(currentDoc.id, e)} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* VISTA PREVIA DEL DOCUMENTO FORMAL HTML EN TIEMPO REAL */}
                <div className="flex-1 p-6 overflow-y-auto bg-slate-100/60 dark:bg-slate-900/30">
                  <div className="max-w-3xl mx-auto bg-white text-slate-900 shadow-md border border-slate-200 rounded-2xl p-8 min-h-[600px]">
                    <div 
                      dangerouslySetInnerHTML={{ __html: getDocHtml(currentDoc) }} 
                    />
                  </div>
                </div>

              </div>
            ) : currentDoc.source === 'pliego_reference' ? (
              /* CASO B: DOCUMENTO DE REFERENCIA DEL PLIEGO (ESTUDIOS PREVIOS, INVITACIÓN, CDP, PAA) */
              <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-xs">
                    <BookOpen className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      DOCUMENTO OFICIAL EXPEDIDO POR LA ENTIDAD
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {currentDoc.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      {currentDoc.description}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Proceso:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{tender.process_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Entidad:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{tender.entity_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fundamento:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{currentDoc.legal_basis}</span>
                    </div>
                  </div>

                  {tender.process_url && (
                    <a
                      href={tender.process_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Ver y Descargar Archivo en SECOP II</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              /* CASO C: DOCUMENTO QUE DEBE ADJUNTAR EL CONTRATISTA */
              <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-900/20">
                
                {/* TARJETA INFORMATIVA DEL REQUISITO SEGÚN EL PLIEGO */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                      Instrucciones del Pliego de Condiciones
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentDoc.description}
                  </p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                    <span>Fundamento Legal: <strong className="text-slate-600 dark:text-slate-300">{currentDoc.legal_basis}</strong></span>
                    <span>Categoría: <strong className="text-slate-600 dark:text-slate-300 uppercase">{currentDoc.category}</strong></span>
                  </div>
                </div>

                {/* ZONA DE ARCHIVO CARGADO O ZONA DE ARRASTRE */}
                {userAttachments[currentDoc.id] ? (
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/80 shadow-md space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                            DOCUMENTO ADJUNTADO CORRECTAMENTE
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                            {userAttachments[currentDoc.id].name}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {userAttachments[currentDoc.id].size ? `${(userAttachments[currentDoc.id].size! / 1024).toFixed(1)} KB • ` : ''}
                            Cargado a las {userAttachments[currentDoc.id].uploadedAt || 'hoy'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors">
                          <span>Reemplazar Archivo</span>
                          <input 
                            type="file" 
                            onChange={(e) => handleFileUpload(currentDoc.id, e)} 
                            accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg" 
                            className="hidden" 
                          />
                        </label>

                        <button
                          onClick={() => handleRemoveAttachment(currentDoc.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                          title="Eliminar este archivo adjunto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                      <span>Este archivo será empaquetado dentro del expediente ZIP y presentado en la oferta.</span>
                      <button
                        onClick={handleDownloadCurrentDoc}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar copia</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-center space-y-4 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                      <FileUp className="w-7 h-7" />
                    </div>

                    <div className="max-w-md mx-auto space-y-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Adjuntar {currentDoc.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Arrastra y suelta tu archivo aquí o haz clic en el botón para examinar en tu equipo. Formatos soportados: PDF, Word (.doc, .docx), ZIP o Imágenes legibles.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all hover:scale-105">
                      <UploadCloud className="w-4 h-4" />
                      <span>Seleccionar Archivo de mi Equipo</span>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileUpload(currentDoc.id, e)} 
                        accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg" 
                        className="hidden" 
                      />
                    </label>

                    <p className="text-[11px] text-slate-400">
                      Tamaño máximo recomendado: 25 MB conforme a los límites de SECOP II.
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

        {/* MODAL DE ALERTA: CARTA DE PRESENTACIÓN PENDIENTE */}
        {missingLetterAlert && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-600 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500 text-white font-bold flex-shrink-0 shadow-xs">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Requisito Obligatorio Pendiente: Carta de Presentación Firmada
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Para radicar formalmente tu propuesta ante <strong>{tender.entity_name}</strong> en el proceso <strong>{tender.process_number}</strong>, es un requisito legal habilitante <strong>no subsanable</strong> que la <em>Carta de Presentación / Formatos Oficiales</em> esté debidamente firmada en PDF por el Representante Legal.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <p className="font-semibold">
                  📌 Pasos requeridos para radicar:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11.5px] text-slate-700 dark:text-slate-300">
                  <li>Haz clic en <strong>"Descargar .DOC"</strong> para obtener el formato oficial.</li>
                  <li>Firma el documento (firma digital o manuscrita con cédula).</li>
                  <li>Adjunta el archivo firmado en PDF aquí para radicar la oferta.</li>
                </ol>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setMissingLetterAlert(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 rounded-xl"
                >
                  Entendido, voy a adjuntarlo
                </button>

                <label className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Paperclip className="w-4 h-4" />
                  <span>Subir Carta Firmada (.PDF)</span>
                  <input 
                    type="file" 
                    onChange={(e) => {
                      const letterDoc = docList.find(d => d.id === 'letter' || d.id === 'carta_oferta' || d.id === 'formatos_docx' || d.template_type === 'letter') || { id: 'letter' };
                      handleFileUpload(letterDoc.id, e);
                      setMissingLetterAlert(false);
                    }} 
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
