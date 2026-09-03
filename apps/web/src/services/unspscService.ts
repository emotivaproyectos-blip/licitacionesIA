/**
 * Servicio y Catálogo de Códigos UNSPSC de Colombia Compra Eficiente
 * Utilizado por contratistas del Estado para clasificar sus contratos en el RUP
 * y encontrar los códigos exactos solicitados por las entidades públicas.
 */

export interface UnspscCodeItem {
  code: string;
  title: string;
  segment: string;
  family: string;
  examples: string;
  commonTenders: string[];
}

export const COMMON_UNSPSC_DATABASE: UnspscCodeItem[] = [
  // TECNOLOGÍA & SOFTWARE
  {
    code: '81111500',
    title: 'Ingeniería de software o diseño y desarrollo',
    segment: 'Servicios Basados en Ingeniería, Investigación y Tecnología',
    family: 'Servicios de informática',
    examples: 'Desarrollo de software a la medida, plataformas web, apps móviles, APIs institucionales',
    commonTenders: ['Desarrollo de portales de alcaldías', 'Modernización de sistemas ERP gubernamentales', 'Plataformas educativas']
  },
  {
    code: '81111800',
    title: 'Servicios de sistemas y administración de componentes de sistemas',
    segment: 'Servicios Basados en Ingeniería, Investigación y Tecnología',
    family: 'Servicios de informática',
    examples: 'Administración de servidores, bases de datos en la nube, soporte técnico Nivel 1 a 3',
    commonTenders: ['Mesa de ayuda TI para secretarías de educación', 'Gestión de infraestructura cloud para entidades']
  },
  {
    code: '43230000',
    title: 'Software',
    segment: 'Tecnología de la Información, Telecomunicaciones y Radiodifusión',
    family: 'Software',
    examples: 'Licenciamiento de software comercial, antivirus, sistemas operativos, suites ofimáticas',
    commonTenders: ['Renovación de licencias Microsoft 365 para gobernaciones', 'Licencias de bases de datos Oracle']
  },
  {
    code: '43211500',
    title: 'Computadores',
    segment: 'Tecnología de la Información, Telecomunicaciones y Radiodifusión',
    family: 'Equipos de computación y accesorios',
    examples: 'Computadores portátiles, equipos de escritorio, servidores rack, tabletas para colegios',
    commonTenders: ['Dotación de aulas interactivas Computadores para Educar', 'Renovación de parque computacional']
  },

  // CONSULTORÍA & ASESORÍA
  {
    code: '80101500',
    title: 'Servicios de consultoría de negocios y administración corporativa',
    segment: 'Servicios de Gestión, Servicios Profesionales de Empresa y Servicios Administrativos',
    family: 'Servicios de asesoría de gestión',
    examples: 'Asesoría estratégica, rediseño institucional, interventoría administrativa, formulación de proyectos',
    commonTenders: ['Estudios de cargas laborales', 'Estructuración técnica de proyectos de inversión BPIN']
  },
  {
    code: '80111600',
    title: 'Servicios de personal temporal',
    segment: 'Servicios de Gestión, Servicios Profesionales de Empresa y Servicios Administrativos',
    family: 'Servicios de recursos humanos',
    examples: 'Misión de apoyo a la gestión, tercerización de personal administrativo',
    commonTenders: ['Apoyo logístico para censos y eventos institucionales', 'Personal de apoyo operativo']
  },

  // CONSTRUCCIÓN & OBRAS CIVILES
  {
    code: '72121100',
    title: 'Servicios de construcción de edificios comerciales y de oficina',
    segment: 'Servicios de Construcción y Mantenimiento',
    family: 'Servicios de construcción de edificios y almacenes',
    examples: 'Construcción y adecuación de sedes administrativas, palacios municipales, hospitales',
    commonTenders: ['Construcción de centros de salud', 'Adecuación de sedes judiciales y fiscalías']
  },
  {
    code: '72141000',
    title: 'Servicios de construcción de autopistas y carreteras',
    segment: 'Servicios de Construcción y Mantenimiento',
    family: 'Servicios de construcción pesada',
    examples: 'Pavimentación, placa huella en vías terciarias, reparcheo, obras de drenaje',
    commonTenders: ['Mantenimiento y mejoramiento de vías terciarias INVÍAS', 'Construcción de andenes y vías urbanas']
  },
  {
    code: '81101500',
    title: 'Servicios de ingeniería civil y de arquitectura',
    segment: 'Servicios Basados en Ingeniería, Investigación y Tecnología',
    family: 'Ingeniería y arquitectura',
    examples: 'Diseño estructural, estudios y diseños viales, levantamientos topográficos, cálculo hidrosanitario',
    commonTenders: ['Estudios y diseños de acueductos veredales', 'Interventoría técnica a obras públicas']
  },

  // LOGÍSTICA & TRANSPORTE
  {
    code: '78101800',
    title: 'Transporte de pasajeros por carretera',
    segment: 'Servicios de Transporte, Almacenaje y Correo',
    family: 'Servicios de transporte por carretera',
    examples: 'Rutas escolares, transporte de funcionarios en camionetas 4x4, alquiler de vehículos con conductor',
    commonTenders: ['Transporte escolar para zonas rurales', 'Movilidad de equipos médicos extramurales']
  },
  {
    code: '80141600',
    title: 'Servicios de organización de ferias comerciales y convenciones',
    segment: 'Servicios de Gestión, Servicios Profesionales de Empresa y Servicios Administrativos',
    family: 'Mercadeo y distribución',
    examples: 'Montaje de eventos, logística para festivales culturales, carpas, sonido e iluminación',
    commonTenders: ['Organización de ferias municipales y fiestas patronales', 'Logística de cumbres institucionales']
  },

  // SALUD & ALIMENTACIÓN
  {
    code: '50192700',
    title: 'Comidas preparadas y platos combinados',
    segment: 'Alimentos, Bebidas y Tabaco',
    family: 'Alimentos preparados',
    examples: 'Suministro de raciones alimentarias, Programa de Alimentación Escolar (PAE), refrigerios',
    commonTenders: ['Operación del Programa de Alimentación Escolar PAE', 'Servicio de alimentación para centros penitenciarios']
  },
  {
    code: '85101500',
    title: 'Servicios de centros asistenciales de salud',
    segment: 'Servicios de Salud',
    family: 'Servicios integrales de salud',
    examples: 'Brigadas de salud, programas de promoción y prevención, vacunación extramural',
    commonTenders: ['Plan de Intervenciones Colectivas (PIC)', 'Atención médica en resguardos indígenas']
  },

  // SEGURIDAD & VIGILANCIA
  {
    code: '92121500',
    title: 'Servicios de guardias de seguridad',
    segment: 'Servicios de Defensa Nacional, Orden Público, Seguridad y Vigilancia',
    family: 'Seguridad y vigilancia',
    examples: 'Vigilancia física armada y no armada, supervisión canina, monitoreo de alarmas y CCTV',
    commonTenders: ['Vigilancia de sedes educativas oficiales', 'Seguridad privada para entidades del orden nacional']
  },
  {
    code: '76111500',
    title: 'Servicios de limpieza de edificios',
    segment: 'Servicios de Limpieza, Descontaminación y Tratamiento de Residuos',
    family: 'Servicios de limpieza',
    examples: 'Aseo, cafetería, desinfección, mantenimiento general de instalaciones',
    commonTenders: ['Servicio integral de aseo y cafetería para secretarías', 'Limpieza hospitalaria especializada']
  }
];

export function searchUnspscCodes(query: string): UnspscCodeItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMON_UNSPSC_DATABASE;

  return COMMON_UNSPSC_DATABASE.filter(item => 
    item.code.includes(q) ||
    item.title.toLowerCase().includes(q) ||
    item.family.toLowerCase().includes(q) ||
    item.segment.toLowerCase().includes(q) ||
    item.examples.toLowerCase().includes(q)
  );
}
