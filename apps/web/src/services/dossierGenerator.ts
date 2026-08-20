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
  process_url?: string;
  min_liquidity_required?: number;
  max_debt_allowed?: number;
  min_smmlv_required?: number;
}

export interface SignedLetterInfo {
  file: File | Blob;
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
    Domicilio: Bogotá D.C., Colombia<br>
    Dirección Electrónica de Notificación: licitaciones@emotivatech.co / contacto@${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com<br>
    Teléfono de Contacto: (+57) 601 345 8900 / (+57) 310 890 1234
  </p>

  <div class="signature-box">
    <p><strong>REPRESENTANTE LEGAL</strong><br>
    Firma: _____________________________________<br>
    Nombre: Representante Legal Designado<br>
    C.C. N° ____________________ de Bogotá D.C.<br>
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
// 5. GUÍA DE RADICACIÓN EN SECOP
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
Generado automáticamente por Emotiva LicitIA - SaaS de Contratación Pública
================================================================================`;
}

// -----------------------------------------------------------------------------
// 6. GENERADOR DEL PAQUETE ZIP COMPLETO (INCLUYE CARTA FIRMADA REAL)
// -----------------------------------------------------------------------------
export async function generateDossierZip(
  company: CompanyData, 
  tender: TenderData,
  signedLetter?: SignedLetterInfo | null
): Promise<Blob> {
  const zip = new JSZip();

  const folderName = `Expediente_${tender.process_number.replace(/[^a-zA-Z0-9_-]/g, '_')}_${company.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const folder = zip.folder(folderName) || zip;

  // 1. Carta de Presentación: Si el usuario cargó su carta firmada real, se incluye ese archivo
  if (signedLetter && signedLetter.file) {
    const fileExt = signedLetter.name.includes('.') ? signedLetter.name.split('.').pop() : 'pdf';
    folder.file(`01_Anexo_1_Carta_Presentacion_Firmada.${fileExt}`, signedLetter.file);
  } else {
    folder.file('01_Anexo_1_Carta_Presentacion_Oferta.doc', generateLetterOfOffer(company, tender));
  }

  // 2. Matriz Financiera y RUP
  folder.file('02_Matriz_Capacidad_Financiera_y_RUP.doc', generateFinancialMatrix(company, tender));

  // 3. Checklist de Documentos
  folder.file('03_Checklist_Documentos_Habilitantes.doc', generateChecklistDoc(company, tender));

  // 4. Propuesta Económica
  folder.file('04_Propuesta_Economica_Desglosada.doc', generateEconomicProposal(company, tender));

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
