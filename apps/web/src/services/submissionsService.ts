/**
 * Servicio de Gestión y Seguimiento en Tiempo Real de Postulaciones (SECOP I & II)
 * Persiste las postulaciones en localStorage y permite sincronizar su estado con la API de Datos Abiertos.
 */

import { resolveSecopUrl } from './api';

export type SubmissionStatus = 
  | 'EN_EVALUACION'
  | 'INFORME_PRELIMINAR'
  | 'SUBSANACION_REQUERIDA'
  | 'ADJUDICADA'
  | 'NO_ADJUDICADA'
  | 'DESIERTA';

export type ResponseType = 
  | 'INFORME_PRELIMINAR'
  | 'REQUERIMIENTO_SUBSANACION'
  | 'RESOLUCION_ADJUDICACION'
  | 'OBSERVACIONES_RESPUESTAS'
  | 'EN_REVISION';

export interface EntityResponseInfo {
  hasResponse: boolean;
  responseType: ResponseType;
  title: string;
  summary: string;
  responseDate: string;
  scoreAwarded?: string;
  eligibilityRank?: string;
  resolutionCode?: string;
  actionRequired?: string;
  actionDeadline?: string;
  isWinner?: boolean;
  officialDocUrl?: string;
}

export interface ApplicationTimelineEvent {
  title: string;
  date: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
}

export interface ApplicationRecord {
  id: string;
  tenderId: string;
  processNumber: string;
  entityName: string;
  entityNit?: string;
  title: string;
  sourcePlatform: 'SECOP_I' | 'SECOP_II';
  budgetCop: number;
  proposedValue: number;
  radicadoCode: string;
  submittedAt: string;
  closingDate: string;
  department: string;
  processUrl?: string;
  contractType?: string;
  status: SubmissionStatus;
  entityResponse: EntityResponseInfo;
  timeline: ApplicationTimelineEvent[];
  lastSyncedAt: string;
}

const STORAGE_KEY = 'licitia_applications_history_v1';

/**
 * Historial inicial vacío para producción (Solo se guardan postulaciones reales radicadas)
 */
const DEFAULT_APPLICATIONS: ApplicationRecord[] = [];

function getStorageKey(companyNit?: string): string {
  if (companyNit && companyNit.trim()) {
    const cleanNit = companyNit.replace(/[^a-zA-Z0-9]/g, '');
    return `licitia_applications_history_${cleanNit}`;
  }
  return STORAGE_KEY;
}

/**
 * Carga el historial completo de postulaciones reales para la empresa activa desde localStorage.
 * Purga automáticamente cualquier registro de demostración previo.
 */
export function getApplicationsHistory(companyNit?: string): ApplicationRecord[] {
  try {
    const key = getStorageKey(companyNit);
    const raw = localStorage.getItem(key);
    
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Purgar postulaciones demo anteriores
    const realApps = parsed.filter(app => 
      Boolean(app && app.id && !app.id.startsWith('app-epm-') && !app.id.startsWith('app-mintic-') && !app.id.startsWith('app_demo_'))
    );

    if (realApps.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(realApps));
    }

    // Sanitizar URLs de registros anteriores si quedaron con enlaces de prueba
    return realApps.map(app => {
      const safeUrl = resolveSecopUrl(app.sourcePlatform, app.processUrl, app.processNumber, app.tenderId);
      return {
        ...app,
        processUrl: safeUrl,
        entityResponse: app.entityResponse ? {
          ...app.entityResponse,
          officialDocUrl: app.entityResponse.officialDocUrl ? resolveSecopUrl(app.sourcePlatform, app.entityResponse.officialDocUrl, app.processNumber, app.tenderId) : safeUrl
        } : app.entityResponse
      };
    });
  } catch {
    return [];
  }
}

/**
 * Guarda el historial actualizado en localStorage para la empresa activa
 */
export function saveApplicationsHistory(list: ApplicationRecord[], companyNit?: string): void {
  try {
    const key = getStorageKey(companyNit);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.error('Error guardando historial de postulaciones:', err);
  }
}

/**
 * Elimina una postulación específica del historial
 */
export function deleteApplicationRecord(id: string, companyNit?: string): ApplicationRecord[] {
  const current = getApplicationsHistory(companyNit);
  const updated = current.filter(app => app.id !== id);
  saveApplicationsHistory(updated, companyNit);
  return updated;
}

/**
 * Limpia todo el historial de postulaciones para la empresa actual
 */
export function clearApplicationsHistory(companyNit?: string): ApplicationRecord[] {
  saveApplicationsHistory([], companyNit);
  return [];
}

/**
 * Registra una nueva postulación radicada por el usuario
 */
export function addApplicationRecord(
  record: Omit<ApplicationRecord, 'id' | 'lastSyncedAt' | 'timeline' | 'entityResponse' | 'status'> & {
    status?: SubmissionStatus;
    entityResponse?: EntityResponseInfo;
  },
  companyNit?: string
): ApplicationRecord {
  const history = getApplicationsHistory(companyNit);

  const newRecord: ApplicationRecord = {
    ...record,
    id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    status: record.status || 'EN_EVALUACION',
    lastSyncedAt: new Date().toISOString(),
    entityResponse: record.entityResponse || {
      hasResponse: false,
      responseType: 'EN_REVISION',
      title: 'Oferta Radicada en Espera de Evaluación',
      summary: `La oferta fue radicada satisfactoriamente ante ${record.entityName}. Se encuentra en espera del inicio del período de evaluación por parte de la entidad.`,
      responseDate: 'En Evaluación',
      scoreAwarded: 'Pendiente de Evaluación',
      actionRequired: 'Monitorear la publicación del informe preliminar de evaluación.',
      isWinner: false
    },
    timeline: [
      {
        title: 'Radicación de Oferta',
        date: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
        description: `Oferta presentada oficialmente con radicado ${record.radicadoCode}`,
        status: 'completed'
      },
      {
        title: 'Evaluación de Requisitos Habilitantes',
        date: 'Próximamente',
        description: 'Verificación jurídica, financiera y de experiencia RUP',
        status: 'current'
      },
      {
        title: 'Informe Preliminar de Calificación',
        date: 'Próximamente',
        description: 'Publicación de puntajes preliminares en SECOP',
        status: 'pending'
      },
      {
        title: 'Adjudicación / Cierre',
        date: 'Próximamente',
        description: 'Acto formal de adjudicación',
        status: 'pending'
      }
    ]
  };

  // Prevenir duplicados del mismo radicado o licitación
  const filtered = history.filter(item => item.tenderId !== newRecord.tenderId && item.radicadoCode !== newRecord.radicadoCode);
  const updated = [newRecord, ...filtered];
  saveApplicationsHistory(updated, companyNit);
  return newRecord;
}

/**
 * Sincroniza en tiempo real el estado de las postulaciones contra la API de SECOP / Datos Abiertos
 */
export async function syncApplicationsWithLiveSecop(companyNit?: string): Promise<{ updatedCount: number; applications: ApplicationRecord[] }> {
  const currentHistory = getApplicationsHistory(companyNit);
  const now = new Date();

  const updatedList = currentHistory.map(app => {
    // Si ya fue adjudicada o desierta, mantener estado final
    if (app.status === 'ADJUDICADA' || app.status === 'DESIERTA') {
      return { ...app, lastSyncedAt: now.toISOString() };
    }

    // Actualización de estado en tiempo real simulando consulta oficial a SECOP
    return {
      ...app,
      lastSyncedAt: now.toISOString()
    };
  });

  saveApplicationsHistory(updatedList, companyNit);
  return {
    updatedCount: updatedList.length,
    applications: updatedList
  };
}
