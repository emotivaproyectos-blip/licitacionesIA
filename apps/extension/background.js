/**
 * LicitIA - Background Service Worker (Manifest V3)
 * Orquesta la apertura y cierre de pestañas en segundo plano (Background Tabs)
 * para interactuar con SECOP II de forma invisible para el usuario.
 */

const activeJobs = new Map();

// Escucha mensajes desde los content scripts (web_bridge y secop_automator)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return false;

  const { action, requestId, payload } = message;

  // 1. INICIAR RADICACIÓN EN SEGUNDO PLANO DESDE LICITIA WEB
  if (action === 'START_RADICACION') {
    handleStartRadicacion(requestId, payload, sender)
      .then(() => sendResponse({ status: 'ACCEPTED' }))
      .catch((err) => sendResponse({ error: { code: 'START_ERROR', message: err.message } }));
    return true; // Respuesta asíncrona
  }

  // 2. RECIBIR EVENTOS DE PROGRESO DESDE SECOP_AUTOMATOR
  if (action === 'SECOP_PROGRESS') {
    handleAutomatorProgress(requestId, message);
    sendResponse({ status: 'ACK' });
    return true;
  }

  // 3. RECIBIR RESULTADO FINAL EXITOSO DESDE SECOP_AUTOMATOR
  if (action === 'SECOP_SUCCESS') {
    handleAutomatorSuccess(requestId, message);
    sendResponse({ status: 'ACK' });
    return true;
  }

  // 4. RECIBIR ERROR DESDE SECOP_AUTOMATOR
  if (action === 'SECOP_ERROR') {
    handleAutomatorError(requestId, message.error);
    sendResponse({ status: 'ACK' });
    return true;
  }

  // 5. CANCELAR PROCESO
  if (action === 'CANCEL_RADICACION') {
    cancelJob(requestId);
    sendResponse({ status: 'CANCELLED' });
    return false;
  }

  return false;
});

/**
 * Inicia el proceso abriendo una pestaña invisible en segundo plano
 */
async function handleStartRadicacion(requestId, payload, sender) {
  const callerTabId = sender?.tab?.id;
  if (!callerTabId) {
    throw new Error('No se pudo identificar la pestaña de origen en LicitIA.');
  }

  // Determinar la URL objetivo de SECOP II
  let secopUrl = payload.processUrl;
  if (!secopUrl || !secopUrl.includes('secop.gov.co')) {
    // Si no tiene URL específica, entrar a la búsqueda o portal de oportunidades
    secopUrl = 'https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index';
  }

  // Notificar progreso inicial al frontend
  notifyWebTab(callerTabId, {
    type: 'RADICACION_PROGRESS',
    requestId,
    step: 1,
    totalSteps: 4,
    statusText: 'Iniciando conexión segura en segundo plano con SECOP II...',
    detail: 'Abriendo canal invisible y verificando sesión activa del proponente.'
  });

  // Crear la pestaña oculta en segundo plano (active: false)
  const backgroundTab = await chrome.tabs.create({
    url: secopUrl,
    active: false // INVISIBLE PARA EL USUARIO
  });

  const job = {
    requestId,
    callerTabId,
    backgroundTabId: backgroundTab.id,
    payload,
    startedAt: Date.now(),
    timeoutTimer: setTimeout(() => {
      handleJobTimeout(requestId);
    }, 90000) // 90 segundos de timeout de seguridad
  };

  activeJobs.set(requestId, job);

  // Esperar a que la pestaña de SECOP II cargue completamente
  const checkTabLoaded = (tabId, changeInfo) => {
    if (tabId === backgroundTab.id && changeInfo.status === 'complete') {
      chrome.tabs.onUpdated.removeListener(checkTabLoaded);

      // Dar un breve margen para que los scripts del portal Jaggaer inicialicen el DOM
      setTimeout(async () => {
        try {
          // Enviar la orden de ejecución a secop_automator.js en esa pestaña
          await chrome.tabs.sendMessage(backgroundTab.id, {
            action: 'EXECUTE_RADICACION',
            requestId,
            payload
          });
        } catch (err) {
          // Si falló el envío del mensaje (por ejemplo si la página tardó en inyectar el script)
          console.warn('[LicitIA BG] Reintentando inyección en SECOP...', err);
          handleAutomatorError(requestId, {
            code: 'SECOP_INJECTION_RETRY',
            message: 'Conectando con los componentes interactivos de SECOP II...'
          });
        }
      }, 1200);
    }
  };

  chrome.tabs.onUpdated.addListener(checkTabLoaded);
}

/**
 * Notifica el avance de cada paso a la aplicación web del usuario
 */
function handleAutomatorProgress(requestId, msg) {
  const job = activeJobs.get(requestId);
  if (!job) return;

  notifyWebTab(job.callerTabId, {
    type: 'RADICACION_PROGRESS',
    requestId,
    step: msg.step,
    totalSteps: msg.totalSteps || 4,
    statusText: msg.statusText,
    detail: msg.detail
  });
}

/**
 * Maneja el éxito de la radicación real: cierra la pestaña y devuelve los datos oficiales
 */
async function handleAutomatorSuccess(requestId, msg) {
  const job = activeJobs.get(requestId);
  if (!job) return;

  clearTimeout(job.timeoutTimer);

  // Cerrar la pestaña de fondo inmediatamente para no consumir recursos
  try {
    if (job.backgroundTabId) {
      await chrome.tabs.remove(job.backgroundTabId);
    }
  } catch (err) {
    console.warn('[LicitIA BG] Pestaña ya cerrada:', err);
  }

  // Notificar al usuario en LicitIA web
  notifyWebTab(job.callerTabId, {
    type: 'RADICACION_SUCCESS',
    requestId,
    result: {
      tenderId: job.payload.tenderId,
      processNumber: job.payload.processNumber,
      radicadoCode: msg.radicadoCode,
      submittedAt: msg.submittedAt,
      secopVerifiedEmail: msg.secopVerifiedEmail,
      receiptUrl: msg.receiptUrl || null,
      sourcePlatform: job.payload.sourcePlatform || 'SECOP_II'
    }
  });

  activeJobs.delete(requestId);
}

/**
 * Maneja errores y abortos (correo no coincide, no hay sesión, etc.)
 */
async function handleAutomatorError(requestId, error) {
  const job = activeJobs.get(requestId);
  if (!job) return;

  clearTimeout(job.timeoutTimer);

  // Cerrar la pestaña en segundo plano si ocurrió un error fatal
  if (error.fatal !== false) {
    try {
      if (job.backgroundTabId) {
        await chrome.tabs.remove(job.backgroundTabId);
      }
    } catch (err) {
      console.warn('[LicitIA BG] Error cerrando pestaña:', err);
    }
  }

  notifyWebTab(job.callerTabId, {
    type: 'RADICACION_ERROR',
    requestId,
    error: {
      code: error.code || 'RADICACION_FAILED',
      message: error.message || 'Ocurrió un inconveniente al radicar en SECOP II.',
      secopEmailFound: error.secopEmailFound || null,
      expectedEmail: job.payload.userEmail || null
    }
  });

  if (error.fatal !== false) {
    activeJobs.delete(requestId);
  }
}

/**
 * Timeout si la operación excede el tiempo límite
 */
function handleJobTimeout(requestId) {
  handleAutomatorError(requestId, {
    code: 'TIMEOUT_ERROR',
    message: 'El portal de SECOP II tardó demasiado en responder o la conexión fue interrumpida. Por favor verifica tu conexión y vuelve a intentar.'
  });
}

/**
 * Cancelación manual por parte del usuario
 */
async function cancelJob(requestId) {
  const job = activeJobs.get(requestId);
  if (!job) return;

  clearTimeout(job.timeoutTimer);
  try {
    if (job.backgroundTabId) {
      await chrome.tabs.remove(job.backgroundTabId);
    }
  } catch (err) {
    // Ignorar si ya no existe
  }
  activeJobs.delete(requestId);
}

/**
 * Envía mensajes a la pestaña donde está abierta la app de LicitIA
 */
function notifyWebTab(tabId, message) {
  chrome.tabs.sendMessage(tabId, {
    source: 'LICITIA_BACKGROUND',
    ...message
  }).catch(() => {
    // Si la pestaña ya se cerró
  });
}
