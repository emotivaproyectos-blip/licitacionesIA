import * as pdfjsLib from 'pdfjs-dist';

// Configuración robusta del worker de pdfjs para Vite
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface ParsedRupData {
  companyName?: string;
  nit?: string;
  chamberOfCommerce?: string;
  expeditionDate?: string;
  matriculaRup?: string;
  
  // Cifras financieras reales
  current_assets: number;
  current_liabilities: number;
  total_assets: number;
  total_liabilities: number;
  operating_income: number;
  interest_expense: number;
  patrimony: number;
  
  // Indicadores reales
  liquidity: number;
  debtRatio: number;
  coverageRatio: number;
  
  // Experiencia y Clasificaciones
  smmlv_experience: number;
  contracts_count?: number;
  unspsc_codes: string[];
  
  // Metadatos
  rawTextLength: number;
  extractedFromPdf: boolean;
  extractedWithAi?: boolean;
}

/**
 * Normaliza cadenas numéricas colombianas a número flotante.
 * Ej: "$ 1.250.000.000,00" -> 1250000000
 * "34,4 %" -> 34.4
 */
export function parseColombianNumber(val: string): number {
  if (!val) return 0;
  let clean = val.replace(/[\$\sCOP%]/gi, '').trim();
  
  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes('.') && !clean.includes(',')) {
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = clean.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length === 3) {
      clean = clean.replace(/\./g, '');
    }
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Extrae texto de todas las páginas de un archivo PDF reconstruyendo saltos de línea
 * y estructura tabular para no desordenar los balances financieros de Cámaras de Comercio.
 */
export async function extractAllTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let pageText = '';
      let lastY: number | null = null;
      
      for (const item of textContent.items as any[]) {
        if (!item.str) continue;
        // Si hay cambio vertical de renglón, insertar salto de línea
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 4) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = item.transform[5];
      }

      fullText += `\n--- PÁGINA ${pageNum} ---\n` + pageText;
    }

    if (fullText.trim().length > 30) {
      return fullText;
    }
  } catch (err) {
    console.warn('pdfjs-dist error leyendo texto con worker, intentando extracción binaria:', err);
  }

  // Fallback de strings binarios
  return extractRawStringsFromBuffer(file);
}

async function extractRawStringsFromBuffer(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string) || '';
      resolve(text);
    };
    reader.onerror = () => resolve('');
    reader.readAsText(file.slice(0, 500000));
  });
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://emotiva-licitia-api.onrender.com';

/**
 * Invoca el motor de extracción por IA del backend si está disponible.
 */
export async function extractRupWithBackendAI(rawText: string, fileName?: string): Promise<ParsedRupData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/rup/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: rawText,
        filename: fileName || 'Certificado_RUP.pdf'
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        companyName: data.company_name,
        nit: data.nit,
        chamberOfCommerce: data.chamber_of_commerce,
        expeditionDate: data.expedition_date,
        matriculaRup: data.matricula_rup,
        current_assets: data.current_assets || 0,
        current_liabilities: data.current_liabilities || 0,
        total_assets: data.total_assets || 0,
        total_liabilities: data.total_liabilities || 0,
        operating_income: data.operating_income || 0,
        interest_expense: data.interest_expense || 0,
        patrimony: data.patrimony || 0,
        liquidity: data.liquidity || 0,
        debtRatio: data.debt_ratio || 0,
        coverageRatio: data.coverage_ratio || 0,
        smmlv_experience: data.smmlv_experience || 0,
        contracts_count: data.contracts_count || 0,
        unspsc_codes: data.unspsc_codes || [],
        rawTextLength: rawText.length,
        extractedFromPdf: true,
        extractedWithAi: true
      };
    }
  } catch (err) {
    console.warn('Backend RUP AI extraction not available, using advanced local heuristics:', err);
  }
  return null;
}

/**
 * Analizador semántico y heurístico local especializado en certificados RUP de Colombia
 * (Cámaras de Comercio: Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, etc.)
 */
export function parseRupText(rawText: string, fileName?: string): ParsedRupData {
  const text = rawText || '';
  const extractedFromPdf = text.length > 30;

  // 1. EXTRAER NIT (con o sin DV)
  let nit = '';
  const nitPatterns = [
    /(?:NIT|N\.I\.T\.|Identificaci[oó]n|Tributaria)[:\s]*([0-9]{2,3}[\.\s]?[0-9]{3}[\.\s]?[0-9]{3}(?:-[0-9kK])?)/i,
    /(?:NIT|N\.I\.T\.)\s*([0-9]{8,10}(?:-[0-9kK])?)/i,
    /\b([89]\d{2}[\.\s]?\d{3}[\.\s]?\d{3}(?:-\d)?)\b/
  ];

  for (const pat of nitPatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      nit = m[1].replace(/\s+/g, '').trim();
      break;
    }
  }

  // Fallback desde nombre de archivo si contiene NIT (ej: ficha_rup_900796767.pdf)
  if (!nit && fileName) {
    const fnNitMatch = fileName.match(/\b([89]\d{6,9})\b/);
    if (fnNitMatch) {
      nit = fnNitMatch[1];
    }
  }

  // 2. EXTRAER RAZÓN SOCIAL / NOMBRE PROPONENTE
  let companyName = '';
  const namePatterns = [
    /(?:Nombre o Razón Social|Razón Social|Nombre del Proponente|Proponente|Organización)[:\s]+([^\n\r]{3,80})/i,
    /\b([A-Z0-9\s.,&áéíóúÁÉÍÓÚÑñ]{4,50}\s+(?:S\.A\.S\.|SAS|LTDA|LIMITADA|S\.A\.|S\.C\.S\.|E\.U\.))\b/i
  ];

  for (const pat of namePatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      let candidate = m[1].split('\n')[0].replace(/\bNIT\b.*$/i, '').trim().replace(/\s+/g, ' ');
      if (!candidate.toLowerCase().includes('cámara de comercio') && candidate.length > 3) {
        companyName = candidate;
        break;
      }
    }
  }

  if (!companyName && fileName) {
    const fnClean = fileName.replace(/\.pdf$/i, '').replace(/^(?:ficha_rup_|certificado_rup_|rup_)/i, '');
    if (fnClean.length >= 3) {
      companyName = fnClean
        .replace(/_/g, ' ')
        .toUpperCase()
        .replace(/\bSAS\b/i, 'S.A.S.')
        .replace(/\bLTDA\b/i, 'LTDA.');
    }
  }

  // 3. CÁMARA DE COMERCIO
  let chamberOfCommerce = 'Cámara de Comercio';
  const chamberMatch = text.match(/Cámara de Comercio de\s+([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+?)(?:[\n\r,.\-]|\s{2,})/i);
  if (chamberMatch && chamberMatch[1]) {
    chamberOfCommerce = `Cámara de Comercio de ${chamberMatch[1].trim()}`;
  }

  // 4. EXTRAER CIFRAS FINANCIERAS REALES CON PATRONES MÚLTIPLES
  const findFinancialNumber = (patterns: RegExp[]): number => {
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m && m[1]) {
        const val = parseColombianNumber(m[1]);
        if (val > 0) return val;
      }
    }
    return 0;
  };

  // Activo Corriente
  const currentAssets = findFinancialNumber([
    /(?:Activo\s+Corriente|Activos\s+Corrientes|ACTIVO\s+CTE)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]{6,12})/i,
    /Activo\s+Corriente[\s\S]{1,50}?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?)/i
  ]);

  // Pasivo Corriente
  const currentLiabilities = findFinancialNumber([
    /(?:Pasivo\s+Corriente|Pasivos\s+Corrientes|PASIVO\s+CTE)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]{6,12})/i,
    /Pasivo\s+Corriente[\s\S]{1,50}?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?)/i
  ]);

  // Activo Total
  const totalAssets = findFinancialNumber([
    /(?:Activo\s+Total|Activos\s+Totales|Total\s+Activos?|TOTAL\s+ACTIVO)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]{6,12})/i,
    /Activo\s+Total[\s\S]{1,50}?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?)/i
  ]);

  // Pasivo Total
  const totalLiabilities = findFinancialNumber([
    /(?:Pasivo\s+Total|Pasivos\s+Totales|Total\s+Pasivos?|TOTAL\s+PASIVO)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]{6,12})/i,
    /Pasivo\s+Total[\s\S]{1,50}?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?)/i
  ]);

  // Patrimonio
  const patrimony = findFinancialNumber([
    /(?:Patrimonio\s+Total|Total\s+Patrimonio|Patrimonio\s+Neto|Patrimonio)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]{6,12})/i
  ]);

  // Utilidad Operacional
  const operatingIncome = findFinancialNumber([
    /(?:Utilidad\s+Operacional|Utilidad\s+Operativa|Resultado\s+Operacional|UTILIDAD\s+OPERACIONAL)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]{6,12})/i
  ]);

  // Gastos de Intereses
  const interestExpense = findFinancialNumber([
    /(?:Gastos\s+de\s+Intereses?|Gastos\s+Financieros|Gastos\s+por\s+Intereses?|Intereses)[^\d\$]{0,30}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]{6,12})/i
  ]);

  // Indicadores explícitos o calculados
  let explicitLiquidity = 0;
  const liqMatch = text.match(/(?:[IÍ]ndice\s+de\s+Liquidez|Liquidez)[^\d]{0,20}([0-9]+[.,][0-9]+)/i);
  if (liqMatch && liqMatch[1]) {
    explicitLiquidity = parseColombianNumber(liqMatch[1]);
  }

  let explicitDebt = 0;
  const debtMatch = text.match(/(?:[IÍ]ndice\s+de\s+Endeudamiento|Endeudamiento|Nivel\s+de\s+Endeudamiento)[^\d]{0,20}([0-9]+[.,]?[0-9]*)\s*%?/i);
  if (debtMatch && debtMatch[1]) {
    explicitDebt = parseColombianNumber(debtMatch[1]);
    if (explicitDebt > 0 && explicitDebt <= 1.0) {
      explicitDebt = parseFloat((explicitDebt * 100).toFixed(1));
    }
  }

  const liquidity = explicitLiquidity > 0 
    ? explicitLiquidity 
    : (currentLiabilities > 0 ? parseFloat((currentAssets / currentLiabilities).toFixed(2)) : 0);

  const debtRatio = explicitDebt > 0 
    ? explicitDebt 
    : (totalAssets > 0 ? parseFloat(((totalLiabilities / totalAssets) * 100).toFixed(1)) : 0);

  const coverageRatio = interestExpense > 0 
    ? parseFloat((operatingIncome / interestExpense).toFixed(2)) 
    : 0;

  // 5. EXTRAER EXPERIENCIA RUP (SMMLV) REAL
  let smmlvExperience = 0;
  const smmlvExplicit = text.match(/(?:Total\s+SMMLV|Experiencia\s+en\s+SMMLV|Cuant[ií]a\s+Total\s+en\s+SMMLV|Total\s+Experiencia\s+Acreditada)[^\d]{0,20}([0-9]+(?:[.,][0-9]+)?)/i);
  if (smmlvExplicit && smmlvExplicit[1]) {
    smmlvExperience = parseColombianNumber(smmlvExplicit[1]);
  } else {
    // Buscar todas las ocurrencias de contratos con valores en SMMLV y sumar
    const smmlvMatches = Array.from(text.matchAll(/(?:Cuant[ií]a|Valor|SMMLV)[:\s]*([0-9]+(?:[.,][0-9]+)?)\s*SMMLV/gi));
    if (smmlvMatches.length > 0) {
      let sum = 0;
      for (const sm of smmlvMatches) {
        sum += parseColombianNumber(sm[1]);
      }
      if (sum > 0) smmlvExperience = parseFloat(sum.toFixed(1));
    }
  }

  // 6. EXTRAER CÓDIGOS UNSPSC REALES (8 DÍGITOS - SEGMENTOS VÁLIDOS 10..95)
  // Filtrar de secciones de clasificación para evitar folios, marcas de agua o radicados
  const foundCodes = new Set<string>();
  const cleanNitDigits = (nit || '').replace(/[^0-9]/g, '');

  // Buscar específicamente dentro de secciones de clasificación o contratos
  const classificationSections = text.match(/(?:CLASIFICACI[ÓO]N|BIENES\s+Y\s+SERVICIOS|C[ÓO]DIGOS\s+UNSPSC|EXPERIENCIA)[\s\S]{1,8000}?(?:---|\n\n\n|\Z)/gi);
  const targetText = classificationSections ? classificationSections.join('\n') : text;

  const unspscMatches = Array.from(targetText.matchAll(/\b([1-9][0-9]{7})\b/g));
  for (const m of unspscMatches) {
    const code = m[1];
    const segment = parseInt(code.slice(0, 2), 10);
    // Segmentos reales del estándar UNSPSC (10 a 95)
    // Excluir años típicos y partes de NIT
    if (segment >= 10 && segment <= 95 && !code.startsWith('199') && !code.startsWith('202') && !cleanNitDigits.includes(code)) {
      foundCodes.add(code);
    }
  }

  // Si vienen en formato con puntos (ej: 80.10.15.00)
  const dottedMatches = Array.from(targetText.matchAll(/\b([1-9][0-9]\.[0-9]{2}\.[0-9]{2}\.[0-9]{2})\b/g));
  for (const m of dottedMatches) {
    const cleanCode = m[1].replace(/\./g, '');
    const segment = parseInt(cleanCode.slice(0, 2), 10);
    if (segment >= 10 && segment <= 95) {
      foundCodes.add(cleanCode);
    }
  }

  const unspscList = Array.from(foundCodes);

  return {
    companyName: companyName || undefined,
    nit: nit || undefined,
    chamberOfCommerce: chamberOfCommerce,
    current_assets: currentAssets,
    current_liabilities: currentLiabilities,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    operating_income: operatingIncome,
    interest_expense: interestExpense,
    patrimony: patrimony,
    liquidity: liquidity,
    debtRatio: debtRatio,
    coverageRatio: coverageRatio,
    smmlv_experience: smmlvExperience,
    unspsc_codes: unspscList,
    rawTextLength: text.length,
    extractedFromPdf: extractedFromPdf,
    extractedWithAi: false
  };
}
