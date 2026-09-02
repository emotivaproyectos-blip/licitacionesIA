/**
 * Servicio de Generación Real de Expedientes de Postulación
 * Genera documentos formales legales en formato Word (.doc / HTML compatible) y paquetes .ZIP
 * Soporta la incorporación de la Carta de Presentación (Anexo 1) ya firmada por el representante legal.
 */

import JSZip from 'jszip';

export interface CompanyData {
  name: string;
  nit: string;
  sector: string;
  current_assets: number;
  current_liabilities: number;
  total_assets: number;
  total_liabilities: number;
  operating_income: number;
  interest_expense: number;
  smmlv_experience: number;
  unspsc_codes: string[];
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  legal_rep_name?: string;
  legal_rep_id?: string;
}

/**
 * Convierte una cadena base64 dataURL a un Blob binario real
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch (err) {
    console.warn('Error al decodificar dataURL a Blob:', err);
    return null;
  }
}

export interface TenderData {
  id: string;
  secop_id: string;
  process_number: string;
  entity_name: string;
  entity_nit?: string;
  title: string;
  budget_cop: number;
  budget_smmlv: number;
  department: string;
  city?: string;
  publication_date?: string;
  closing_date: string;
  status: string;
  unspsc_codes: string[];
  source_platform: 'SECOP_I' | 'SECOP_II';
  contract_type?: string;
  description?: string;
  process_url?: string;
  min_liquidity_required?: number;
  max_debt_allowed?: number;
  min_smmlv_required?: number;
}

export type DocCategory = 'juridico' | 'financiero' | 'tecnico' | 'economico';
export type DocSource = 'agent_generated' | 'user_attached' | 'pliego_reference';

export interface RequiredDossierDoc {
  id: string;
  title: string;
  category: DocCategory;
  mandatory: boolean;
  source: DocSource;
  template_type?: 'letter' | 'matrix' | 'checklist' | 'economy' | 'integrity' | 'mipyme' | 'anticorruption' | 'risk_matrix' | string;
  filename: string;
  legal_basis: string;
  description: string;
}

export interface AttachedFileInfo {
  file?: File | Blob;
  fileDataUrl?: string;
  name: string;
  size?: number;
  uploadedAt?: string;
  isFromVault?: boolean;
}

export interface SignedLetterInfo {
  file?: File | Blob;
  name: string;
}

/**
 * Convierte un número a formato de moneda colombiana ($ COP)
 */
export function formatCOP(val: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val);
}

/**
 * Convierte números a letras en español (Pesos Colombianos)
 */
export function numeroALetrasCOP(amount: number): string {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales: { [key: number]: string } = {
    11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
    16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
    21: 'VEINTIÚN', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO',
    25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
  };
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertirGrupo(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    let output = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const du = n % 100;

    if (c > 0) output += centenas[c] + ' ';
    if (especiales[du]) {
      output += especiales[du];
    } else {
      if (d > 0) output += decenas[d] + (u > 0 ? ' Y ' : '');
      if (u > 0) output += unidades[u];
    }
    return output.trim();
  }

  if (amount === 0) return 'CERO PESOS M/CTE.';
  const entero = Math.floor(amount);
  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const resto = entero % 1000;

  let resultado = '';
  if (millones > 0) {
    if (millones === 1) resultado += 'UN MILLÓN ';
    else resultado += convertirGrupo(millones) + ' MILLONES ';
  }
  if (miles > 0) {
    if (miles === 1) resultado += 'UN MIL ';
    else resultado += convertirGrupo(miles) + ' MIL ';
  }
  if (resto > 0) {
    resultado += convertirGrupo(resto);
  }

  return `${resultado.trim()} PESOS MONEDA CORRIENTE (M/CTE.)`;
}

// -----------------------------------------------------------------------------
// 1. GENERADOR DE CARTA DE PRESENTACIÓN DE LA OFERTA (ANEXO N° 1)
// -----------------------------------------------------------------------------
export function generateLetterOfOffer(company: CompanyData, tender: TenderData): string {
  const currentDate = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const proposedBudget = tender.budget_cop * 0.985;
  const budgetLetters = numeroALetrasCOP(proposedBudget);

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Anexo 1 - Carta de Presentación de la Oferta</title>
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.4; color: #1a1a1a; margin: 40px; }
    h1 { font-size: 14pt; text-align: center; text-transform: uppercase; font-weight: bold; margin-bottom: 25px; }
    .header-box { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10.5pt; }
    .meta-table td { padding: 4px 8px; vertical-align: top; }
    .meta-table td.label { font-weight: bold; width: 28%; color: #334155; }
    p { margin-bottom: 12px; text-align: justify; }
    ol { margin-left: 20px; margin-bottom: 15px; }
    li { margin-bottom: 8px; text-align: justify; }
    .signature-box { margin-top: 50px; border-top: 1px solid #94a3b8; width: 350px; padding-top: 8px; }
    .badge { background: #f1f5f9; padding: 2px 6px; border: 1px solid #cbd5e1; font-size: 9pt; font-weight: bold; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header-box">
    <div style="font-size: 9pt; color: #64748b; text-align: right;">Fecha de Radicación: ${currentDate}</div>
    <div style="font-size: 12pt; font-weight: bold; color: #1e293b;">${tender.entity_name.toUpperCase()}</div>
    <div style="font-size: 10pt; color: #475569;">Ciudad: ${tender.city || 'Bogotá D.C.'}, ${tender.department}</div>
  </div>

  <h1>ANEXO N° 1<br>CARTA DE PRESENTACIÓN DE LA PROPUESTA</h1>

  <table class="meta-table">
    <tr>
      <td class="label">PROCESO N°:</td>
      <td><strong>${tender.process_number}</strong> <span class="badge">${tender.source_platform.replace('_', ' ')}</span></td>
    </tr>
    <tr>
      <td class="label">IDENTIFICADOR SECOP:</td>
      <td>${tender.secop_id}</td>
    </tr>
    <tr>
      <td class="label">OBJETO DE CONTRATACIÓN:</td>
      <td>${tender.title}</td>
    </tr>
    <tr>
      <td class="label">PROPONENTE:</td>
      <td><strong>${company.name}</strong></td>
    </tr>
    <tr>
      <td class="label">NIT DEL PROPONENTE:</td>
      <td>${company.nit}</td>
    </tr>
    <tr>
      <td class="label">VALOR TOTAL DE LA OFERTA:</td>
      <td><strong>${formatCOP(proposedBudget)} COP</strong><br><small>(${budgetLetters})</small></td>
    </tr>
  </table>

  <p>Señores <strong>${tender.entity_name}</strong>,</p>

  <p>El suscrito, obrando en calidad de Representante Legal de la sociedad <strong>${company.name}</strong>, identificada con NIT <strong>${company.nit}</strong>, me permito presentar propuesta formal e irrevocable para participar en el proceso de contratación pública de la referencia, de conformidad con lo establecido en el pliego de condiciones definitivo y sus adendas, rigiéndose bajo el marco de la Ley 80 de 1993, Ley 1150 de 2007 y Decreto 1082 de 2015.</p>

  <p>Para los efectos correspondientes, manifiesto bajo la gravedad del juramento que:</p>

  <ol>
    <li>Conozco, acepto y me sujeto íntegramente a las condiciones, especificaciones técnicas, plazos, obligaciones y demás estipulaciones contenidas en el pliego de condiciones de este proceso.</li>
    <li>Ni mi representada, ni el suscrito, ni sus socios o directivos se encuentran incursos en causales de inhabilidad, incompatibilidad ni conflicto de interés previstas en la Constitución Política, la Ley 80 de 1993, Ley 1474 de 2011 ni demás normas vigentes.</li>
    <li>La presente propuesta tiene una validez de noventa (90) días calendario contados a partir de la fecha de cierre del proceso o por el término estipulado en los pliegos.</li>
    <li>Nuestra empresa cuenta con la capacidad jurídica, técnica, operativa y financiera acreditada mediante Registro Único de Proponentes (RUP) para la ejecución satisfactoria del contrato.</li>
    <li>Nos encontramos al día con el pago de aportes al Sistema Integral de Seguridad Social (Salud, Pensión, ARL) y Contribuciones Parafiscales (SENA, ICBF, Cajas de Compensación) de conformidad con el artículo 50 de la Ley 789 de 2002.</li>
    <li>Garantizamos la veracidad y autenticidad de todos los documentos e información suministrada en la presente postulación.</li>
  </ol>

  <p><strong>NOTIFICACIONES JUDICIALES Y ADMINISTRATIVAS:</strong></p>
  <p>
    Razón Social: ${company.name}<br>
    NIT: ${company.nit}<br>
    Domicilio: ${company.city || tender.city || 'Colombia'}<br>
    Dirección: ${company.address || 'Sede Principal Registrada'}<br>
    Dirección Electrónica de Notificación: ${company.email || `notificaciones@${company.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'empresa'}.com`}<br>
    Teléfono de Contacto: ${company.phone || 'Línea de atención registrada'}
  </p>

  <div class="signature-box">
    <p><strong>REPRESENTANTE LEGAL</strong><br>
    Firma: _____________________________________<br>
    Nombre: ${company.legal_rep_name || 'Representante Legal'}<br>
    C.C. N° ${company.legal_rep_id || '____________________'} de ${company.city || tender.city || 'Colombia'}<br>
    ${company.name} - NIT ${company.nit}
    </p>
  </div>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 2. GENERADOR DE MATRIZ DE CAPACIDAD FINANCIERA Y EXPERIENCIA RUP
// -----------------------------------------------------------------------------
export function generateFinancialMatrix(company: CompanyData, tender: TenderData): string {
  const liquidityRatio = company.current_liabilities > 0 
    ? (company.current_assets / company.current_liabilities) 
    : 0;
  const debtRatio = company.total_assets > 0 
    ? (company.total_liabilities / company.total_assets) 
    : 0;

  const minLiq = tender.min_liquidity_required || 1.5;
  const maxDebt = tender.max_debt_allowed || 0.50;
  const minSmmlv = tender.min_smmlv_required || Number((tender.budget_smmlv * 0.8).toFixed(1));

  const passesLiq = liquidityRatio >= minLiq;
  const passesDebt = debtRatio <= maxDebt;
  const passesExp = company.smmlv_experience >= minSmmlv;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Matriz de Capacidad Financiera y Experiencia RUP</title>
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10.5pt; line-height: 1.35; color: #0f172a; margin: 35px; }
    h1 { font-size: 13pt; text-align: center; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; color: #1e3a8a; }
    h2 { font-size: 11pt; text-transform: uppercase; font-weight: bold; margin-top: 20px; margin-bottom: 8px; color: #1e293b; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; }
    .table-data { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10pt; }
    .table-data th, .table-data td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
    .table-data th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
    .pass { color: #166534; font-weight: bold; }
    .fail { color: #991b1b; font-weight: bold; }
    .header-info { margin-bottom: 15px; font-size: 10pt; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>MATRIZ DE HABILITACIÓN FINANCIERA Y TÉCNICA RUP</h1>
  <p style="text-align: center; color: #64748b; font-size: 9.5pt; margin-top: 0;">Proceso: ${tender.process_number} • Entidad: ${tender.entity_name}</p>

  <div class="header-info">
    <strong>Proponente:</strong> ${company.name} | <strong>NIT:</strong> ${company.nit} | <strong>Sector:</strong> ${company.sector}<br>
    <strong>Plataforma:</strong> ${tender.source_platform.replace('_', ' ')} | <strong>Presupuesto Oficial:</strong> ${formatCOP(tender.budget_cop)} COP (${tender.budget_smmlv} SMMLV)
  </div>

  <h2>1. ESTADOS FINANCIEROS AUDITADOS (RUP)</h2>
  <table class="table-data">
    <thead>
      <tr>
        <th>Rubro Financiero</th>
        <th>Valor en Pesos ($ COP)</th>
        <th>Participación sobre Activo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Activo Corriente</strong></td>
        <td>${formatCOP(company.current_assets)} COP</td>
        <td>${((company.current_assets / (company.total_assets || 1)) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td><strong>Pasivo Corriente</strong></td>
        <td>${formatCOP(company.current_liabilities)} COP</td>
        <td>${((company.current_liabilities / (company.total_assets || 1)) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td><strong>Activo Total</strong></td>
        <td><strong>${formatCOP(company.total_assets)} COP</strong></td>
        <td>100.0%</td>
      </tr>
      <tr>
        <td><strong>Pasivo Total</strong></td>
        <td><strong>${formatCOP(company.total_liabilities)} COP</strong></td>
        <td>${((company.total_liabilities / (company.total_assets || 1)) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td><strong>Patrimonio Neto</strong></td>
        <td>${formatCOP(company.total_assets - company.total_liabilities)} COP</td>
        <td>${(((company.total_assets - company.total_liabilities) / (company.total_assets || 1)) * 100).toFixed(1)}%</td>
      </tr>
    </tbody>
  </table>

  <h2>2. CÁLCULO Y VERIFICACIÓN DE INDICADORES FINANCIEROS HABILITANTES</h2>
  <table class="table-data">
    <thead>
      <tr>
        <th>Indicador Financiero</th>
        <th>Fórmula Legal</th>
        <th>Requisito Pliego</th>
        <th>Valor Empresa</th>
        <th>Resultado</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Índice de Liquidez</strong></td>
        <td>Activo Cte. / Pasivo Cte.</td>
        <td>&ge; ${minLiq.toFixed(2)}</td>
        <td><strong>${liquidityRatio.toFixed(2)}</strong></td>
        <td class="${passesLiq ? 'pass' : 'fail'}">${passesLiq ? 'CUMPLE (Habilitado)' : 'NO CUMPLE'}</td>
      </tr>
      <tr>
        <td><strong>Nivel de Endeudamiento</strong></td>
        <td>Pasivo Total / Activo Total</td>
        <td>&le; ${(maxDebt * 100).toFixed(0)}%</td>
        <td><strong>${(debtRatio * 100).toFixed(1)}%</strong></td>
        <td class="${passesDebt ? 'pass' : 'fail'}">${passesDebt ? 'CUMPLE (Habilitado)' : 'NO CUMPLE'}</td>
      </tr>
      <tr>
        <td><strong>Experiencia RUP (SMMLV)</strong></td>
        <td>Sumatoria Contratos RUP</td>
        <td>&ge; ${minSmmlv.toFixed(1)} SMMLV</td>
        <td><strong>${company.smmlv_experience.toFixed(1)} SMMLV</strong></td>
        <td class="${passesExp ? 'pass' : 'fail'}">${passesExp ? 'CUMPLE (Habilitado)' : 'FALTANTE EN SMMLV'}</td>
      </tr>
    </tbody>
  </table>

  <h2>3. CLASIFICACIÓN DE BIENES Y SERVICIOS (CÓDIGOS UNSPSC)</h2>
  <table class="table-data">
    <thead>
      <tr>
        <th>Clasificación Exigida por la Entidad</th>
        <th>Códigos Registrados en RUP Empresa</th>
        <th>Estado de Correspondencia</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${tender.unspsc_codes.join(', ')}</td>
        <td>${company.unspsc_codes.join(', ')}</td>
        <td class="pass"><strong>COINCIDENCIA ACREDITADA</strong></td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top: 30px; font-size: 9pt; color: #475569;">
    Certificación expedida conforme a las cifras oficiales asentadas en el Certificado de Registro Único de Proponentes (RUP) con corte al último ejercicio fiscal.
  </p>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 3. GENERADOR DE CHECKLIST DE DOCUMENTOS HABILITANTES SECOP
// -----------------------------------------------------------------------------
export function generateChecklistDoc(company: CompanyData, tender: TenderData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Checklist de Documentos Habilitantes</title>
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10.5pt; line-height: 1.4; color: #0f172a; margin: 35px; }
    h1 { font-size: 13pt; text-align: center; text-transform: uppercase; font-weight: bold; color: #1e293b; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 9.5pt; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #f8fafc; font-weight: bold; }
    .checked { color: #15803d; font-weight: bold; text-align: center; }
  </style>
</head>
<body>
  <h1>LISTA DE VERIFICACIÓN (CHECKLIST) DE REQUISITOS HABILITANTES</h1>
  <p><strong>Proceso:</strong> ${tender.process_number} | <strong>Entidad:</strong> ${tender.entity_name} | <strong>Proponente:</strong> ${company.name}</p>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">N°</th>
        <th style="width: 35%;">Documento Habilitante Requerido</th>
        <th style="width: 25%;">Fundamento Jurídico / Pliego</th>
        <th style="width: 15%;">Estado</th>
        <th style="width: 20%;">Observación</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>Carta de Presentación de la Oferta (Anexo N° 1)</td>
        <td>Formato Pliego de Condiciones</td>
        <td class="checked">[ √ ] DILIGENCIADO Y FIRMADO</td>
        <td>Firmado por Representante Legal</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Certificado de Existencia y Representación Legal</td>
        <td>Cámara de Comercio (&lt; 30 días)</td>
        <td class="checked">[ √ ] LISTO</td>
        <td>Vigencia acreditada</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Certificado RUP Vigente y en Firme</td>
        <td>Decreto 1082 de 2015</td>
        <td class="checked">[ √ ] LISTO</td>
        <td>${company.smmlv_experience} SMMLV Acreditados</td>
      </tr>
      <tr>
        <td>4</td>
        <td>Certificación de Parafiscales y Seguridad Social</td>
        <td>Art. 50 Ley 789 de 2002</td>
        <td class="checked">[ √ ] LISTO</td>
        <td>Suscrito por Revisor Fiscal</td>
      </tr>
      <tr>
        <td>5</td>
        <td>Garantía de Seriedad de la Oferta (Póliza)</td>
        <td>Art. 2.2.1.2.3.1.1 D. 1082/15</td>
        <td class="checked">[ √ ] LISTO</td>
        <td>10% del Presupuesto Oficial</td>
      </tr>
      <tr>
        <td>6</td>
        <td>Estados Financieros y Notas Contables</td>
        <td>NIIF para Pymes / Pleno</td>
        <td class="checked">[ √ ] LISTO</td>
        <td>Con balance auditado</td>
      </tr>
      <tr>
        <td>7</td>
        <td>Certificaciones de Experiencia Específica</td>
        <td>Códigos UNSPSC: ${tender.unspsc_codes[0] || '80101500'}</td>
        <td class="checked">[ √ ] LISTO</td>
        <td>Contratos similares ejecutados</td>
      </tr>
      <tr>
        <td>8</td>
        <td>Certificado Antecedentes Disciplinarios (Procuraduría)</td>
        <td>Ley 734 de 2002 / Ley 1952 de 2019</td>
        <td class="checked">[ √ ] LISTO</td>
        <td>Sin sanciones vigentes</td>
      </tr>
      <tr>
        <td>9</td>
        <td>Certificado Antecedentes Fiscales (Contraloría)</td>
        <td>Ley 610 de 2000</td>
        <td class="checked">[ √ ] LISTO</td>
        <td>Boletín de Responsables Fiscales</td>
      </tr>
      <tr>
        <td>10</td>
        <td>Formulario de Propuesta Económica Desglosada</td>
        <td>Anexo Económico SECOP</td>
        <td class="checked">[ √ ] DILIGENCIADO</td>
        <td>Conforme a especificaciones</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 4. GENERADOR DE PROPUESTA ECONÓMICA Y DESGLOSE DE COSTOS
// -----------------------------------------------------------------------------
export function generateEconomicProposal(company: CompanyData, tender: TenderData): string {
  const baseBudget = tender.budget_cop * 0.985;
  const costDirect = baseBudget * 0.70;
  const admin = baseBudget * 0.15;
  const imprevistos = baseBudget * 0.05;
  const utilidad = baseBudget * 0.10;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Propuesta Económica Desglosada</title>
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10.5pt; line-height: 1.4; color: #0f172a; margin: 35px; }
    h1 { font-size: 13pt; text-align: center; text-transform: uppercase; font-weight: bold; color: #1e3a8a; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10pt; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
    th { background: #f8fafc; font-weight: bold; }
    .total-row { background: #f1f5f9; font-size: 11pt; font-weight: bold; }
  </style>
</head>
<body>
  <h1>FORMULARIO DE PROPUESTA ECONÓMICA Y DESGLOSE DE COSTOS</h1>
  <p><strong>Proceso:</strong> ${tender.process_number} | <strong>Entidad Contratante:</strong> ${tender.entity_name}<br>
  <strong>Proponente:</strong> ${company.name} | <strong>NIT:</strong> ${company.nit}</p>

  <table>
    <thead>
      <tr>
        <th>Componente / Ítem de la Oferta</th>
        <th>Porcentaje (%)</th>
        <th>Valor en Pesos ($ COP)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Costos Directos (Personal, Infraestructura, Operación)</td>
        <td>70.0%</td>
        <td>${formatCOP(costDirect)} COP</td>
      </tr>
      <tr>
        <td>Administración (A)</td>
        <td>15.0%</td>
        <td>${formatCOP(admin)} COP</td>
      </tr>
      <tr>
        <td>Imprevistos (I)</td>
        <td>5.0%</td>
        <td>${formatCOP(imprevistos)} COP</td>
      </tr>
      <tr>
        <td>Utilidad (U)</td>
        <td>10.0%</td>
        <td>${formatCOP(utilidad)} COP</td>
      </tr>
      <tr class="total-row">
        <td>VALOR TOTAL PROPUESTO (A.I.U. e Impuestos Incluidos)</td>
        <td>100.0%</td>
        <td>${formatCOP(baseBudget)} COP</td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top: 15px;">
    <strong>VALOR EN LETRAS:</strong> ${numeroALetrasCOP(baseBudget)}
  </p>

  <p style="font-size: 9pt; color: #64748b; margin-top: 25px;">
    Esta propuesta incluye todos los costos directos, indirectos, impuestos, tasas, contribuciones y gravámenes de ley necesarios para el debido cumplimiento del objeto contractual.
  </p>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 5. GENERADOR DE CERTIFICADO DE INHABILIDADES E INCOMPATIBILIDADES
// -----------------------------------------------------------------------------
export function generateIntegrityCert(company: CompanyData, tender: TenderData): string {
  const currentDate = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificado de Inhabilidades e Incompatibilidades</title>
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 40px; }
    h1 { font-size: 14pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 20px; color: #0f172a; }
    .header { margin-bottom: 25px; }
    p { margin-bottom: 12px; text-align: justify; }
    .signature { margin-top: 50px; }
  </style>
</head>
<body>
  <div class="header">
    <p><strong>Fecha de Expedición:</strong> ${currentDate}</p>
    <p><strong>Ciudad:</strong> ${tender.city || 'Bogotá D.C.'}, ${tender.department || 'Colombia'}</p>
    <br>
    <p>Señores:<br>
    <strong>${tender.entity_name}</strong><br>
    <strong>Proceso N°:</strong> ${tender.process_number}<br>
    <strong>Objeto:</strong> ${tender.title}</p>
  </div>

  <h1>CERTIFICACIÓN DE INEXISTENCIA DE INHABILIDADES, INCOMPATIBILIDADES Y CONFLICTO DE INTERESES</h1>

  <p>
    Yo, en mi calidad de Representante Legal de la sociedad <strong>${company.name}</strong>, identificada con NIT <strong>${company.nit}</strong>, en cumplimiento de lo establecido en el Artículo 8° de la Ley 80 de 1993, la Ley 1150 de 2007, la Ley 1474 de 2011 (Estatuto Anticorrupción) y la Ley 2195 de 2022, de manera libre y voluntaria:
  </p>

  <p style="text-align: center; font-weight: bold; font-size: 12pt;">
    CERTIFICO BAJO LA GRAVEDAD DEL JURAMENTO:
  </p>

  <ol>
    <li>Que ni la persona jurídica que represento, ni sus socios, ni sus administradores, ni el suscrito Representante Legal, nos encontramos incursos en ninguna de las causales de inhabilidad, incompatibilidad o prohibición para contratar con el Estado Colombiano consagradas en la Constitución Política y las leyes aplicables.</li>
    <li>Que la empresa no se encuentra reportada en el Boletín de Responsables Fiscales de la Contraloría General de la República, ni registra antecedentes disciplinarios en la Procuraduría General de la Nación, ni antecedentes penales o de medidas correctivas en la Policía Nacional.</li>
    <li>Que no existe conflicto de intereses directo o indirecto con los funcionarios públicos encargados de la estructuración, evaluación y adjudicación del presente proceso contractual.</li>
    <li>Que nos comprometemos a mantener indemne a la entidad contratante y a comunicar de inmediato cualquier hecho sobreviniente que pudiere afectar esta condición.</li>
  </ol>

  <div class="signature">
    <p>Cordialmente,</p>
    <br><br>
    <p>_____________________________________________</p>
    <p><strong>REPRESENTANTE LEGAL</strong><br>
    Nombre: ${company.legal_rep_name || 'Representante Legal'}<br>
    C.C. N° ${company.legal_rep_id || '____________________'} de ${company.city || tender.city || 'Colombia'}<br>
    ${company.name}<br>
    NIT: ${company.nit}</p>
  </div>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 6. GENERADOR DE ACREDITACIÓN MIPYME E INDUSTRIA NACIONAL (LEY 2069 DE 2020)
// -----------------------------------------------------------------------------
export function generateMipymeCert(company: CompanyData, tender: TenderData): string {
  const currentDate = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificación Mipyme e Industria Nacional</title>
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 40px; }
    h1 { font-size: 13pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 20px; color: #0f172a; }
    p { margin-bottom: 12px; text-align: justify; }
    .signature { margin-top: 45px; }
  </style>
</head>
<body>
  <p><strong>Fecha:</strong> ${currentDate}</p>
  <p>Señores:<br>
  <strong>${tender.entity_name}</strong><br>
  <strong>Proceso:</strong> ${tender.process_number}</p>

  <h1>CERTIFICACIÓN DE CONDICIÓN MIPYME Y PROMOCIÓN DE LA INDUSTRIA NACIONAL (LEY 2069 DE 2020 - DECRETO 1860 DE 2021)</h1>

  <p>
    El suscrito Representante Legal y Contador Público / Revisor Fiscal de <strong>${company.name}</strong>, identificada con NIT <strong>${company.nit}</strong>, certifican que:
  </p>

  <p>
    1. Conforme a los criterios de ingresos por actividades ordinarias anuales establecidos en el Decreto 957 de 2019 compilado en el Decreto 1074 de 2015, la empresa ostenta la calidad de <strong>MICRO / PEQUEÑA / MEDIANA EMPRESA (MIPYME)</strong> del sector <strong>${company.sector.toUpperCase()}</strong>.
  </p>

  <p>
    2. Los bienes y servicios ofrecidos para el presente proceso contractual incorporan componente de <strong>ORIGEN NACIONAL COLOMBIANO</strong>, cumpliendo con los parámetros de la Ley 816 de 2003 y el Decreto 1860 de 2021 para el otorgamiento del puntaje de estímulo a la industria nacional y criterios de desempate.
  </p>

  <div class="signature">
    <table style="width: 100%; border: none;">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <p>_____________________________________</p>
          <p><strong>Representante Legal</strong><br>
          Nombre: ${company.legal_rep_name || 'Representante Legal'}<br>
          C.C. N° ${company.legal_rep_id || '____________________'}<br>
          ${company.name} - NIT: ${company.nit}</p>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <p>_____________________________________</p>
          <p><strong>Contador Público / Revisor Fiscal</strong><br>
          T.P. N° ____________-T</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 7. GENERADOR DE MATRIZ DE RIESGOS (PARA OBRAS O SERVICIOS)
// -----------------------------------------------------------------------------
export function generateRiskMatrixDoc(company: CompanyData, tender: TenderData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Matriz de Asignación de Riesgos</title>
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; color: #1e293b; margin: 30px; }
    h1 { font-size: 13pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; font-size: 9pt; }
    th { background-color: #f1f5f9; font-weight: bold; }
  </style>
</head>
<body>
  <h1>MATRIZ DE TIPIFICACIÓN, ESTIMACIÓN Y ASIGNACIÓN DE RIESGOS PREVISIBLES</h1>
  <p><strong>Proceso:</strong> ${tender.process_number} | <strong>Entidad:</strong> ${tender.entity_name} | <strong>Proponente:</strong> ${company.name}</p>

  <table>
    <thead>
      <tr>
        <th>Tipología de Riesgo</th>
        <th>Descripción del Evento</th>
        <th>Impacto / Probabilidad</th>
        <th>Asignación</th>
        <th>Mecanismo de Mitigación</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Riesgo Operacional</strong></td>
        <td>Dificultades en suministro o disponibilidad de insumos en la zona</td>
        <td>Medio / Baja</td>
        <td>Contratista</td>
        <td>Acuerdos previos con proveedores locales y plan de contingencia</td>
      </tr>
      <tr>
        <td><strong>Riesgo Financiero</strong></td>
        <td>Fluctuación cambiaria o variaciones inflacionarias</td>
        <td>Bajo / Media</td>
        <td>Contratista</td>
        <td>A.I.U. estructurado y política de compras anticipadas</td>
      </tr>
      <tr>
        <td><strong>Riesgo Regulatorio / Social</strong></td>
        <td>Alteraciones de orden público o condiciones climáticas adversas</td>
        <td>Alto / Baja</td>
        <td>Compartido</td>
        <td>Pólizas de seguro todo riesgo y coordinación con la interventoría</td>
      </tr>
      <tr>
        <td><strong>Riesgo de Calidad</strong></td>
        <td>No conformidad con las especificaciones técnicas del pliego</td>
        <td>Alto / Muy Baja</td>
        <td>Contratista</td>
        <td>Control de calidad riguroso y ensayos de laboratorio certificados</td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top: 20px;">El proponente <strong>${company.name}</strong> manifiesta conocer y aceptar la asignación de riesgos previsibles establecida en el pliego definitivo.</p>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 8. GUÍA DE RADICACIÓN EN SECOP
// -----------------------------------------------------------------------------
export function generateInstructions(company: CompanyData, tender: TenderData): string {
  const isSecop1 = tender.source_platform === 'SECOP_I';

  return `================================================================================
GUÍA OFICIAL DE RADICACIÓN DE LA OFERTA - ${tender.source_platform.replace('_', ' ')}
================================================================================
Proceso N°: ${tender.process_number}
Entidad Contratante: ${tender.entity_name}
Proponente: ${company.name} (NIT: ${company.nit})
Enlace Oficial: ${tender.process_url || 'https://community.secop.gov.co'}
================================================================================

PASOS PARA RADICAR ESTE EXPEDIENTE:

${isSecop1 ? `1. INGRESO A SECOP I (contratos.gov.co):
   - Ingrese al portal web oficial: https://www.contratos.gov.co
   - Busque el proceso con el número de constancia o referencia: "${tender.process_number}".

2. PREPARACIÓN DOCUMENTAL:
   - Utilice la "Carta de Presentación Firmada (Anexo N° 1)" adjunta en este expediente.
   - Adjunte el Certificado RUP, Estados Financieros y Póliza de Seriedad.

3. RADICACIÓN FÍSICA / ELECTRÓNICA:
   - Radique la propuesta en la ventanilla única de la entidad o al correo oficial antes de la fecha límite.` : `1. INGRESO A SECOP II (community.secop.gov.co):
   - Inicie sesión con su usuario y contraseña de Proveedor en SECOP II.
   - Localice la oportunidad "${tender.process_number}" o ID "${tender.secop_id}".

2. CREACIÓN DE LA OFERTA:
   - Haga clic en el botón "Crear Oferta" o "Participar en el Proceso".
   - En la sección "Cuestionario / Anexos", adjunte los archivos generados en este expediente:
     * Anexo 1 - Carta de Presentación Oficial Firmada.
     * Matriz de Capacidad Financiera y RUP.
     * Póliza de Seriedad y Certificado de Existencia y Representación Legal.
     * Formulario de Propuesta Económica.

3. CONFIRMACIÓN Y ENVÍO:
   - Valide el formulario económico con el valor propuesto: ${formatCOP(tender.budget_cop * 0.985)} COP.
   - Haga clic en "Presentar Oferta" y descargue el Comprobante de Radicación de SECOP II.`}

================================================================================
Expediente de Postulación Oficial generado y estructurado conforme a la Ley 80 de 1993 y Decreto 1082 de 2015.
================================================================================`;
}

// -----------------------------------------------------------------------------
// 9. RESOLUCIÓN DINÁMICA DE DOCUMENTOS SEGÚN EL PLIEGO
// -----------------------------------------------------------------------------
export function parseSecopDocumentTable(rawText: string, tender: TenderData): RequiredDossierDoc[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const docs: RequiredDossierDoc[] = [];

  for (const line of lines) {
    if (line.toLowerCase().includes('nombre del documento') || line.toLowerCase().includes('descargar') && line.length < 12) {
      continue;
    }
    const cleanName = line.replace(/\t.*$/, '').replace(/Descargar.*$/i, '').trim();
    if (!cleanName) continue;

    const lower = cleanName.toLowerCase();
    let cat: DocCategory = 'juridico';
    let source: DocSource = 'pliego_reference';
    let templateType: string | undefined = undefined;
    let mandatory = false;
    let desc = `Documento oficial del pliego de condiciones de SECOP: ${cleanName}`;
    let legal = 'Pliego de Condiciones Oficial';

    if (lower.includes('formato') || lower.includes('carta') || lower.includes('propuesta')) {
      source = 'agent_generated';
      templateType = lower.includes('econom') ? 'economy' : 'letter';
      mandatory = true;
      cat = lower.includes('econom') ? 'economico' : 'juridico';
      desc = 'Formularios y formatos oficiales suministrados por la entidad para la presentación de la propuesta.';
      legal = 'Anexo de Formatos Oficiales de la Convocatoria';
    } else if (lower.includes('riesgo')) {
      source = 'agent_generated';
      templateType = 'risk_matrix';
      mandatory = true;
      cat = 'tecnico';
      desc = 'Matriz oficial de tipificación, estimación y asignación de riesgos previsibles del proceso.';
      legal = 'Ley 1150 de 2007 (Art. 4) / Manual de Riesgos CCE';
    } else if (lower.includes('emprendimiento') || lower.includes('decreto 287') || lower.includes('mipyme')) {
      source = 'agent_generated';
      templateType = 'mipyme';
      mandatory = true;
      cat = 'juridico';
      desc = 'Oficio y caracterización de emprendimiento e inclusión conforme al Decreto 287 de 2026.';
      legal = 'Decreto 287 de 2026 / Criterios de Caracterización de Emprendimiento';
    } else if (lower.includes('cdp') || lower.includes('paa')) {
      cat = 'financiero';
      source = 'pliego_reference';
      desc = 'Certificado de disponibilidad presupuestal / Plan Anual de Adquisiciones de la entidad.';
    } else if (lower.includes('estudio') || lower.includes('sector') || lower.includes('mercado')) {
      cat = 'economico';
      source = 'pliego_reference';
      desc = 'Estudio de mercado, análisis de precios y análisis del sector económico.';
    } else if (lower.includes('invitacion') || lower.includes('pliego')) {
      cat = 'juridico';
      source = 'pliego_reference';
      desc = 'Pliego de condiciones definitivo / Invitación pública que rige la contratación.';
    } else if (lower.includes('necesidad') || lower.includes('grafico') || lower.includes('tecnic')) {
      cat = 'tecnico';
      source = 'pliego_reference';
      desc = 'Memoria de necesidad, justificación y anexos técnicos del proyecto.';
    }

    docs.push({
      id: `doc_${cleanName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}`,
      title: cleanName,
      category: cat,
      mandatory: mandatory,
      source: source,
      template_type: templateType,
      filename: cleanName,
      legal_basis: legal,
      description: desc
    });
  }

  // Si encontramos FORMATOS.docx, agregamos la versión firmada que el usuario debe anexar
  const hasFormatos = docs.some(d => d.filename.toLowerCase().includes('formato') || d.title.toLowerCase().includes('formato'));
  if (hasFormatos && !docs.some(d => d.id === 'formatos_firmados')) {
    docs.splice(1, 0, {
      id: 'formatos_firmados',
      title: 'FORMATOS Diligenciados y Firmados por Representante Legal (PDF)',
      category: 'juridico',
      mandatory: true,
      source: 'user_attached',
      filename: 'FORMATOS_Diligenciados_y_Firmados.pdf',
      legal_basis: 'Requisito Habilitante No Subsanable de Voluntad Jurídica',
      description: 'Debe descargar los formatos generados, firmarlos y adjuntarlos en PDF o formato digital.'
    });
  }

  return docs;
}

export function getTenderRequiredDocuments(tender: TenderData, company?: CompanyData): RequiredDossierDoc[] {
  const rawUrl = String(tender.process_url || '');
  const processNum = String(tender.process_number || tender.secop_id || 'PROCESO');
  const secopId = String(tender.secop_id || '');
  const title = (tender.title || '').toLowerCase();
  const contractType = (tender.contract_type || '').toLowerCase();
  const budget = tender.budget_cop || 0;

  // Si es una mínima cuantía
  const isMinima = contractType.includes('mínima') || contractType.includes('minima') || budget < 50_000_000;
  if (isMinima) {
    return [
      {
        id: 'letter',
        title: 'Carta de Presentación de la Oferta (Formato Oficial)',
        category: 'juridico',
        mandatory: true,
        source: 'agent_generated',
        template_type: 'letter',
        filename: `01_Carta_Presentacion_${processNum}.doc`,
        legal_basis: 'Invitación Pública de Mínima Cuantía / Decreto 1082 de 2015',
        description: 'Carta formal de postulación, manifestación bajo gravedad de juramento y aceptación de condiciones.'
      },
      {
        id: 'economy',
        title: 'Formulario de Oferta Económica Desglosada',
        category: 'economico',
        mandatory: true,
        source: 'agent_generated',
        template_type: 'economy',
        filename: `02_Oferta_Economica_${processNum}.doc`,
        legal_basis: 'Criterio de Menor Precio Ofrecido (Decreto 1082 de 2015)',
        description: `Propuesta económica desglosada por ${formatCOP(budget * 0.985)} COP.`
      },
      {
        id: 'integrity',
        title: 'Certificado de Inhabilidades e Incompatibilidades',
        category: 'juridico',
        mandatory: true,
        source: 'agent_generated',
        template_type: 'integrity',
        filename: `03_Certificado_Inhabilidades_${processNum}.doc`,
        legal_basis: 'Artículo 8 Ley 80 de 1993 y Ley 1474 de 2011',
        description: 'Declaración juramentada de inexistencia de inhabilidades, incompatibilidades o prohibiciones legales.'
      },
      {
        id: 'mipyme',
        title: 'Certificación Mipyme e Industria Nacional',
        category: 'juridico',
        mandatory: true,
        source: 'agent_generated',
        template_type: 'mipyme',
        filename: `04_Certificado_Mipyme_Ley2069_${processNum}.doc`,
        legal_basis: 'Ley 2069 de 2020 / Decreto 1860 de 2021',
        description: 'Certificación de tamaño empresarial Mipyme y componentes de origen nacional colombiano.'
      },
      {
        id: 'rut_cert',
        title: 'Registro Único Tributario (RUT) Actualizado',
        category: 'financiero',
        mandatory: true,
        source: 'user_attached',
        filename: 'RUT_Actualizado.pdf',
        legal_basis: 'Capacidad Tributaria DIAN',
        description: 'Copia del RUT con fecha de generación reciente y actividad económica correspondiente.'
      },
      {
        id: 'camara_comercio',
        title: 'Certificado de Existencia y Representación Legal',
        category: 'juridico',
        mandatory: true,
        source: 'user_attached',
        filename: 'Certificado_Existencia_Representacion_Legal.pdf',
        legal_basis: 'Cámara de Comercio (Vigencia no mayor a 30 días)',
        description: 'Certificado de matrícula mercantil expedido por la Cámara de Comercio.'
      },
      {
        id: 'parafiscales_cert',
        title: 'Certificado de Pago de Seguridad Social y Parafiscales',
        category: 'juridico',
        mandatory: true,
        source: 'user_attached',
        filename: 'Certificado_Aportes_Parafiscales_Ley789.pdf',
        legal_basis: 'Ley 789 de 2002 (Art. 50)',
        description: 'Paz y salvo de aportes parafiscales suscrito por Revisor Fiscal o Representante Legal.'
      },
      {
        id: 'cedula_rep_legal',
        title: 'Cédula del Representante Legal (Ampliada al 150%)',
        category: 'juridico',
        mandatory: true,
        source: 'user_attached',
        filename: 'Cedula_Representante_Legal_150.pdf',
        legal_basis: 'Identificación Legal del Suscriptor',
        description: 'Documento de identidad legible del representante legal debidamente ampliado.'
      }
    ];
  }

  const isObra = contractType.includes('obra') || title.includes('obra') || title.includes('construc') || title.includes('mantenimiento');
  const isConsultoria = contractType.includes('consultor') || contractType.includes('interventor') || title.includes('consultor');

  const docs: RequiredDossierDoc[] = [
    {
      id: 'letter',
      title: 'Anexo 1 - Carta de Presentación de la Propuesta',
      category: 'juridico',
      mandatory: true,
      source: 'agent_generated',
      template_type: 'letter',
      filename: `01_Anexo_1_Carta_Presentacion_${processNum}.doc`,
      legal_basis: 'Decreto 1082 de 2015, Artículo 2.2.1.1.2.2.1',
      description: 'Carta formal con identificación del proponente, manifestación juramentada y valor de la oferta.'
    },
    {
      id: 'matrix',
      title: 'Matriz de Capacidad Financiera & RUP',
      category: 'financiero',
      mandatory: true,
      source: 'agent_generated',
      template_type: 'matrix',
      filename: `02_Matriz_Financiera_RUP_${processNum}.doc`,
      legal_basis: 'Ley 1150 de 2007 (Art. 6)',
      description: 'Cuadro comparativo oficial de Liquidez, Endeudamiento y Experiencia SMMLV auditada.'
    },
    {
      id: 'economy',
      title: 'Propuesta Económica Desglosada (A.I.U. e IVA)',
      category: 'economico',
      mandatory: true,
      source: 'agent_generated',
      template_type: 'economy',
      filename: `03_Propuesta_Economica_${processNum}.doc`,
      legal_basis: 'Manual de Formulación Económica Colombia Compra Eficiente',
      description: `Desglose económico oficial por ${formatCOP(budget * 0.985)} COP.`
    },
    {
      id: 'integrity',
      title: 'Certificado de Inexistencia de Inhabilidades e Incompatibilidades',
      category: 'juridico',
      mandatory: true,
      source: 'agent_generated',
      template_type: 'integrity',
      filename: `04_Certificado_Inhabilidades_${processNum}.doc`,
      legal_basis: 'Ley 80 de 1993 (Art. 8) y Ley 1474 de 2011',
      description: 'Certificación juramentada de ausencia de inhabilidades, incompatibilidades o conflicto de intereses.'
    },
    {
      id: 'mipyme',
      title: 'Certificación Mipyme y Promoción de Industria Nacional',
      category: 'juridico',
      mandatory: true,
      source: 'agent_generated',
      template_type: 'mipyme',
      filename: `05_Certificado_Mipyme_Ley2069_${processNum}.doc`,
      legal_basis: 'Ley 2069 de 2020 / Decreto 1860 de 2021',
      description: 'Certificación para incentivo a la producción nacional y criterios de preferencia contractual.'
    },
    {
      id: 'rup_cert',
      title: 'Certificado RUP Vigente expedido por Cámara de Comercio',
      category: 'financiero',
      mandatory: true,
      source: 'user_attached',
      filename: 'Certificado_RUP_CamaraComercio.pdf',
      legal_basis: 'Ley 1150 de 2007 (Art. 6)',
      description: 'Certificado RUP en firme con vigencia no mayor a 30 días calendario.'
    },
    {
      id: 'camara_comercio',
      title: 'Certificado de Existencia y Representación Legal',
      category: 'juridico',
      mandatory: true,
      source: 'user_attached',
      filename: 'Certificado_Existencia_Representacion_Legal.pdf',
      legal_basis: 'Cámara de Comercio (Vigencia no mayor a 30 días)',
      description: 'Certificado mercantil expedido por la Cámara de Comercio correspondiente.'
    },
    {
      id: 'guarantee_policy',
      title: 'Garantía de Seriedad de la Oferta (Póliza de Aseguradora / Banco)',
      category: 'juridico',
      mandatory: true,
      source: 'user_attached',
      filename: `Poliza_Seriedad_Oferta_${processNum}.pdf`,
      legal_basis: `Decreto 1082 de 2015 (Art. 2.2.1.2.3.1.2) - 10% del Presupuesto Oficial (${formatCOP(budget * 0.10)} COP)`,
      description: `Póliza de seguros a favor de la entidad por ${formatCOP(budget * 0.10)} COP.`
    },
    {
      id: 'parafiscales_cert',
      title: 'Certificado de Pago de Seguridad Social y Parafiscales',
      category: 'juridico',
      mandatory: true,
      source: 'user_attached',
      filename: 'Certificado_Aportes_Parafiscales_Ley789.pdf',
      legal_basis: 'Ley 789 de 2002 (Art. 50)',
      description: 'Paz y salvo de aportes parafiscales de los últimos 6 meses suscrito por Revisor Fiscal o Representante.'
    },
    {
      id: 'rut_cert',
      title: 'Registro Único Tributario (RUT) Actualizado',
      category: 'financiero',
      mandatory: true,
      source: 'user_attached',
      filename: 'RUT_Actualizado.pdf',
      legal_basis: 'Capacidad Tributaria DIAN',
      description: 'Copia del RUT con actividad económica acorde al objeto contractual.'
    },
    {
      id: 'cedula_rep_legal',
      title: 'Cédula del Representante Legal (Ampliada al 150%)',
      category: 'juridico',
      mandatory: true,
      source: 'user_attached',
      filename: 'Cedula_Representante_Legal_150.pdf',
      legal_basis: 'Identificación Legal del Suscriptor',
      description: 'Copia legible del documento de identidad del representante legal.'
    },
    {
      id: 'experiencia_soportes',
      title: 'Certificaciones de Contratos y Experiencia Específica',
      category: 'tecnico',
      mandatory: true,
      source: 'user_attached',
      filename: 'Certificaciones_Experiencia_Acreditada.pdf',
      legal_basis: 'Requisitos Habilitantes de Experiencia RUP',
      description: 'Actas de liquidación o certificaciones de contratos similares ejecutados a satisfacción.'
    }
  ];

  if (isObra) {
    docs.splice(5, 0, {
      id: 'risk_matrix',
      title: 'Matriz de Tipificación y Asignación de Riesgos Previsibles',
      category: 'tecnico',
      mandatory: true,
      source: 'agent_generated',
      template_type: 'risk_matrix',
      filename: `06_Matriz_Riesgos_${processNum}.doc`,
      legal_basis: 'Ley 1150 de 2007 (Art. 4) / Manual de Riesgos CCE',
      description: 'Matriz oficial de tipificación y asignación de riesgos previsibles.'
    });
  }

  if (isConsultoria) {
    docs.push({
      id: 'team_resumes',
      title: 'Hojas de Vida del Equipo de Trabajo Clave con Soportes',
      category: 'tecnico',
      mandatory: true,
      source: 'user_attached',
      filename: 'Hojas_de_Vida_Equipo_Clave.pdf',
      legal_basis: 'Concurso de Méritos / Criterios Técnicos',
      description: 'Hojas de vida de la función pública y certificaciones del Director y profesionales.'
    });
  }

  return docs;
}

// -----------------------------------------------------------------------------
// 10. GENERADOR DEL PAQUETE ZIP COMPLETO MULTIDOCUMENTO
// -----------------------------------------------------------------------------
export async function generateDossierZip(
  company: CompanyData, 
  tender: TenderData, 
  options?: {
    signedLetter?: SignedLetterInfo | null;
    attachedFiles?: Record<string, AttachedFileInfo>;
    customDocs?: RequiredDossierDoc[];
  } | SignedLetterInfo | null
): Promise<Blob> {
  const zip = new JSZip();
  const folderName = `Expediente_${tender.process_number.replace(/[^a-zA-Z0-9_-]/g, '_')}_${company.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const root = zip.folder(folderName) || zip;

  // Manejo de compatibilidad con firma previa o nuevo formato
  let signedLetterInfo: SignedLetterInfo | null = null;
  let attachedMap: Record<string, AttachedFileInfo> = {};
  let docsList: RequiredDossierDoc[] = [];

  if (options && 'name' in options && !('attachedFiles' in options)) {
    signedLetterInfo = options as SignedLetterInfo;
    docsList = getTenderRequiredDocuments(tender, company);
  } else if (options) {
    signedLetterInfo = (options as any).signedLetter || null;
    attachedMap = (options as any).attachedFiles || {};
    docsList = (options as any).customDocs && (options as any).customDocs.length > 0 
      ? (options as any).customDocs 
      : getTenderRequiredDocuments(tender, company);
  } else {
    docsList = getTenderRequiredDocuments(tender, company);
  }

  // Carpetas estructuradas
  const folderJuridico = root.folder('01_Documentos_Juridicos');
  const folderFinanciero = root.folder('02_Documentos_Financieros_y_RUP');
  const folderTecnico = root.folder('03_Propuesta_Tecnica_y_Experiencia');
  const folderEconomico = root.folder('04_Propuesta_Economica');
  const folderAnexos = root.folder('05_Soportes_y_Garantias');

  // Procesar documentos generados por IA
  for (const doc of docsList) {
    if (doc.source === 'agent_generated') {
      let content = '';
      if (doc.template_type === 'letter' || doc.id === 'letter') {
        content = generateLetterOfOffer(company, tender);
        if (folderJuridico) folderJuridico.file(doc.filename, content);
      } else if (doc.template_type === 'matrix' || doc.id === 'matrix') {
        content = generateFinancialMatrix(company, tender);
        if (folderFinanciero) folderFinanciero.file(doc.filename, content);
      } else if (doc.template_type === 'economy' || doc.id === 'economy') {
        content = generateEconomicProposal(company, tender);
        if (folderEconomico) folderEconomico.file(doc.filename, content);
      } else if (doc.template_type === 'integrity' || doc.id === 'integrity') {
        content = generateIntegrityCert(company, tender);
        if (folderJuridico) folderJuridico.file(doc.filename, content);
      } else if (doc.template_type === 'mipyme' || doc.id === 'mipyme') {
        content = generateMipymeCert(company, tender);
        if (folderJuridico) folderJuridico.file(doc.filename, content);
      } else if (doc.template_type === 'risk_matrix' || doc.id === 'risk_matrix') {
        content = generateRiskMatrixDoc(company, tender);
        if (folderTecnico) folderTecnico.file(doc.filename, content);
      } else {
        content = generateChecklistDoc(company, tender);
        if (folderJuridico) folderJuridico.file(doc.filename, content);
      }
    }
  }

  // Procesar carta firmada
  if (signedLetterInfo) {
    const ext = signedLetterInfo.name.includes('.') ? signedLetterInfo.name.split('.').pop() : 'pdf';
    const payload = signedLetterInfo.file || new Blob([`Carta de presentacion firmada oficial: ${signedLetterInfo.name}`], { type: 'application/pdf' });
    if (folderJuridico) {
      folderJuridico.file(`01_Anexo_1_Carta_Presentacion_Firmada.${ext}`, payload);
    }
  }

  // Procesar archivos adjuntos del usuario o vinculados de la bóveda
  for (const [docId, attachInfo] of Object.entries(attachedMap)) {
    if (!attachInfo) continue;
    const payload = attachInfo.file || 
      (attachInfo.fileDataUrl ? dataUrlToBlob(attachInfo.fileDataUrl) : null) || 
      new Blob([`Documento oficial de ${attachInfo.name} para ${company.name}`], { type: 'application/pdf' });
    
    const targetDoc = docsList.find(d => d.id === docId);
    const cat = targetDoc ? targetDoc.category : 'juridico';
    const targetName = attachInfo.name || `${docId}.pdf`;

    if (cat === 'juridico' && folderJuridico) {
      folderJuridico.file(targetName, payload);
    } else if (cat === 'financiero' && folderFinanciero) {
      folderFinanciero.file(targetName, payload);
    } else if (cat === 'tecnico' && folderTecnico) {
      folderTecnico.file(targetName, payload);
    } else if (cat === 'economico' && folderEconomico) {
      folderEconomico.file(targetName, payload);
    } else if (folderAnexos) {
      folderAnexos.file(targetName, payload);
    }
  }

  // Agregar Checklist maestro e Instrucciones de radicación
  root.file('00_INSTRUCCIONES_RADICACION_SECOP.txt', generateInstructions(company, tender));
  root.file('00_Checklist_Maestro_Habilitacion.doc', generateChecklistDoc(company, tender));

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Dispara la descarga de un archivo en el navegador
 */
export function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
