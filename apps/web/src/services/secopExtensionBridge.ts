/**
 * LicitIA - SECOP Extension Bridge Service
 * Conecta la aplicación web con la extensión oficial de Chrome para ejecutar
 * la radicación en segundo plano ante SECOP II sin salir de la plataforma.
 */

export interface ExtensionStatus {
  installed: boolean;
  version?: string;
}

export interface RadicacionProgressEvent {
  step: number;
  totalSteps: number;
  statusText: string;
  detail?: string;
}

export interface RadicacionResult {
  tenderId: string;
  processNumber: string;
  radicadoCode: string;
  submittedAt: string;
  secopVerifiedEmail: string;
  receiptUrl?: string | null;
  sourcePlatform: string;
}

export interface RadicacionError {
  code: string;
  message: string;
  secopEmailFound?: string;
  expectedEmail?: string;
}

export interface SubmitToSecopPayload {
  userEmail: string;
  tenderId: string;
  processNumber: string;
  secopId?: string;
  sourcePlatform: string;
  processUrl?: string;
  entityName: string;
  proposedBudget: number;
  files: Array<{
    name: string;
    type: string;
    base64?: string;
  }>;
}

/**
 * Comprueba si la extensión de Chrome está instalada y disponible
 */
export async function checkExtensionAvailability(): Promise<ExtensionStatus> {
  // 1. Detección síncrona en el DOM inyectada por el web_bridge
  if (typeof document !== 'undefined') {
    const isInstalled = document.documentElement.getAttribute('data-licitia-extension-installed') === 'true';
    if (isInstalled) {
      const version = document.documentElement.getAttribute('data-licitia-extension-version') || '1.0.0';
      return { installed: true, version };
    }
  }

  // 2. Comprobación mediante ping postMessage con timeout de 400ms
  return new Promise((resolve) => {
    const requestId = 'ping-' + Date.now();
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve({ installed: false });
    }, 450);

    const handler = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.source === 'LICITIA_EXTENSION' &&
        (event.data.type === 'PONG' || event.data.type === 'EXTENSION_READY')
      ) {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve({
          installed: true,
          version: event.data.version || '1.0.0'
        });
      }
    };

    window.addEventListener('message', handler);
    window.postMessage({ source: 'LICITIA_WEB', action: 'PING', requestId }, '*');
  });
}

/**
 * Convierte un objeto File en base64 para transmitir a la extensión
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Inicia la radicación oficial a través de la extensión en segundo plano
 */
export function submitTenderViaExtension(
  payload: SubmitToSecopPayload,
  onProgress: (progress: RadicacionProgressEvent) => void
): Promise<RadicacionResult> {
  return new Promise((resolve, reject) => {
    const requestId = 'radicacion-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

    const handler = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'LICITIA_EXTENSION') return;
      if (event.data.requestId && event.data.requestId !== requestId) return;

      const { type, step, totalSteps, statusText, detail, result, error } = event.data;

      // Evento de progreso
      if (type === 'RADICACION_PROGRESS') {
        onProgress({
          step: step || 1,
          totalSteps: totalSteps || 4,
          statusText: statusText || 'Procesando en segundo plano...',
          detail: detail || ''
        });
      }

      // Evento de éxito
      if (type === 'RADICACION_SUCCESS') {
        window.removeEventListener('message', handler);
        resolve(result as RadicacionResult);
      }

      // Evento de error
      if (type === 'RADICACION_ERROR') {
        window.removeEventListener('message', handler);
        reject(error as RadicacionError);
      }
    };

    window.addEventListener('message', handler);

    // Enviar la orden a la extensión mediante el web_bridge
    window.postMessage({
      source: 'LICITIA_WEB',
      action: 'START_RADICACION',
      requestId,
      payload
    }, '*');
  });
}
