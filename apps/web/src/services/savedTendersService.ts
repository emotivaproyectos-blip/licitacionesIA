/**
 * Servicio de Gestión de Licitaciones Guardadas (Favoritos) y Seguimiento de Intereses
 * Persistencia en localStorage por NIT/cuenta de usuario para soporte multiusuario local.
 */

import type { TenderDTO } from './api';

const STORAGE_KEY_PREFIX = 'licitia_saved_tenders_';
const SEARCHES_KEY_PREFIX = 'licitia_recent_searches_';
const VIEWS_KEY_PREFIX = 'licitia_viewed_tenders_';

export const SAVED_TENDERS_CHANGE_EVENT = 'licitia_saved_tenders_updated';

function getStorageKey(prefix: string, userNit?: string): string {
  const cleanNit = (userNit || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
  return `${prefix}${cleanNit}`;
}

/**
 * Obtiene todas las licitaciones guardadas por el usuario actual
 */
export function getSavedTenders(userNit?: string): TenderDTO[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const key = getStorageKey(STORAGE_KEY_PREFIX, userNit);
    let raw = localStorage.getItem(key);
    if (!raw && userNit) {
      raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}default`);
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Error al leer licitaciones guardadas:', err);
    return [];
  }
}

/**
 * Obtiene el conjunto de IDs de licitaciones guardadas para búsquedas O(1)
 * Incluye id, secop_id y process_number para máxima compatibilidad.
 */
export function getSavedTenderIds(userNit?: string): Set<string> {
  const list = getSavedTenders(userNit);
  const set = new Set<string>();
  list.forEach(t => {
    if (t.id) set.add(String(t.id));
    if (t.secop_id) set.add(String(t.secop_id));
    if (t.process_number) set.add(String(t.process_number));
  });
  return set;
}

/**
 * Comprueba si una licitación está guardada (acepta string o TenderDTO)
 */
export function isTenderSaved(tenderOrId: TenderDTO | string, userNit?: string): boolean {
  if (!tenderOrId) return false;
  const ids = getSavedTenderIds(userNit);
  if (typeof tenderOrId === 'string') {
    return ids.has(tenderOrId);
  }
  return Boolean(
    (tenderOrId.id && ids.has(String(tenderOrId.id))) ||
    (tenderOrId.secop_id && ids.has(String(tenderOrId.secop_id))) ||
    (tenderOrId.process_number && ids.has(String(tenderOrId.process_number)))
  );
}

/**
 * Guarda una licitación en favoritos
 */
export function saveTender(tender: TenderDTO, userNit?: string): boolean {
  if (!tender) return false;
  const current = getSavedTenders(userNit);
  const targetId = tender.id || tender.secop_id || tender.process_number;
  if (!targetId) return false;
  
  const alreadySaved = current.some(t => 
    (t.id && (t.id === targetId || (tender.id && t.id === tender.id))) ||
    (t.secop_id && (t.secop_id === targetId || (tender.secop_id && t.secop_id === tender.secop_id))) ||
    (t.process_number && (t.process_number === targetId || (tender.process_number && t.process_number === tender.process_number)))
  );

  if (alreadySaved) {
    return false; // Ya existía
  }

  const normalizedTender: TenderDTO = {
    ...tender,
    id: tender.id || targetId
  };

  const updated = [normalizedTender, ...current].slice(0, 100); // Límite de 100 guardadas
  try {
    localStorage.setItem(getStorageKey(STORAGE_KEY_PREFIX, userNit), JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SAVED_TENDERS_CHANGE_EVENT, { detail: { tender: normalizedTender, action: 'saved' } }));
    }
    return true;
  } catch (err) {
    console.error('Error al guardar licitación:', err);
    return false;
  }
}

/**
 * Elimina una licitación de guardadas (acepta ID o TenderDTO)
 */
export function removeSavedTender(tenderOrId: TenderDTO | string, userNit?: string): boolean {
  if (!tenderOrId) return false;
  const targetId = typeof tenderOrId === 'string' 
    ? tenderOrId 
    : (tenderOrId.id || tenderOrId.secop_id || tenderOrId.process_number);
  if (!targetId) return false;

  const current = getSavedTenders(userNit);
  const updated = current.filter(t => {
    if (t.id && (t.id === targetId || (typeof tenderOrId !== 'string' && tenderOrId.id && t.id === tenderOrId.id))) return false;
    if (t.secop_id && (t.secop_id === targetId || (typeof tenderOrId !== 'string' && tenderOrId.secop_id && t.secop_id === tenderOrId.secop_id))) return false;
    if (t.process_number && (t.process_number === targetId || (typeof tenderOrId !== 'string' && tenderOrId.process_number && t.process_number === tenderOrId.process_number))) return false;
    return true;
  });
  
  try {
    localStorage.setItem(getStorageKey(STORAGE_KEY_PREFIX, userNit), JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SAVED_TENDERS_CHANGE_EVENT, { detail: { tenderId: targetId, action: 'removed' } }));
    }
    return true;
  } catch (err) {
    console.error('Error al eliminar licitación guardada:', err);
    return false;
  }
}

/**
 * Alterna el estado de guardado (guarda si no está, quita si ya está)
 * Retorna true si quedó guardada, false si se quitó.
 */
export function toggleSaveTender(tender: TenderDTO, userNit?: string): boolean {
  if (!tender) return false;
  const targetId = tender.id || tender.secop_id || tender.process_number;
  if (!targetId) return false;

  if (isTenderSaved(tender, userNit)) {
    removeSavedTender(tender, userNit);
    return false;
  } else {
    saveTender(tender, userNit);
    return true;
  }
}

/**
 * Registra un término de búsqueda para enriquecer el perfil de interés
 */
export function recordUserSearch(query: string, userNit?: string): void {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 3) return;
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const key = getStorageKey(SEARCHES_KEY_PREFIX, userNit);
    const raw = localStorage.getItem(key);
    const searches: string[] = raw ? JSON.parse(raw) : [];
    
    // Evitar duplicados consecutivos y mantener máximo 15 términos
    const filtered = searches.filter(s => s.toLowerCase() !== trimmed);
    const updated = [trimmed, ...filtered].slice(0, 15);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error al registrar búsqueda:', err);
  }
}

/**
 * Obtiene los términos de búsqueda recientes del usuario
 */
export function getRecentSearches(userNit?: string): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(SEARCHES_KEY_PREFIX, userNit));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

/**
 * Registra la visualización de una licitación en el historial de navegación reciente
 */
export function recordTenderView(tender: TenderDTO, userNit?: string): void {
  if (!tender) return;
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const key = getStorageKey(VIEWS_KEY_PREFIX, userNit);
    const raw = localStorage.getItem(key);
    const views: TenderDTO[] = raw ? JSON.parse(raw) : [];
    const targetId = tender.id || tender.secop_id || tender.process_number;

    const filtered = views.filter(v => (v.id || v.secop_id || v.process_number) !== targetId);
    const updated = [tender, ...filtered].slice(0, 20); // Guardar últimas 20 vistas
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error al registrar visualización:', err);
  }
}

/**
 * Obtiene las licitaciones vistas recientemente
 */
export function getRecentViewedTenders(userNit?: string): TenderDTO[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(VIEWS_KEY_PREFIX, userNit));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}
