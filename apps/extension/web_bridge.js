/**
 * LicitIA - Web Bridge Content Script
 * Se inyecta en la aplicación web de LicitIA para permitir la comunicación bidireccional
 * entre React y la extensión de Chrome de forma segura mediante window.postMessage.
 */

(function () {
  const EXTENSION_VERSION = '1.0.0';

  // 1. Indicar en el DOM que la extensión está disponible de forma síncrona
  document.documentElement.setAttribute('data-licitia-extension-installed', 'true');
  document.documentElement.setAttribute('data-licitia-extension-version', EXTENSION_VERSION);

  // 2. Notificar proactivamente a la app web que la extensión está lista
  window.postMessage({
    source: 'LICITIA_EXTENSION',
    type: 'EXTENSION_READY',
    version: EXTENSION_VERSION
  }, '*');

  // 3. Escuchar peticiones emitidas por la aplicación web (React)
  window.addEventListener('message', (event) => {
    // Aceptar únicamente mensajes provenientes de la misma ventana con origen LICITIA_WEB
    if (event.source !== window || !event.data || event.data.source !== 'LICITIA_WEB') {
      return;
    }

    const { action, requestId, payload } = event.data;

    // A. Ping de comprobación de salud
    if (action === 'PING') {
      window.postMessage({
        source: 'LICITIA_EXTENSION',
        type: 'PONG',
        requestId,
        version: EXTENSION_VERSION
      }, '*');
      return;
    }

    // B. Inicio de radicación automatizada en segundo plano
    if (action === 'START_RADICACION') {
      try {
        chrome.runtime.sendMessage({
          action: 'START_RADICACION',
          requestId,
          payload
        }, (response) => {
          if (chrome.runtime.lastError) {
            window.postMessage({
              source: 'LICITIA_EXTENSION',
              type: 'RADICACION_ERROR',
              requestId,
              error: {
                code: 'EXTENSION_COMMUNICATION_ERROR',
                message: chrome.runtime.lastError.message || 'Error comunicando con el asistente de Chrome.'
              }
            }, '*');
          } else if (response && response.error) {
            window.postMessage({
              source: 'LICITIA_EXTENSION',
              type: 'RADICACION_ERROR',
              requestId,
              error: response.error
            }, '*');
          }
        });
      } catch (err) {
        window.postMessage({
          source: 'LICITIA_EXTENSION',
          type: 'RADICACION_ERROR',
          requestId,
          error: {
            code: 'EXTENSION_RUNTIME_DISCONNECTED',
            message: 'El proceso en segundo plano no respondió: ' + err.message
          }
        }, '*');
      }
      return;
    }

    // C. Cancelación de radicación si el usuario cancela en la web
    if (action === 'CANCEL_RADICACION') {
      chrome.runtime.sendMessage({
        action: 'CANCEL_RADICACION',
        requestId
      });
    }
  });

  // 4. Escuchar eventos de progreso y resultados enviados por el service worker (background.js)
  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.source !== 'LICITIA_BACKGROUND') return;

    // Retransmitir al contexto de la ventana de la aplicación web
    window.postMessage({
      source: 'LICITIA_EXTENSION',
      type: message.type, // 'RADICACION_PROGRESS', 'RADICACION_SUCCESS', 'RADICACION_ERROR'
      requestId: message.requestId,
      step: message.step,
      totalSteps: message.totalSteps,
      statusText: message.statusText,
      detail: message.detail,
      result: message.result,
      error: message.error
    }, '*');
  });

  console.log('[LicitIA Extension] Web Bridge conectado exitosamente v' + EXTENSION_VERSION);
})();
