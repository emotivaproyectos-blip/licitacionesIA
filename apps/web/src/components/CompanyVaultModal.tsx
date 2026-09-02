import React, { useState, useEffect } from 'react';
import { 
  X, 
  Folder, 
  FolderPlus, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UploadCloud, 
  Trash2, 
  Download, 
  Eye, 
  ShieldCheck, 
  Scale, 
  BadgeDollarSign, 
  Briefcase, 
  Users, 
  Award, 
  Search, 
  Filter, 
  Sparkles, 
  Plus, 
  RefreshCw, 
  ExternalLink,
  Layers,
  Check,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  VaultCategory, 
  VaultDocument, 
  VAULT_CATEGORIES, 
  loadCompanyVault, 
  saveCompanyVault, 
  addDocumentToVault, 
  removeDocumentFromVault,
  clearCompanyVault,
  calculateDocExpiryStatus
} from '../services/companyVaultService';
import { CompanyData, triggerFileDownload } from '../services/dossierGenerator';

interface CompanyVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyData;
  onVaultUpdated?: (docs: VaultDocument[]) => void;
}

export const CompanyVaultModal: React.FC<CompanyVaultModalProps> = ({
  isOpen,
  onClose,
  company,
  onVaultUpdated
}) => {
  const [docs, setDocs] = useState<VaultDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VaultCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  
  // Estado para modal de subida de nuevo documento
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<VaultCategory>('juridicos');
  const [uploadName, setUploadName] = useState('');
  const [uploadIssuedDate, setUploadIssuedDate] = useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | undefined>(undefined);

  // Cargar documentos de la empresa al abrir
  useEffect(() => {
    if (isOpen) {
      const loaded = loadCompanyVault(company.nit, company.name);
      setDocs(loaded);
      if (loaded.length > 0) {
        setSelectedDocId(loaded[0].id);
      } else {
        setSelectedDocId('');
      }
    }
  }, [isOpen, company.nit, company.name]);

  if (!isOpen) return null;

  // Filtrado de documentos
  const filteredDocs = docs.filter(d => {
    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.matchKeywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Métricas de estado de la Bóveda
  const totalDocs = docs.length;
  const validDocs = docs.filter(d => d.status === 'valid').length;
  const expiringDocs = docs.filter(d => d.status === 'expiring_soon').length;
  const expiredDocs = docs.filter(d => d.status === 'expired').length;
  const healthScore = totalDocs > 0 ? Math.round(((validDocs + expiringDocs * 0.5) / totalDocs) * 100) : 0;

  // Manejar subida de archivo real
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!uploadName.trim()) {
        setUploadName(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
      // Si el archivo es menor o igual a 15MB, guardar DataURL para descarga/previsualización real
      if (file.size <= 15 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setFileBase64(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFileBase64(undefined);
      }
    }
  };

  const handleSaveNewDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) return;

    const newDoc = addDocumentToVault(company.nit, {
      category: uploadCategory,
      name: uploadName.trim(),
      filename: selectedFile ? selectedFile.name : `${uploadName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
      fileType: selectedFile ? selectedFile.type : 'application/pdf',
      sizeBytes: selectedFile ? selectedFile.size : 500 * 1024,
      issuedDate: uploadIssuedDate || undefined,
      expiryDate: uploadExpiryDate || undefined,
      matchKeywords: [uploadName.toLowerCase(), uploadCategory],
      description: uploadNotes || `Documento cargado en Bóveda Empresarial (${uploadCategory})`,
      legalBasis: 'Acreditación Documental Empresarial',
      fileDataUrl: fileBase64
    });

    const updated = [newDoc, ...docs];
    setDocs(updated);
    setSelectedDocId(newDoc.id);
    setIsUploading(false);
    setSelectedFile(null);
    setFileBase64(undefined);
    setUploadName('');
    setUploadIssuedDate('');
    setUploadExpiryDate('');
    setUploadNotes('');

    if (onVaultUpdated) {
      onVaultUpdated(updated);
    }
  };

  const handleDeleteDoc = (docId: string) => {
    if (confirm('¿Deseas eliminar este documento de la Bóveda Empresarial?')) {
      const updated = removeDocumentFromVault(company.nit, docId);
      setDocs(updated);
      if (selectedDocId === docId) {
        setSelectedDocId(updated.length > 0 ? updated[0].id : '');
      }
      if (onVaultUpdated) {
        onVaultUpdated(updated);
      }
    }
  };

  const handleClearVault = () => {
    if (confirm('¿Estás seguro de que deseas eliminar TODOS los documentos de la Bóveda Empresarial? Esta acción es irreversible.')) {
      clearCompanyVault(company.nit);
      setDocs([]);
      setSelectedDocId('');
      if (onVaultUpdated) {
        onVaultUpdated([]);
      }
    }
  };

  // Descargar documento fiel
  const handleDownloadDoc = (doc: VaultDocument) => {
    if (doc.fileDataUrl) {
      const a = document.createElement('a');
      a.href = doc.fileDataUrl;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const blob = new Blob([`Documento oficial ${doc.name} para ${company.name} (NIT ${company.nit})`], { type: doc.fileType || 'application/pdf' });
    triggerFileDownload(blob, doc.filename);
  };

  const activeDoc = docs.find(d => d.id === selectedDocId) || (docs.length > 0 ? docs[0] : null);

  // Helper para iconos de categoría
  const renderCategoryIcon = (catId: VaultCategory) => {
    switch (catId) {
      case 'juridicos': return <Scale className="w-4 h-4 text-blue-600" />;
      case 'financieros': return <BadgeDollarSign className="w-4 h-4 text-emerald-600" />;
      case 'experiencia': return <Briefcase className="w-4 h-4 text-purple-600" />;
      case 'personal': return <Users className="w-4 h-4 text-amber-600" />;
      case 'certificaciones': return <Award className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-6xl w-full flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* =========================================================================
            1. ENCABEZADO DE LA BÓVEDA EMPRESARIAL
        ========================================================================== */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Bóveda Documental Empresarial
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  <span>Carga Única • Reutilización Permanente</span>
                </span>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${
                  totalDocs === 0
                    ? 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    : healthScore >= 90 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {totalDocs === 0 ? '0 Documentos • Bóveda Limpia' : `Salud Documental: ${healthScore}% (${validDocs} Vigentes)`}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Empresa: <span className="font-semibold text-slate-800 dark:text-slate-200">{company.name}</span> • NIT: <span className="font-semibold text-slate-800 dark:text-slate-200">{company.nit}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalDocs > 0 && (
              <button
                onClick={handleClearVault}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition-colors"
                title="Eliminar todos los documentos de la bóveda"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vaciar Bóveda</span>
              </button>
            )}

            <button
              onClick={() => setIsUploading(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Cargar Documento </span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA EXPLICATIVA DE AUTOMATIZACIÓN DE POSTULACIONES */}
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-slate-900/60 px-6 py-2.5 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>El Agente de IA inspecciona esta Bóveda en cada licitación para vincular automáticamente tus documentos habilitantes sin volver a subirlos.</span>
          </div>

          {expiredDocs > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{expiredDocs} documento(s) vencido(s) requieren renovación</span>
            </span>
          )}
        </div>

        {/* =========================================================================
            2. CUERPO: EXPLORADOR DE CARPETAS + LISTA + DETALLE
        ========================================================================== */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* PANEL LATERAL DE CARPETAS Y BÚSQUEDA (4 COLS) */}
          <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-3 overflow-y-auto">
            
            {/* BUSCADOR */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar documento en la bóveda..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* BOTONES DE CARPETAS ESTRUCTURADAS */}
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  <span>Todas las Carpetas</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  {docs.length}
                </span>
              </button>

              {VAULT_CATEGORIES.map(cat => {
                const count = docs.filter(d => d.category === cat.id).length;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderCategoryIcon(cat.id)}
                      <span className="truncate">{cat.title}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200/70 dark:bg-slate-800">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* LISTA DE DOCUMENTOS FILTRADOS */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Archivos en Bóveda ({filteredDocs.length})
              </span>

              {filteredDocs.map(doc => {
                const isSelected = selectedDocId === doc.id;
                let statusBadge = '✓ Vigente';
                let statusClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

                if (doc.status === 'expiring_soon') {
                  statusBadge = '⏳ Por Vencer';
                  statusClass = 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                } else if (doc.status === 'expired') {
                  statusBadge = '⚠️ Vencido';
                  statusClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800 font-bold';
                }

                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white/70 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 mt-0.5">
                        {renderCategoryIcon(doc.category)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {doc.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {doc.filename} • {(doc.sizeBytes / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold border flex-shrink-0 ${statusClass}`}>
                      {statusBadge}
                    </span>
                  </button>
                );
              })}

              {filteredDocs.length === 0 && (
                <div className="py-8 px-2 text-center text-slate-400 text-xs space-y-2">
                  <Folder className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
                  <p>No hay documentos en esta carpeta.</p>
                  <button
                    onClick={() => {
                      if (selectedCategory !== 'all') {
                        setUploadCategory(selectedCategory);
                      }
                      setIsUploading(true);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-block"
                  >
                    + Cargar documento aquí
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* =========================================================================
              3. ÁREA DE DETALLE Y PREVISUALIZACIÓN DEL DOCUMENTO SELECCIONADO (8 COLS)
          ========================================================================== */}
          <div className="md:col-span-8 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
            {activeDoc ? (
              <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
                
                {/* ENCABEZADO DE DETALLE */}
                <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {activeDoc.category}
                      </span>
                      {activeDoc.subcategory && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {activeDoc.subcategory}
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                        activeDoc.status === 'valid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : activeDoc.status === 'expiring_soon'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}>
                        {activeDoc.status === 'valid' ? '✓ Vigente para Licitaciones' : activeDoc.status === 'expiring_soon' ? '⏳ Vence Prontamente' : '⚠️ Vencido'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {activeDoc.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Archivo: {activeDoc.filename} • Tamaño: {(activeDoc.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadDoc(activeDoc)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Copia</span>
                    </button>

                    <button
                      onClick={() => handleDeleteDoc(activeDoc.id)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Eliminar de la bóveda"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* METADATOS Y VIGENCIA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Expedición</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {activeDoc.issuedDate || 'No registrada'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Vencimiento</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {activeDoc.expiryDate || 'Indefinida / Conforme a Ley'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Carga en Bóveda</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {activeDoc.uploadedAt}
                    </p>
                  </div>
                </div>

                {/* DESCRIPCIÓN Y FUNDAMENTO LEGAL */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-[11px]">
                      Propósito y Validez Contractual
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeDoc.description}
                  </p>
                  <p className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    Fundamento Jurídico: <strong className="text-slate-700 dark:text-slate-300">{activeDoc.legalBasis}</strong>
                  </p>
                </div>

                {/* MOTOR DE AUTOVINCULACIÓN IA */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-blue-50/70 dark:from-indigo-950/30 dark:to-slate-900/60 border border-indigo-200 dark:border-indigo-800/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-indigo-950 dark:text-indigo-200 text-[11px]">
                      Autovinculación con Procesos SECOP
                    </span>
                  </div>
                  <p className="text-indigo-900 dark:text-indigo-300 leading-relaxed text-[11.5px]">
                    Este archivo está configurado para emparejarse automáticamente cuando cualquier pliego de SECOP I o SECOP II solicite requisitos coincidentes con:
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {activeDoc.matchKeywords.map(kw => (
                      <span key={kw} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-[10.5px] border border-indigo-200 dark:border-indigo-800">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* SIMULACIÓN DE CONTENIDO DEL ARCHIVO */}
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5 max-w-sm mx-auto">
                    <p className="font-bold text-xs text-slate-900 dark:text-white">
                      Documento Listo y Verificado en Bóveda
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Cumple con los requisitos de interoperabilidad para firma digital, compresión ZIP y radicación electrónica.
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <FolderPlus className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Bóveda Documental Vacía
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    No hay documentos cargados para <strong className="text-slate-800 dark:text-slate-200">{company.name}</strong>. Carga tus documentos habilitantes legítimos (RUT, Cámara de Comercio, RUP, Estados Financieros, etc.) para que el Agente de IA pueda autovincularlos a los pliegos de SECOP.
                  </p>
                </div>
                <button
                  onClick={() => setIsUploading(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cargar Mi Primer Documento 
          
                  </span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* =========================================================================
          MODAL SECUNDARIO: CARGA DE NUEVO DOCUMENTO A LA BÓVEDA
      ========================================================================== */}
      {isUploading && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Cargar Documento a la Bóveda
                  </h3>
                  <p className="text-xs text-slate-500">
                    Se guardará de forma permanente para todas tus licitaciones
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploading(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewDocument} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Carpeta de Destino
                </label>
                <select
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value as VaultCategory)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="juridicos">📁 Documentos Jurídicos (RUT, Cámara, RUP, Cédula, Parafiscales)</option>
                  <option value="financieros">📁 Estados Financieros (Balance, Resultados, Dictamen Revisor)</option>
                  <option value="experiencia">📁 Experiencia (Contratos, Actas de Liquidación, Certificaciones)</option>
                  <option value="personal">📁 Personal & Talento Clave (Hojas de Vida, Tarjetas Profesionales)</option>
                  <option value="certificaciones">📁 Certificaciones (ISO 9001, ISO 27001, SST, Mipyme)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Documento
                </label>
                <input
                  type="text"
                  placeholder="Ej: Registro Único Tributario 2026..."
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Expedición
                  </label>
                  <input
                    type="date"
                    value={uploadIssuedDate}
                    onChange={e => setUploadIssuedDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={uploadExpiryDate}
                    onChange={e => setUploadExpiryDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seleccionar Archivo (PDF, Word o ZIP)
                </label>
                <label className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-slate-950">
                  <UploadCloud className="w-6 h-6 text-indigo-600 mb-1" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    {selectedFile ? selectedFile.name : 'Haz clic para seleccionar el archivo de tu equipo'}
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, DOCX, ZIP hasta 25 MB</span>
                  <input type="file" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.zip,.png,.jpg" className="hidden" />
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas / Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Contrato con Alcaldía de Medellín por 350 SMMLV..."
                  value={uploadNotes}
                  onChange={e => setUploadNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!uploadName.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Guardar en Bóveda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
