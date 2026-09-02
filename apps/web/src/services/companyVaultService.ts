/**
 * Repositorio Documental Empresarial (Bóveda Digital de Postulación SECOP)
 * Permite a la empresa cargar sus documentos una sola vez organizados por carpetas:
 * - Jurídicos (RUT, Cámara de Comercio, RUP, Cédula, Parafiscales)
 * - Financieros (Balance General, Estado de Resultados, Dictamen Revisor Fiscal, Renta)
 * - Experiencia (Contratos Ejecutados, Actas de Liquidación, Certificaciones)
 * - Personal (Hojas de Vida, Tarjetas Profesionales, Diplomas, Especialistas)
 * - Certificaciones (ISO 9001, ISO 27001, SST / ISO 45001, Mipyme)
 * 
 * Incluye motor de IA para autovinculación a licitaciones y auditoría de vigencias.
 */

export type VaultCategory = 'juridicos' | 'financieros' | 'experiencia' | 'personal' | 'certificaciones';

export interface VaultDocument {
  id: string;
  category: VaultCategory;
  subcategory?: string;
  name: string;
  filename: string;
  fileType: string;
  sizeBytes: number;
  uploadedAt: string;
  issuedDate?: string;
  expiryDate?: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  matchKeywords: string[];
  description: string;
  legalBasis: string;
  legal_basis?: string;
  fileDataUrl?: string; // Para previsualización o descarga
}

export interface VaultCategoryMeta {
  id: VaultCategory;
  title: string;
  iconName: string;
  description: string;
  color: string;
  suggestedDocs: string[];
}

export const VAULT_CATEGORIES: VaultCategoryMeta[] = [
  {
    id: 'juridicos',
    title: 'Documentos Jurídicos',
    iconName: 'Scale',
    description: 'Capacidad jurídica, representación legal y personería de la empresa',
    color: 'blue',
    suggestedDocs: ['RUT Actualizado', 'Cámara de Comercio (Vigencia 30 días)', 'Certificado RUP Vigente', 'Cédula Representante Legal', 'Paz y Salvo Parafiscales (Ley 789)']
  },
  {
    id: 'financieros',
    title: 'Estados Financieros',
    iconName: 'BadgeDollarSign',
    description: 'Balances, estados de resultados y certificaciones contables',
    color: 'emerald',
    suggestedDocs: ['Balance General / Estado de Situación Financiera', 'Estado de Resultados Integral', 'Certificación y Dictamen de Revisor Fiscal / Contador', 'Declaración de Renta DIAN']
  },
  {
    id: 'experiencia',
    title: 'Soportes de Experiencia',
    iconName: 'Briefcase',
    description: 'Contratos ejecutados, actas de liquidación y certificaciones de cumplimiento',
    color: 'purple',
    suggestedDocs: ['Contratos Públicos y Privados Ejecutados', 'Actas de Liquidación y Entrega Final', 'Certificaciones de Cumplimiento a Satisfacción (SMMLV y UNSPSC)']
  },
  {
    id: 'personal',
    title: 'Personal & Talento Clave',
    iconName: 'Users',
    description: 'Hojas de vida, tarjetas profesionales, diplomas y certificaciones del equipo',
    color: 'amber',
    suggestedDocs: ['Hojas de Vida Función Pública', 'Tarjetas Profesionales (COPNIA, CPNAA, JCC)', 'Diplomas y Actas de Grado', 'Certificaciones de Experiencia Específica de Profesionales']
  },
  {
    id: 'certificaciones',
    title: 'Sistemas de Gestión & Calidad',
    iconName: 'Award',
    description: 'Certificaciones ISO, seguridad y salud en el trabajo, y acreditaciones',
    color: 'sky',
    suggestedDocs: ['ISO 9001 (Calidad)', 'ISO 27001 (Seguridad de la Información)', 'SST / ISO 45001 (Seguridad y Salud)', 'Certificación Mipyme / Industria Nacional']
  }
];

// Comprobar estado de vigencia a partir de la fecha de expedición / vencimiento
export function calculateDocExpiryStatus(expiryDateStr?: string, issuedDateStr?: string, category?: VaultCategory): 'valid' | 'expiring_soon' | 'expired' {
  const now = new Date();
  
  // Si tiene fecha de vencimiento explícita
  if (expiryDateStr) {
    const expiry = new Date(expiryDateStr);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring_soon';
    return 'valid';
  }

  // Si tiene fecha de expedición (para Cámara de Comercio que vence a los 30 días, o Parafiscales que vence a los 30 días)
  if (issuedDateStr) {
    const issued = new Date(issuedDateStr);
    const ageDays = Math.floor((now.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24));
    
    // Cámara de Comercio y Parafiscales tienen vigencia de 30 días en contratación pública
    if (category === 'juridicos') {
      if (ageDays > 30) return 'expired';
      if (ageDays > 20) return 'expiring_soon';
      return 'valid';
    }
  }

  return 'valid';
}

// Obtener documentos por defecto para una empresa (Vacío en producción - Solo archivos reales)
export function getDefaultCompanyVault(_companyNit?: string, _companyName?: string): VaultDocument[] {
  return [];
}

// Vaciar completamente la Bóveda Documental
export function clearCompanyVault(companyNit: string): void {
  if (typeof window === 'undefined') return;
  const storageKey = `licitia_vault_${companyNit || 'default'}`;
  try {
    localStorage.removeItem(storageKey);
  } catch (err) {
    console.error('[Company Vault] Error clearing vault:', err);
  }
}

// Cargar Bóveda Documental de LocalStorage (Purga automáticamente cualquier dato demo y conserva solo archivos reales)
export function loadCompanyVault(companyNit: string, _companyName?: string): VaultDocument[] {
  if (typeof window === 'undefined') return [];

  const storageKey = `licitia_vault_${companyNit || 'default'}`;
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    saveCompanyVault(companyNit, []);
    return [];
  }

  try {
    const parsed: VaultDocument[] = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      saveCompanyVault(companyNit, []);
      return [];
    }

    // Filtrar documentos de prueba heredados (IDs como 'doc_rut_oficial', 'doc_camara_comercio', etc.)
    // Los documentos reales subidos por el usuario inician con 'vault_doc_'
    const realDocs = parsed.filter(doc => 
      Boolean(doc && doc.id && !doc.id.startsWith('doc_') && doc.id.startsWith('vault_doc_'))
    );

    // Si existían documentos demo de prueba en el navegador, depurarlos de inmediato
    if (realDocs.length !== parsed.length) {
      saveCompanyVault(companyNit, realDocs);
    }

    // Recalcular estados de vigencia únicamente para los documentos reales
    return realDocs.map(doc => ({
      ...doc,
      status: calculateDocExpiryStatus(doc.expiryDate, doc.issuedDate, doc.category)
    }));
  } catch (err) {
    console.warn('[Company Vault] Error parsing stored vault, resetting to empty:', err);
    saveCompanyVault(companyNit, []);
    return [];
  }
}

// Guardar Bóveda Documental en LocalStorage
export function saveCompanyVault(companyNit: string, docs: VaultDocument[]): void {
  if (typeof window === 'undefined') return;
  const storageKey = `licitia_vault_${companyNit || 'default'}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(docs));
  } catch (err) {
    console.error('[Company Vault] Error saving vault:', err);
  }
}

// Agregar nuevo documento a la Bóveda
export function addDocumentToVault(companyNit: string, newDoc: Omit<VaultDocument, 'id' | 'uploadedAt' | 'status'>): VaultDocument {
  const currentDocs = loadCompanyVault(companyNit, '');
  const id = `vault_doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const uploadedAt = new Date().toISOString().split('T')[0];
  const status = calculateDocExpiryStatus(newDoc.expiryDate, newDoc.issuedDate, newDoc.category);

  const fullDoc: VaultDocument = {
    ...newDoc,
    id,
    uploadedAt,
    status
  };

  const updatedDocs = [fullDoc, ...currentDocs];
  saveCompanyVault(companyNit, updatedDocs);
  return fullDoc;
}

// Eliminar documento de la Bóveda
export function removeDocumentFromVault(companyNit: string, docId: string): VaultDocument[] {
  const currentDocs = loadCompanyVault(companyNit, '');
  const updated = currentDocs.filter(d => d.id !== docId);
  saveCompanyVault(companyNit, updated);
  return updated;
}

/**
 * MOTOR DE EMPAREJAMIENTO INTELIGENTE IA:
 * Cruza los requerimientos de cualquier licitación contra la Bóveda Documental de la Empresa.
 * Identifica cuáles documentos ya existen, cuáles están vigentes y los vincula automáticamente.
 */
export function matchVaultDocsToRequirements(
  requiredDocTitlesOrIds: string[], 
  vaultDocs: VaultDocument[]
): {
  matched: Record<string, VaultDocument>;
  missing: string[];
  expiring: VaultDocument[];
  expired: VaultDocument[];
  readinessPercentage: number;
} {
  const matched: Record<string, VaultDocument> = {};
  const missing: string[] = [];
  const expiring: VaultDocument[] = [];
  const expired: VaultDocument[] = [];

  for (const req of requiredDocTitlesOrIds) {
    const reqLower = req.toLowerCase();
    
    // Buscar el mejor documento en la bóveda que coincida por palabras clave o nombre
    const foundDoc = vaultDocs.find(vDoc => {
      const vNameLower = vDoc.name.toLowerCase();
      const vFileLower = vDoc.filename.toLowerCase();
      
      // Coincidencia directa en keywords
      const keywordHit = vDoc.matchKeywords.some(kw => reqLower.includes(kw.toLowerCase()));
      if (keywordHit) return true;

      // Coincidencias clásicas de contratación pública
      if (reqLower.includes('rup') && (vNameLower.includes('rup') || vDoc.id.includes('rup'))) return true;
      if (reqLower.includes('rut') && (vNameLower.includes('rut') || vDoc.id.includes('rut'))) return true;
      if (reqLower.includes('camara') && (vNameLower.includes('camara') || vNameLower.includes('comercio'))) return true;
      if (reqLower.includes('parafiscales') && (vNameLower.includes('parafiscales') || vNameLower.includes('789'))) return true;
      if (reqLower.includes('balance') && (vNameLower.includes('balance') || vDoc.category === 'financieros')) return true;
      if (reqLower.includes('experiencia') && vDoc.category === 'experiencia') return true;
      if ((reqLower.includes('hoja de vida') || reqLower.includes('equipo')) && vDoc.category === 'personal') return true;
      if (reqLower.includes('iso') && vNameLower.includes('iso')) return true;

      return false;
    });

    if (foundDoc) {
      matched[req] = foundDoc;
      if (foundDoc.status === 'expiring_soon' && !expiring.some(d => d.id === foundDoc.id)) {
        expiring.push(foundDoc);
      } else if (foundDoc.status === 'expired' && !expired.some(d => d.id === foundDoc.id)) {
        expired.push(foundDoc);
      }
    } else {
      missing.push(req);
    }
  }

  const total = requiredDocTitlesOrIds.length;
  const readyCount = Object.keys(matched).filter(req => matched[req].status !== 'expired').length;
  const readinessPercentage = total > 0 ? Math.round((readyCount / total) * 100) : 100;

  return {
    matched,
    missing,
    expiring,
    expired,
    readinessPercentage
  };
}
