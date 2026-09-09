# LicitIA - Asistente Oficial de Radicación SECOP II (Chrome Extension)

Esta extensión de navegador permite **radicar ofertas públicas de forma real y automatizada en segundo plano** ante la plataforma **SECOP II (Colombia Compra Eficiente)** directamente desde la interfaz web de LicitIA, sin que el usuario tenga que salir de la aplicación ni ingresar contraseñas.

---

## Características Principales

1. **Automatización en Segundo Plano (*Background Tab*):**
   Abre una pestaña oculta e invisible de SECOP II para verificar la oferta, inyectar los documentos del expediente y presentar la propuesta.
2. **Validación de Identidad por Correo:**
   Verifica que la sesión activa en SECOP II pertenezca al mismo correo registrado en LicitIA, evitando radicar accidentalmente a nombre de otra empresa o razón social.
3. **Inyección Automática de Documentos:**
   Diligencia la oferta económica e inyecta la Carta de Presentación firmada y demás anexos en los campos de archivo correspondientes mediante la API `DataTransfer`.
4. **Captura del Radicado Oficial Real:**
   Extrae el número oficial de oferta (`CO1.OFR.XXXXXXX`) y la marca de tiempo certificada de Colombia Compra Eficiente, sincronizándolo en tiempo real con el buzón de LicitIA.

---

## Cómo Instalar la Extensión en Google Chrome o Microsoft Edge (30 segundos)

1. Abre tu navegador (Google Chrome, Microsoft Edge, Brave u Opera).
2. Dirígete a la dirección: `chrome://extensions/` (o `edge://extensions/`).
3. Activa la casilla **"Modo de desarrollador"** (ubicada en la esquina superior derecha).
4. Haz clic en el botón **"Cargar descomprimida"** (*Load unpacked*).
5. Selecciona la carpeta:
   `c:\Users\EMOTIVA1\Desktop\apppostulaciones\apps\extension`
6. ¡Listo! Verás la tarjeta de **LicitIA - Asistente de Radicación Oficial SECOP II**.

---

## Arquitectura de Archivos

* `manifest.json`: Configuración Manifest V3 con permisos de tabs, scripting y dominios autorizados.
* `web_bridge.js`: Canal de comunicación bidireccional seguro entre la app web de React y la extensión mediante `window.postMessage`.
* `background.js`: Service worker que gestiona la apertura de pestañas en segundo plano y coordina los eventos.
* `secop_automator.js`: Script que valida la sesión en `community.secop.gov.co`, verifica el correo, inyecta los archivos y confirma la oferta.
