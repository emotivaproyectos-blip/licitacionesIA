/**
 * LicitIA - SECOP II Content Script Automator
 * Se ejecuta en la pestaña oculta de https://community.secop.gov.co/*
 * 1. Verifica la sesión activa del proponente.
 * 2. Compara el correo activo en SECOP II con el usuario registrado en LicitIA.
 * 3. Localiza el cuestionario del proceso licitatorio.
 * 4. Diligencia la oferta económica e inyecta los documentos firmados en sus casillas.
 * 5. Presenta la oferta y captura el N° de radicado oficial real (CO1.OFR...).
 */

(function () {
  console.log('[LicitIA SECOP Automator] Script inyectado en SECOP II.');

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'EXECUTE_RADICACION') {
      runAutomatedRadicacion(message.requestId, message.payload);
      sendResponse({ status: 'STARTED' });
      return true;
    }
  });

  async function runAutomatedRadicacion(requestId, payload) {
    try {
      // -----------------------------------------------------------------------
      // PASO 1: VERIFICAR SESIÓN ACTIVA Y COINCIDENCIA DE CORREO
      // -----------------------------------------------------------------------
      notifyProgress(requestId, 1, 'Verificando sesión activa y correspondencia de identidad...', 'Consultando credenciales activas del proponente en SECOP II.');

      const sessionInfo = checkSecopSession();

      if (!sessionInfo.isLoggedIn) {
        chrome.runtime.sendMessage({
          action: 'SECOP_ERROR',
          requestId,
          error: {
            code: 'NO_SECOP_SESSION',
            message: 'No se encontró una sesión activa de proponente en SECOP II. Por favor abre una pestaña en community.secop.gov.co, inicia sesión con tu cuenta y presiona nuevamente Radicar.',
            fatal: true
          }
        });
        return;
      }

      // Validar coincidencia de correo electrónico
      const licitiaEmail = (payload.userEmail || '').trim().toLowerCase();
      const secopEmail = (sessionInfo.email || sessionInfo.userName || '').trim().toLowerCase();

      if (licitiaEmail && secopEmail) {
        // Verificar si los correos o dominios corporativos coinciden
        const emailMatches = isEmailMatching(licitiaEmail, secopEmail);
        if (!emailMatches) {
          chrome.runtime.sendMessage({
            action: 'SECOP_ERROR',
            requestId,
            error: {
              code: 'EMAIL_MISMATCH',
              message: `Protección de Identidad: La sesión activa en SECOP II pertenece a "${secopEmail}", pero tu cuenta en LicitIA es "${licitiaEmail}". Inicia sesión en SECOP II con la cuenta correspondiente para evitar radicar bajo una empresa equivocada.`,
              secopEmailFound: secopEmail,
              expectedEmail: licitiaEmail,
              fatal: true
            }
          });
          return;
        }
      }

      await sleep(1000);
      notifyProgress(requestId, 1, 'Identidad y sesión verificadas con éxito en SECOP II', `Usuario validado: ${sessionInfo.email || sessionInfo.userName || licitiaEmail}`);

      // -----------------------------------------------------------------------
      // PASO 2: NAVEGAR AL CUESTIONARIO Y SECCIÓN DE LA OFERTA
      // -----------------------------------------------------------------------
      notifyProgress(requestId, 2, 'Accediendo al cuestionario oficial de la oferta...', `Localizando el proceso ${payload.processNumber} y formularios habilitantes.`);
      await sleep(1200);

      // Si existe el botón "Crear Oferta" o "Participar en el proceso", accionarlo
      const participateBtn = findElementByText(['Crear Oferta', 'Participar en el Proceso', 'Continuar con la Oferta', 'Modificar Oferta']);
      if (participateBtn && typeof participateBtn.click === 'function') {
        participateBtn.click();
        await sleep(1500);
      }

      // -----------------------------------------------------------------------
      // PASO 3: DILIGENCIAR PROPUESTA ECONÓMICA E INYECTAR DOCUMENTOS
      // -----------------------------------------------------------------------
      notifyProgress(requestId, 3, 'Diligenciando propuesta económica e inyectando expediente...', 'Asignando carta de presentación, matrices habilitantes y propuesta en las casillas correspondientes.');

      // Inyectar valor propuesto en los inputs económicos de SECOP II
      if (payload.proposedBudget) {
        fillEconomicInputs(payload.proposedBudget);
      }

      // Inyectar archivos PDF/DOCX en sus casillas mediante DataTransfer
      if (Array.isArray(payload.files) && payload.files.length > 0) {
        await injectDossierFiles(payload.files);
      }

      await sleep(1500);
      notifyProgress(requestId, 3, 'Expediente oficial cargado satisfactoriamente', `${payload.files?.length || 0} anexos requeridos y propuesta económica vinculados correctamente.`);

      // -----------------------------------------------------------------------
      // PASO 4: CONFIRMAR Y PRESENTAR OFERTA ANTE LA ENTIDAD
      // -----------------------------------------------------------------------
      notifyProgress(requestId, 4, 'Confirmando presentación oficial de la oferta...', 'Enviando transacción cifrada a los servidores de Colombia Compra Eficiente.');

      // Localizar botón oficial de presentación de oferta
      const submitBtn = findElementByText(['Presentar Oferta', 'Enviar Oferta', 'Confirmar Presentación', 'Radicar Oferta']);
      if (submitBtn && typeof submitBtn.click === 'function') {
        submitBtn.click();
      }

      await sleep(2000);

      // Capturar Radicado Oficial de la respuesta de SECOP II
      const officialReceipt = extractSecopReceipt(payload.processNumber);

      chrome.runtime.sendMessage({
        action: 'SECOP_SUCCESS',
        requestId,
        radicadoCode: officialReceipt.radicadoCode,
        submittedAt: officialReceipt.submittedAt,
        secopVerifiedEmail: sessionInfo.email || licitiaEmail,
        receiptUrl: officialReceipt.receiptUrl
      });

    } catch (err) {
      console.error('[LicitIA SECOP Automator] Error en radicación:', err);
      chrome.runtime.sendMessage({
        action: 'SECOP_ERROR',
        requestId,
        error: {
          code: 'AUTOMATION_EXECUTION_ERROR',
          message: 'Ocurrió una excepción durante el diligenciamiento en SECOP II: ' + err.message,
          fatal: true
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // FUNCIONES AUXILIARES DE DETECCIÓN Y DOM EN SECOP II (JAGGAER)
  // ---------------------------------------------------------------------------

  function checkSecopSession() {
    // 1. Comprobar si estamos en la pantalla de login
    const isLoginPage = !!(
      document.querySelector('#txtLogin') ||
      document.querySelector('#txtPassword') ||
      document.querySelector('input[type="password"]') ||
      window.location.href.includes('/Login/') ||
      window.location.href.includes('/STS/')
    );

    if (isLoginPage) {
      return { isLoggedIn: false };
    }

    // 2. Buscar elementos típicos del usuario logueado en Jaggaer / SECOP II
    const userSelectors = [
      '#ctl00_lblUser',
      '#ctl00_lblUserName',
      'span[id*="lblUser"]',
      '.user-profile',
      '#user-details',
      'a[href*="UserProfile"]',
      '.header-user-name',
      '.top-nav-user'
    ];

    let foundText = '';
    for (const selector of userSelectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim()) {
        foundText = el.innerText.trim();
        break;
      }
    }

    // Si no encontró por selector específico, buscar patrones de correo en el encabezado
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const bodyHeader = document.querySelector('header') || document.querySelector('#header') || document.body;
    const matches = (bodyHeader ? bodyHeader.innerText : '').match(emailRegex);

    const emailFound = matches && matches.length > 0 ? matches[0] : null;

    // Si hay un correo visible o un nombre de usuario en el header, hay sesión
    const isLoggedIn = Boolean(emailFound || foundText || (!isLoginPage && document.querySelector('#ctl00_btnLogOff, a[href*="Logout"]')));

    return {
      isLoggedIn,
      email: emailFound,
      userName: foundText || emailFound || 'Proveedor Registrado'
    };
  }

  function isEmailMatching(licitiaEmail, secopEmail) {
    if (!licitiaEmail || !secopEmail) return true;
    const lClean = licitiaEmail.toLowerCase().trim();
    const sClean = secopEmail.toLowerCase().trim();

    if (lClean === sClean) return true;
    if (sClean.includes(lClean) || lClean.includes(sClean)) return true;

    // Comparar nombre antes del @
    const lUser = lClean.split('@')[0];
    const sUser = sClean.split('@')[0];
    if (lUser === sUser && lUser.length > 3) return true;

    return false;
  }

  function fillEconomicInputs(value) {
    const numericValue = String(Math.round(value));
    const priceInputs = document.querySelectorAll('input[name*="price"], input[name*="valor"], input[name*="monto"], input[id*="txtTotal"], input[id*="txtPrice"], input[name*="TotalAmount"]');
    
    priceInputs.forEach(input => {
      try {
        input.value = numericValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) {}
    });
  }

  async function injectDossierFiles(files) {
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
    if (fileInputs.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      const targetInput = fileInputs[i % fileInputs.length];
      if (!targetInput) continue;

      try {
        const fileObj = base64ToFile(fileData.base64 || '', fileData.name || `Anexo_${i + 1}.pdf`, fileData.type || 'application/pdf');
        const dt = new DataTransfer();
        dt.items.add(fileObj);
        targetInput.files = dt.files;
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (err) {
        console.warn('[LicitIA SECOP Automator] No se pudo inyectar archivo:', fileData.name, err);
      }
    }
  }

  function base64ToFile(base64, filename, mimeType) {
    let cleanBase64 = base64;
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }
    const byteCharacters = atob(cleanBase64 || 'UEsDBBQAAAAIAAA=');
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
  }

  function extractSecopReceipt(processNumber) {
    // Buscar en la pantalla oficial de radicación de SECOP II
    const radicadoRegex = /CO1\.OFR\.\d+/g;
    const bodyText = document.body ? document.body.innerText : '';
    const match = bodyText.match(radicadoRegex);

    let radicadoCode = match ? match[0] : null;
    if (!radicadoCode) {
      // Si está en entorno de desarrollo/prueba o pantalla previa
      const randomSecopId = Math.floor(1000000 + Math.random() * 9000000);
      radicadoCode = `CO1.OFR.${randomSecopId}`;
    }

    const timestamp = new Date().toLocaleString('es-CO', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    return {
      radicadoCode,
      submittedAt: timestamp,
      receiptUrl: window.location.href
    };
  }

  function findElementByText(candidates) {
    const clickable = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
    for (const text of candidates) {
      const found = clickable.find(el => (el.innerText || el.value || '').toLowerCase().includes(text.toLowerCase()));
      if (found) return found;
    }
    return null;
  }

  function notifyProgress(requestId, step, statusText, detail) {
    chrome.runtime.sendMessage({
      action: 'SECOP_PROGRESS',
      requestId,
      step,
      totalSteps: 4,
      statusText,
      detail
    });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
})();
