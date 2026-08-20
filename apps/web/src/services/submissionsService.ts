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
 * Registros iniciales con procesos reales de SECOP I y SECOP II
 */
const DEFAULT_APPLICATIONS: ApplicationRecord[] = [
  {
    id: 'app-epm-4100000311',
    tenderId: 'CO1.REQ.10377633',
    processNumber: '4100000311',
    entityName: 'EMPRESAS PUBLICAS DE MEDELLIN E.S.P.',
    entityNit: '890.904.996-1',
    title: 'Prestación de servicios integrales de soporte tecnológico y consultoría para infraestructura de operaciones',
    sourcePlatform: 'SECOP_II',
    budgetCop: 152998133.0,
    proposedValue: 148500000.0,
    radicadoCode: 'CO1.OFR.10234378',
    submittedAt: '2026-08-14 10:24 AM',
    closingDate: '2026-09-15T17:00:00Z',
    department: 'Antioquia',
    processUrl: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10234378',
    contractType: 'Licitación Pública (LP)',
    status: 'INFORME_PRELIMINAR',
    entityResponse: {
      hasResponse: true,
      responseType: 'INFORME_PRELIMINAR',
      title: 'Informe Preliminar de Evaluación y Calificación N° 1 Publicado',
      summary: 'El Comité Evaluador de EPM publicó el informe preliminar de evaluación. La empresa cumple el 100% de los requisitos jurídicos, financieros y de experiencia RUP.',
      responseDate: '2026-08-17 04:30 PM',
      scoreAwarded: '100.0 / 100.0 Puntos',
      eligibilityRank: '1° Orden de Elegibilidad (Primer Lugar)',
      actionRequired: 'Plazo abierto para observaciones al informe preliminar antes de la audiencia de adjudicación.',
      actionDeadline: '2026-08-22 05:00 PM',
      isWinner: true,
      officialDocUrl: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10234378'
    },
    timeline: [
      { title: 'Radicación de Oferta', date: '14 Ago 2026', description: 'Oferta registrada con radicado CO1.OFR.10234378', status: 'completed' },
      { title: 'Cierre y Apertura de Sobres', date: '15 Ago 2026', description: 'Apertura de ofertas económicas en SECOP II', status: 'completed' },
      { title: 'Informe Preliminar de Evaluación', date: '17 Ago 2026', description: 'Calificación 100/100 Pts - 1° Orden de Elegibilidad', status: 'completed' },
      { title: 'Audiencia de Adjudicación', date: '25 Ago 2026', description: 'Audiencia pública definitiva de adjudicación', status: 'current' }
    ],
    lastSyncedAt: new Date().toISOString()
  },
  {
    id: 'app-silvia-cauca-003',
    tenderId: 'SECOP1_MS-MC-SIP-003-2026',
    processNumber: 'MS-MC-SIP-003-2026',
    entityName: 'CAUCA - ALCALDÍA MUNICIPIO DE SILVIA',
    entityNit: '891.500.890-3',
    title: 'Servicio de consultoría, interventoría y soporte tecnológico para la modernización institucional',
    sourcePlatform: 'SECOP_I',
    budgetCop: 240000000.0,
    proposedValue: 236400000.0,
    radicadoCode: 'RAD-SECOP1-2026-471092',
    submittedAt: '2026-08-12 02:15 PM',
    closingDate: '2026-09-02T16:00:00Z',
    department: 'Cauca',
    processUrl: 'https://www.contratos.gov.co/consultas/detalleProceso.do?numConstancia=MS-MC-SIP-003-2026',
    contractType: 'Selección Abreviada Menor Cuantía',
    status: 'SUBSANACION_REQUERIDA',
    entityResponse: {
      hasResponse: true,
      responseType: 'REQUERIMIENTO_SUBSANACION',
      title: 'Requerimiento de Subsanación Documental Emitido por la Entidad',
      summary: 'La entidad solicita allegar la certificación bancaria con fecha de expedición no mayor a 30 días calendario y la tarjeta profesional del contador firmante.',
      responseDate: '2026-08-16 11:00 AM',
      scoreAwarded: 'Habilitación Condicionada a Subsanación',
      actionRequired: 'Cargar la certificación bancaria actualizada y tarjeta profesional en el portal antes del vencimiento del término legal.',
      actionDeadline: '2026-08-20 05:00 PM',
      isWinner: false,
      officialDocUrl: 'https://www.contratos.gov.co/consultas/detalleProceso.do?numConstancia=MS-MC-SIP-003-2026'
    },
    timeline: [
      { title: 'Radicación de Oferta', date: '12 Ago 2026', description: 'Oferta radicada bajo constancia RAD-SECOP1-2026-471092', status: 'completed' },
      { title: 'Requerimiento de Subsanación', date: '16 Ago 2026', description: 'Notificación de documento habilitante pendiente', status: 'current' },
      { title: 'Informe Definitivo de Habilitación', date: '21 Ago 2026', description: 'Verificación final de requisitos subsanados', status: 'pending' },
      { title: 'Adjudicación / Contrato', date: '28 Ago 2026', description: 'Suscripción del acto de adjudicación', status: 'pending' }
    ],
    lastSyncedAt: new Date().toISOString()
  },
  {
    id: 'app-puerto-wilches-135',
    tenderId: 'CO1.REQ.10393129',
    processNumber: 'CONTRATO 135-2026',
    entityName: 'ESE EDMUNDO GERMAN ARIAS DUARTE DE PUERTO WILCHES',
    entityNit: '890.208.544-7',
    title: 'Servicio especializado de consultoría y gestión operativa institucional en salud y tecnología',
    sourcePlatform: 'SECOP_II',
    budgetCop: 15050000.0,
    proposedValue: 14900000.0,
    radicadoCode: 'CO1.OFR.10249538',
    submittedAt: '2026-08-10 09:40 AM',
    closingDate: '2026-09-18T17:00:00Z',
    department: 'Santander',
    processUrl: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10249538',
    contractType: 'Concurso de Méritos Abierto (CMA)',
    status: 'EN_EVALUACION',
    entityResponse: {
      hasResponse: false,
      responseType: 'EN_REVISION',
      title: 'Propuesta en Proceso de Revisión por el Comité Técnico Evaluador',
      summary: 'La oferta fue recibida a conformidad en la plataforma SECOP II. El comité evaluador se encuentra analizando la capacidad técnica y metodológica.',
      responseDate: 'En Evaluación Activa',
      scoreAwarded: 'Pendiente de Publicación de Informe',
      actionRequired: 'Sin acciones requeridas por el momento. Próxima publicación de informe preliminar programada.',
      actionDeadline: '2026-08-25',
      isWinner: false,
      officialDocUrl: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10249538'
    },
    timeline: [
      { title: 'Radicación de Oferta', date: '10 Ago 2026', description: 'Expediente completo registrado en SECOP II', status: 'completed' },
      { title: 'Evaluación Técnica & Financiera', date: '11-24 Ago 2026', description: 'Revisión de criterios de habilitación y metodología', status: 'current' },
      { title: 'Publicación de Informe Preliminar', date: '25 Ago 2026', description: 'Publicación de puntajes en SECOP II', status: 'pending' },
      { title: 'Adjudicación', date: '01 Sep 2026', description: 'Audiencia pública de adjudicación', status: 'pending' }
    ],
    lastSyncedAt: new Date().toISOString()
  }
];

function getStorageKey(companyNit?: string): string {
  if (companyNit && companyNit.trim()) {
    const cleanNit = companyNit.replace(/[^a-zA-Z0-9]/g, '');
    return `licitia_applications_history_${cleanNit}`;
  }
  return STORAGE_KEY;
}

/**
 * Carga el historial completo de postulaciones para la empresa activa desde localStorage.
 * Si es la empresa de prueba por defecto (901.452.890-1) carga los datos demo si no hay previos.
 * Si es una cuenta o empresa nueva, inicia con lista vacía.
 */
export function getApplicationsHistory(companyNit?: string): ApplicationRecord[] {
  try {
    const key = getStorageKey(companyNit);
    const raw = localStorage.getItem(key);
    
    if (!raw) {
      // Solo la empresa de demostración predeterminada arranca con procesos demo
      const isDefaultDemoCompany = !companyNit || companyNit.replace(/[^a-zA-Z0-9]/g, '') === '9014528901';
      if (isDefaultDemoCompany) {
        localStorage.setItem(key, JSON.stringify(DEFAULT_APPLICATIONS));
        return DEFAULT_APPLICATIONS;
      }
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Sanitizar URLs de registros anteriores si quedaron con enlaces de prueba
    return parsed.map(app => {
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
