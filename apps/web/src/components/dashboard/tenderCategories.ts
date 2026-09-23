/**
 * Helpers para categorización visual, imágenes contextuales y etiquetas semánticas
 * según la referencia gráfica aprobada para Emotiva LicitIA.
 */

export interface TenderCategoryInfo {
  category: string;
  tags: string[];
  imageUrl: string;
  fallbackGradient: string;
}

// Catálogo de imágenes ilustrativas de alta fidelidad organizadas por sector contractual
const CATEGORY_IMAGES: Record<string, { imageUrl: string; tags: string[] }> = {
  transporte: {
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=700&q=80',
    tags: ['Combustible', 'Suministros', 'Transporte']
  },
  tecnologia: {
    imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=700&q=80',
    tags: ['Tecnología', 'Educación', 'Servicios']
  },
  infraestructura: {
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=700&q=80',
    tags: ['Infraestructura', 'Obras', 'Tubería']
  },
  salud: {
    imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=700&q=80',
    tags: ['TI', 'Ciberseguridad', 'Soporte técnico']
  },
  seguros: {
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=700&q=80',
    tags: ['Seguros', 'Servicios financieros', 'SECOP II']
  },
  parques: {
    imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=700&q=80',
    tags: ['Obras civiles', 'Espacio público', 'Infraestructura']
  },
  consultoria: {
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=700&q=80',
    tags: ['Consultoría', 'Estudios', 'Asesoría']
  },
  educacion: {
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=700&q=80',
    tags: ['Educación', 'Logística', 'Servicios']
  },
  alimentacion: {
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
    tags: ['Alimentación', 'PAE', 'Suministros']
  },
  default: {
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=700&q=80',
    tags: ['Contratación Pública', 'Estado', 'SECOP']
  }
};

/**
 * Determina la imagen y etiquetas contextuales para una licitación dada su descripción/título/categoría
 */
export function getTenderCategoryVisual(tender: {
  title?: string;
  category?: string;
  description?: string;
  modalidad_de_contratacion?: string;
  is_minima_cuantia?: boolean;
}): TenderCategoryInfo {
  const text = `${tender.title || ''} ${tender.category || ''} ${tender.description || ''}`.toLowerCase();

  let key = 'default';
  if (text.includes('combustible') || text.includes('vehicul') || text.includes('transporte') || text.includes('automotor') || text.includes('bus') || text.includes('a.c.p.m') || text.includes('gasolina')) {
    key = 'transporte';
  } else if (text.includes('software') || text.includes('tecnolog') || text.includes('plataforma') || text.includes('ciberseguridad') || text.includes('ti') || text.includes('comput') || text.includes('soporte tecn')) {
    key = 'tecnologia';
  } else if (text.includes('tuberia') || text.includes('acueducto') || text.includes('alcantarillado') || text.includes('obra') || text.includes('construc') || text.includes('vial') || text.includes('paviment')) {
    key = 'infraestructura';
  } else if (text.includes('hospital') || text.includes('salud') || text.includes('medic') || text.includes('farmaceut') || text.includes('clinico')) {
    key = 'salud';
  } else if (text.includes('seguro') || text.includes('poliza') || text.includes('financier') || text.includes('fiduci') || text.includes('bancari')) {
    key = 'seguros';
  } else if (text.includes('parque') || text.includes('zona verde') || text.includes('recreac') || text.includes('espacio publico') || text.includes('ornato')) {
    key = 'parques';
  } else if (text.includes('educaci') || text.includes('escolar') || text.includes('colegio') || text.includes('pedagog')) {
    key = 'educacion';
  } else if (text.includes('consultor') || text.includes('interventor') || text.includes('asesor') || text.includes('estudio')) {
    key = 'consultoria';
  } else if (text.includes('alimento') || text.includes('pae') || text.includes('raciones') || text.includes('nutric')) {
    key = 'alimentacion';
  }

  const selected = CATEGORY_IMAGES[key] || CATEGORY_IMAGES.default;

  return {
    category: key,
    tags: selected.tags,
    imageUrl: selected.imageUrl,
    fallbackGradient: 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900'
  };
}

/**
 * Normaliza y devuelve los estilos y nombre legible de la modalidad de contratación
 */
export function getModalitySemanticBadge(modalityText: string, isMinimaCuantia: boolean = false) {
  const norm = (modalityText || '').toLowerCase();

  if (isMinimaCuantia || norm.includes('minima') || norm.includes('mínima')) {
    return {
      label: 'MÍNIMA CUANTÍA',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      pillClass: 'bg-[#EAFBF3] text-[#0E7A4A] border-[#C3F2DA]',
      color: 'emerald'
    };
  }

  if (norm.includes('menor cuantía') || norm.includes('menor cuantia') || norm.includes('abreviada')) {
    return {
      label: 'MENOR CUANTÍA',
      className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      pillClass: 'bg-[#F5EEFE] text-[#6B21A8] border-[#E9D5FF]',
      color: 'purple'
    };
  }

  if (norm.includes('licitacion') || norm.includes('licitación') || norm.includes('pública') || norm.includes('publica')) {
    return {
      label: 'LICITACIÓN PÚBLICA',
      className: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      pillClass: 'bg-[#FFF8E7] text-[#B45309] border-[#FDE68A]',
      color: 'amber'
    };
  }

  if (norm.includes('concurso')) {
    return {
      label: 'CONCURSO DE MÉRITOS',
      className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      pillClass: 'bg-[#EDF4FF] text-[#0B5FFF] border-[#D0E2FF]',
      color: 'blue'
    };
  }

  if (norm.includes('directa')) {
    return {
      label: 'CONTRATACIÓN DIRECTA',
      className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
      color: 'slate'
    };
  }

  return {
    label: (modalityText || 'PROCESO SECOP').toUpperCase(),
    className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
    color: 'slate'
  };
}

/**
 * Formateo monetario en pesos colombianos con formato estándar
 */
export function formatCOP(amount: number): string {
  if (!amount || isNaN(amount)) return '$0 COP';
  return `$${new Intl.NumberFormat('es-CO').format(Math.round(amount))} COP`;
}
