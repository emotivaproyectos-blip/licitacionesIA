import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  ArrowLeft, 
  Search, 
  Printer, 
  ShieldCheck, 
  FileText, 
  Scale, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Sun, 
  Moon, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Sparkles,
  ChevronRight,
  Database,
  CreditCard,
  Ban,
  Clock,
  Briefcase,
  UserCheck,
  Eye,
  Server,
  Globe2
} from "lucide-react";

interface PrivacyPageProps {
  onBack: () => void;
  darkMode?: boolean;
  onToggleTheme?: () => void;
  onEnterDashboard?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onOpenTerms?: () => void;
}

interface SectionItem {
  id: string;
  num: number;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({
  onBack,
  darkMode = false,
  onToggleTheme,
  onEnterDashboard,
  onOpenAuth,
  onOpenTerms
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string>("sec-1");
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Control de scroll y progreso
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }

      // Detectar sección activa
      const sectionElements = sections.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Definición completa de las 28 secciones de la Política de Privacidad
  const sections: SectionItem[] = useMemo(() => [
    {
      id: "sec-1",
      num: 1,
      title: "Identificación del Responsable del Tratamiento",
      icon: Building2,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            <strong>EMOTIVA TECH S.A.S.</strong>, sociedad comercial colombiana debidamente constituida, identificada con NIT <strong>901.452.890-1</strong>, con domicilio en Colombia (en adelante <strong>"LicitIA"</strong>, la <strong>"Compañía"</strong> o el <strong>"Responsable"</strong>), es responsable del Tratamiento de los datos personales que recolecta, almacena, usa, consulta, procesa, circula, transmite, transfiere, actualiza o suprime en desarrollo de sus operaciones y plataformas tecnológicas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-1">
              <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-600" /> Correo de Privacidad & Habeas Data
              </div>
              <p className="text-slate-700 dark:text-slate-300">contacto@emotivatech.co / soporte@licitia.co</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-1">
              <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" /> Domicilio y Cobertura
              </div>
              <p className="text-slate-700 dark:text-slate-300">Bogotá D.C. / Bucaramanga, República de Colombia</p>
            </div>
          </div>
          <p className="leading-relaxed">
            Cuando la Compañía trate datos personales por cuenta de un Cliente empresarial que decide las finalidades y medios del Tratamiento (ejemplo: análisis de información de consorcios o terceros incluidos en pliegos), LicitIA actuará como <strong>Encargado del Tratamiento</strong>, procesando la información conforme a las instrucciones del Cliente y la legislación aplicable.
          </p>
        </div>
      )
    },
    {
      id: "sec-2",
      num: 2,
      title: "Objeto y alcance corporativo de la Política",
      icon: Globe2,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Esta Política establece las directrices bajo las cuales LicitIA realiza el Tratamiento de datos personales en Colombia conforme a la <strong>Ley Estatutaria 1581 de 2012</strong>, el <strong>Decreto 1377 de 2013</strong> y demás normas concordantes sobre protección de datos y Habeas Data.
          </p>
          <p className="leading-relaxed">
            Aplica a todas las interacciones a través del sitio web, aplicaciones web, módulos de inteligencia artificial de lectura de pliegos, cotejo de certificados RUP, APIs, integraciones, alertas licitatorias y canales de soporte operados por la Compañía.
          </p>
        </div>
      )
    },
    {
      id: "sec-3",
      num: 3,
      title: "Rol de la Compañía como Responsable y/o Encargado",
      icon: Scale,
      content: (
        <div className="space-y-4">
          <ul className="space-y-3 list-none pl-0">
            <li className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 font-bold block mb-1">Como Responsable del Tratamiento:</strong>
              Respecto de los datos recolectados para la creación y gestión de cuentas, autenticación, facturación electrónica, cobros, soporte directo, registros de auditoría y comunicaciones corporativas.
            </li>
            <li className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 font-bold block mb-1">Como Encargado del Tratamiento:</strong>
              Respecto de la información personal contenida en los documentos, certificados RUP, balances y estados financieros cargados o conectados por el Cliente para su preevaluación frente a procesos de contratación.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "sec-4",
      num: 4,
      title: "Definiciones legales",
      icon: FileText,
      content: (
        <div className="space-y-3">
          <p className="leading-relaxed">Conforme a la Ley 1581 de 2012, se definen los siguientes términos:</p>
          <ul className="space-y-2.5 list-none pl-0 text-xs sm:text-sm">
            <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong>Autorización:</strong> Consentimiento previo, expreso e informado del Titular para llevar a cabo el Tratamiento de sus datos.
            </li>
            <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong>Dato Personal:</strong> Cualquier dato vinculado o asociable a una o varias personas naturales determinadas o determinables.
            </li>
            <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong>Dato Público:</strong> Aquel calificado como tal por la ley (ej: datos contenidos en registros públicos, certificados de Cámara de Comercio o SECOP).
            </li>
            <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong>Dato Sensible:</strong> Información que afecta la intimidad del Titular o cuyo uso indebido puede generar discriminación (origen racial, convicciones, salud, datos biométricos).
            </li>
            <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong>Titular:</strong> Persona natural cuyos datos son objeto de Tratamiento.
            </li>
            <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong>Tratamiento:</strong> Cualquier operación sobre datos personales (recolección, almacenamiento, uso, circulación o supresión).
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "sec-5",
      num: 5,
      title: "Principios rectores del Tratamiento",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            LicitIA aplica de manera estricta los principios legales colombianos de:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">✦ Legalidad y Libertad</strong>
              El tratamiento obedece a fines legítimos y requiere consentimiento previo e informado.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">✦ Veracidad y Transparencia</strong>
              Información veraz, completa, actualizada y con garantía de acceso por el Titular.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">✦ Acceso y Circulación Restringida</strong>
              Solo accesible por personas y sistemas autorizados bajo estrictas políticas RLS.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">✦ Seguridad y Confidencialidad</strong>
              Protección reforzada contra acceso no autorizado, adulteración o pérdida.
            </div>
          </div>
        </div>
      )
    },
    {
      id: "sec-6",
      num: 6,
      title: "Categorías de Titulares",
      icon: UserCheck,
      content: (
        <div className="space-y-3">
          <p className="leading-relaxed">Esta Política aplica a:</p>
          <ul className="space-y-2 list-disc pl-5 text-xs sm:text-sm">
            <li>Usuarios registrados y visitantes de la plataforma web y landing pages.</li>
            <li>Representantes legales, socios, directivos y administradores de cuenta de empresas licitadoras.</li>
            <li>Contadores públicos, revisores fiscales y profesionales técnicos cuyos datos constan en certificados RUP o balances cargados.</li>
            <li>Contactos de soporte, clientes potenciales y suscriptores de alertas informativas.</li>
          </ul>
        </div>
      )
    },
    {
      id: "sec-7",
      num: 7,
      title: "Categorías de datos personales tratados",
      icon: Database,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">LicitIA podrá recolectar y tratar las siguientes categorías de datos:</p>
          <ul className="space-y-2.5 list-none pl-0 text-xs sm:text-sm">
            <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong>Datos de Identificación y Contacto:</strong> Nombre, apellidos, razón social, NIT o cédula, correo corporativo, teléfono, cargo y ciudad.
            </li>
            <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong>Datos de Autenticación:</strong> Credenciales cifradas mediante hash criptográfico (bcrypt/Argon2), tokens JWT de sesión segura, proveedor OAuth (Google).
            </li>
            <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong>Información de RUP y Balances:</strong> Cifras de activo corriente, pasivo corriente, activo total, pasivo total, utilidad operacional, gastos de intereses, experiencia acreditada en SMMLV y clasificaciones UNSPSC (tratados bajo estricta reserva).
            </li>
            <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong>Datos Transaccionales y Facturación:</strong> Plan contratado, identificadores de pago de pasarela (Wompi, PSE, Stripe), estado de transacción e información para factura electrónica DIAN (la Compañía no almacena números completos de tarjetas ni CVV).
            </li>
            <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong>Datos Técnicos y de Navegación:</strong> Dirección IP, tipo de navegador, sistema operativo, registros de actividad, eventos de auditoría y métricas de rendimiento.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "sec-8",
      num: 8,
      title: "Tratamiento por líneas de servicio y casos de uso",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            <strong>SaaS de Licitaciones e Inteligencia Artificial:</strong> LicitIA procesa los documentos cargados por el Cliente con el único propósito de extraer requisitos habilitantes y realizar comparaciones matemáticas frente a los pliegos del SECOP.
          </p>
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex gap-3">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Garantía de Aislamiento de IA:</strong> Los datos privados de tus balances, RUP y documentos confidenciales NO se utilizan para entrenar modelos públicos de terceros ni se comparten con otras empresas competidoras.
            </div>
          </div>
        </div>
      )
    },
    {
      id: "sec-9",
      num: 9,
      title: "Finalidades generales del Tratamiento",
      icon: CheckCircle2,
      content: (
        <div className="space-y-3">
          <p className="leading-relaxed">Los datos personales son tratados con las siguientes finalidades legítimas:</p>
          <ul className="space-y-2 list-disc pl-5 text-xs sm:text-sm">
            <li>Creación, autenticación y administración de la cuenta de usuario en la plataforma.</li>
            <li>Ejecución de las funcionalidades de búsqueda, cálculo de requisitos habilitantes y análisis de compatibilidad RUP.</li>
            <li>Generación y descarga de checklists, formatos y expedientes ZIP de radicación.</li>
            <li>Emisión de facturación electrónica conforme a los requerimientos tributarios de la DIAN.</li>
            <li>Envío de alertas operativas sobre convocatorias licitatorias de interés en SECOP I y II.</li>
            <li>Atención de consultas, soporte técnico y radicación de solicitudes de Habeas Data.</li>
            <li>Detección, prevención y mitigación de fraude, accesos no autorizados o ciberataques.</li>
          </ul>
        </div>
      )
    },
    {
      id: "sec-10",
      num: 10,
      title: "Autorización y aviso de privacidad",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            LicitIA obtiene la autorización previa, expresa e informada del Titular mediante mecanismos electrónicos verificables (casillas de verificación en formularios de registro, aceptación de términos o ingreso mediante credenciales seguras).
          </p>
          <p className="leading-relaxed">
            La Compañía conserva registros inalterables de la fecha, hora, correo electrónico y dirección IP de cada consentimiento otorgado, con plena validez probatoria conforme a la <strong>Ley 527 de 1999</strong>.
          </p>
        </div>
      )
    },
    {
      id: "sec-11",
      num: 11,
      title: "Datos sensibles y de especial protección",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            LicitIA <strong>no condiciona el acceso a la plataforma</strong> al suministro de datos sensibles (datos biométricos, de salud, orientación política o religiosa). En caso de que algún documento público o certificado contenga incidentalmente este tipo de información, será tratado con estándares reforzados de seguridad y reserva legal.
          </p>
        </div>
      )
    },
    {
      id: "sec-12",
      num: 12,
      title: "Datos de menores de edad",
      icon: Ban,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            LicitIA es una plataforma dirigida exclusivamente al ámbito corporativo, profesional y empresarial B2B. Los servicios no están destinados a menores de 18 años ni se recolecta deliberadamente información de niños, niñas o adolescentes.
          </p>
        </div>
      )
    },
    {
      id: "sec-13",
      num: 13,
      title: "Inteligencia artificial, automatización y trazabilidad",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Los motores de IA empleados por LicitIA procesan temporalmente los textos de pliegos y balances para extraer entidades y calcular fórmulas financieras.
          </p>
          <ul className="space-y-2 list-disc pl-5 text-xs sm:text-sm">
            <li><strong>Supervisión humana:</strong> Las preevaluaciones generadas por IA son herramientas analíticas de apoyo que deben ser validadas por el proponente antes de presentar ofertas formales ante las entidades contratantes.</li>
            <li><strong>Privacidad por diseño:</strong> La infraestructura aplica minimización de datos y anonimización de metadatos en los registros de diagnóstico.</li>
          </ul>
        </div>
      )
    },
    {
      id: "sec-14",
      num: 14,
      title: "Consulta de fuentes públicas de contratación",
      icon: Globe2,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            La información sobre procesos licitatorios, pliegos y adjudicaciones proviene de fuentes públicas oficiales del Estado colombiano (Colombia Compra Eficiente, SECOP I, SECOP II y datos.gov.co), las cuales ostentan naturaleza pública conforme al artículo 24 de la Ley 1437 de 2011 y la Ley 1712 de 2014 de Transparencia.
          </p>
        </div>
      )
    },
    {
      id: "sec-15",
      num: 15,
      title: "Automatizaciones y alertas de procesos",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            El Cliente podrá autorizar el envío de alertas licitatorias y notificaciones sobre convocatorias afines a su objeto social mediante correo electrónico o WhatsApp corporativo. El usuario podrá revocar o modificar estas preferencias en cualquier momento.
          </p>
        </div>
      )
    },
    {
      id: "sec-16",
      num: 16,
      title: "Cookies, almacenamiento local y analítica",
      icon: Server,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            La Plataforma utiliza cookies técnicas estrictamente necesarias y almacenamiento local (LocalStorage / SessionStorage) para:
          </p>
          <ul className="space-y-2 list-disc pl-5 text-xs sm:text-sm">
            <li>Mantener activa la sesión autenticada del usuario de forma segura.</li>
            <li>Recordar preferencias de interfaz (modo oscuro o claro, filtros de búsqueda).</li>
            <li>Monitorear el rendimiento y estabilidad de la plataforma mediante analítica agregada no rastreable.</li>
          </ul>
        </div>
      )
    },
    {
      id: "sec-17",
      num: 17,
      title: "Notificaciones y comunicaciones",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Se diferencian claramente las <strong>comunicaciones transaccionales</strong> (necesarias para el funcionamiento del servicio, seguridad o facturación) de las <strong>comunicaciones comerciales</strong>. Estas últimas siempre incluirán un enlace directo para solicitar la exclusión voluntaria (*opt-out*).
          </p>
        </div>
      )
    },
    {
      id: "sec-18",
      num: 18,
      title: "Pagos, facturación y suscripciones",
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Las transacciones de pago se procesan a través de pasarelas debidamente certificadas bajo estándares PCI-DSS (PSE, Wompi, Stripe). LicitIA <strong>no almacena ni tiene acceso</strong> a los números completos de tarjetas de crédito o códigos de seguridad, recibiendo únicamente tokens de confirmación de pago y datos de facturación electrónica.
          </p>
        </div>
      )
    },
    {
      id: "sec-19",
      num: 19,
      title: "Derechos de los Titulares (Habeas Data)",
      icon: Scale,
      content: (
        <div className="space-y-3">
          <p className="leading-relaxed">En virtud del artículo 8 de la Ley 1581 de 2012, el Titular de los datos personales cuenta con los siguientes derechos:</p>
          <ul className="space-y-2 list-disc pl-5 text-xs sm:text-sm">
            <li><strong>Conocer, actualizar y rectificar</strong> sus datos personales frente a LicitIA.</li>
            <li><strong>Solicitar prueba</strong> de la autorización otorgada para el Tratamiento.</li>
            <li><strong>Ser informado</strong> sobre el uso que la Compañía ha dado a sus datos.</li>
            <li><strong>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC)</strong> por infracciones al régimen de protección de datos personales.</li>
            <li><strong>Revocar la autorización y/o solicitar la supresión del dato</strong> cuando no exista un deber legal o contractual de permanecer en la base de datos.</li>
            <li><strong>Acceder gratuitamente</strong> a sus datos personales que hayan sido objeto de Tratamiento.</li>
          </ul>
        </div>
      )
    },
    {
      id: "sec-20",
      num: 20,
      title: "Procedimiento para el ejercicio de derechos (PQRS)",
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Para ejercer sus derechos de Habeas Data, el Titular o su apoderado debidamente acreditado podrá radicar su solicitud a través de:
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-slate-900 dark:text-white">Canal Oficial: <span className="text-blue-600 dark:text-blue-400">contacto@emotivatech.co / soporte@licitia.co</span></div>
            <div className="space-y-1 text-slate-600 dark:text-slate-300">
              <p>• <strong>Consultas:</strong> Serán atendidas en un término máximo de <strong>diez (10) días hábiles</strong> contados a partir de su recepción.</p>
              <p>• <strong>Reclamos (Corrección, supresión o revocatoria):</strong> Serán atendidos en un término máximo de <strong>quince (15) días hábiles</strong>.</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            La solicitud debe incluir nombre completo, número de documento, correo de notificación, descripción clara de los hechos y documentos soporte.
          </p>
        </div>
      )
    },
    {
      id: "sec-21",
      num: 21,
      title: "Encargados, proveedores de nube y destinatarios",
      icon: Server,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            LicitIA utiliza proveedores tecnológicos de infraestructura de primer nivel para la prestación segura de sus servicios:
          </p>
          <ul className="space-y-2 list-disc pl-5 text-xs sm:text-sm">
            <li><strong>Base de Datos y Autenticación:</strong> Supabase / PostgreSQL con aislamiento Row-Level Security (RLS).</li>
            <li><strong>Infraestructura Cloud y CDN:</strong> Cloudflare / Vercel para protección DDoS y distribución segura.</li>
            <li><strong>Pasarelas de Pago:</strong> Wompi / Stripe / PSE para procesamiento bancario tokenizado.</li>
          </ul>
          <p className="leading-relaxed">
            Todos los proveedores se encuentran sujetos a contratos de confidencialidad y cláusulas de protección de datos acordes a la ley colombiana.
          </p>
        </div>
      )
    },
    {
      id: "sec-22",
      num: 22,
      title: "Transferencias y transmisiones internacionales",
      icon: Globe2,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Para garantizar la alta disponibilidad y redundancia del SaaS, los datos podrán ser transmitidos a servidores en la nube ubicados en jurisdicciones con estándares internacionales de seguridad (cifrado en tránsito y en reposo). Al aceptar esta Política, el Titular autoriza dichas transmisiones técnicas necesarias para la ejecución del servicio contratado.
          </p>
        </div>
      )
    },
    {
      id: "sec-23",
      num: 23,
      title: "Seguridad de la información y salvaguardas técnicas",
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">LicitIA adopta medidas técnicas, organizacionales y humanas rigurosas:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">✦ Cifrado de Extremo a Extremo</strong>
              Cifrado en tránsito mediante TLS 1.3 y cifrado en reposo con algoritmos AES-256.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">✦ Row-Level Security (RLS)</strong>
              Aislamiento absoluto en PostgreSQL que impide el acceso cruzado entre cuentas de empresas.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">✦ Copias de Seguridad Cifradas</strong>
              Respaldos automáticos periódicos para garantizar la continuidad operativa.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">✦ Monitoreo y Auditoría</strong>
              Trazabilidad y detección proactiva de anomalías en el tráfico de red.
            </div>
          </div>
        </div>
      )
    },
    {
      id: "sec-24",
      num: 24,
      title: "Conservación, supresión y retención documental",
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Los datos personales se conservarán mientras la cuenta permanezca activa y durante los términos exigidos por la legislación comercial y tributaria colombiana (conservación de soportes contables y facturación por 5 a 10 años). Trascurridos dichos plazos, la información será suprimida o anonimizada de forma segura.
          </p>
        </div>
      )
    },
    {
      id: "sec-25",
      num: 25,
      title: "Obligaciones del Cliente sobre datos de terceros",
      icon: UserCheck,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            El Cliente que cargue o procese documentos que contengan datos de terceros (ej: profesionales en consorcios o certificaciones comerciales) declara y garantiza contar con las debidas autorizaciones de dichos titulares conforme a la Ley 1581 de 2012.
          </p>
        </div>
      )
    },
    {
      id: "sec-26",
      num: 26,
      title: "Responsabilidad demostrada y privacidad desde el diseño",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            La Compañía implementa el principio de <strong>Responsabilidad Demostrada (*Accountability*)</strong> mediante revisiones periódicas de seguridad, políticas de acceso por roles y evaluaciones de impacto en privacidad para cada nueva funcionalidad del SaaS.
          </p>
        </div>
      )
    },
    {
      id: "sec-27",
      num: 27,
      title: "Modificaciones a la Política de Privacidad",
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            LicitIA podrá actualizar esta Política para reflejar cambios normativos o mejoras en la arquitectura del sistema. Las modificaciones sustanciales serán notificadas a través de la plataforma o al correo electrónico registrado con antelación a su entrada en vigencia.
          </p>
        </div>
      )
    },
    {
      id: "sec-28",
      num: 28,
      title: "Vigencia",
      icon: CalendarIcon,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            La presente Política de Tratamiento de Datos Personales y Privacidad rige a partir de <strong>mayo de 2026</strong> y permanecerá vigente mientras la Compañía desarrolle su objeto social y preste los servicios de la plataforma LicitIA.
          </p>
        </div>
      )
    }
  ], []);

  // Filtrar secciones si hay búsqueda activa
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(sec => 
      sec.title.toLowerCase().includes(q) || 
      sec.num.toString().includes(q)
    );
  }, [sections, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Barra de progreso de lectura superior */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 z-[100] transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* HEADER SUPERIOR FLOTANTE CON GLASSMORPHISM */}
      <header className="sticky top-0 z-50 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">LicitIA</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block -mt-0.5">Privacidad & Datos</span>
              </div>
            </div>
          </div>

          {/* Buscador en vivo de cláusulas */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en la política (ej: RLS, IA, RUP, Derechos, PQRS)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Acciones de cabecera */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Imprimir documento"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
                title="Cambiar tema"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}

            {onOpenTerms && (
              <button
                onClick={onOpenTerms}
                className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs hidden md:flex items-center gap-1.5"
              >
                <Scale className="w-4 h-4" />
                <span>Ver Términos</span>
              </button>
            )}

            {onEnterDashboard && (
              <button
                onClick={onEnterDashboard}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 cursor-pointer hidden sm:flex items-center gap-1.5"
              >
                <span>Ir a la App</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* HERO BANNER DE PRIVACIDAD */}
        <div className="mb-10 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide uppercase shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Ley 1581 de 2012 & Habeas Data en Colombia
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Política de Privacidad y Tratamiento de Datos
          </h1>
          
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Conoce cómo <strong>EMOTIVA TECH S.A.S.</strong> protege, almacena y procesa tus datos personales y empresariales en la plataforma <strong>LicitIA</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              Versión 1.0 &mdash; Actualizado Mayo de 2026
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              Superintendencia de Industria y Comercio (SIC)
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              28 Secciones
            </span>
          </div>
        </div>

        {/* TARJETAS DE RESUMEN ("PRIVACIDAD EN 60 SEGUNDOS") */}
        <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Aislamiento RLS Total</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tus balances y certificados RUP están blindados en PostgreSQL con políticas Row-Level Security estrictas.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">No Entrenamiento de IA</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tus documentos privados no se usan para reentrenar modelos públicos de terceros ni se comparten con competidores.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Pagos Tokenizados</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Transacciones seguras vía Wompi/PSE sin almacenar números de tarjeta en nuestros servidores.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Scale className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Derechos ARCO y PQRS</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Atención ágil de consultas en 10 días hábiles y reclamos de Habeas Data en 15 días hábiles.
            </p>
          </div>
        </div>

        {/* GRID DE DOS COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SIDEBAR NAVEGABLE STICKY (4 Cols) */}
          <aside className="lg:col-span-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 custom-scrollbar hidden lg:block">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Secciones de Privacidad
                </span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                  {filteredSections.length} artículos
                </span>
              </div>

              {/* Lista de navegación */}
              <nav className="space-y-1">
                {filteredSections.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-start gap-2.5 cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/20 translate-x-1"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-md ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}>
                        {sec.num.toString().padStart(2, "0")}
                      </span>
                      <span className="truncate leading-relaxed">{sec.title}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Caja de PQRS de Datos Personales */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    Canal de Habeas Data
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Escríbenos a <span className="font-bold text-emerald-600 dark:text-emerald-400">contacto@emotivatech.co</span> para actualizar o suprimir tus datos.
                  </p>
                </div>
              </div>

            </div>
          </aside>

          {/* COLUMNA DE CONTENIDO (8 Cols) */}
          <div ref={contentRef} className="lg:col-span-8 space-y-8">
            
            {filteredSections.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <Search className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No se encontraron artículos coincidentes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Intenta buscar con otros términos como "Habeas Data", "RLS", "IA", "Supabase" o "Derechos".
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Ver toda la política
                </button>
              </div>
            ) : (
              filteredSections.map((sec) => {
                return (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-all scroll-mt-28"
                  >
                    <div className="flex items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-mono font-bold text-sm shadow-xs">
                        {sec.num}
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                          Artículo {sec.num}
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                          {sec.title}
                        </h2>
                      </div>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed legal-body">
                      {sec.content}
                    </div>
                  </article>
                );
              })
            )}

            {/* CAJA DE CIERRE */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white border border-emerald-900/50 shadow-2xl space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Privacidad & Seguridad Garantizada
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  Tus datos e información financiera están seguros con LicitIA
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Cumplimos rigurosamente los estándares de Habeas Data colombianos para que licites con total confianza y tranquilidad.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                {onEnterDashboard && (
                  <button
                    onClick={onEnterDashboard}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <span>Ingresar a la Plataforma</span>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                )}

                {onOpenTerms && (
                  <button
                    onClick={onOpenTerms}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
                  >
                    <span>Ver Términos y Condiciones</span>
                  </button>
                )}

                <button
                  onClick={onBack}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Volver</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">LicitIA</span>
            <span>&copy; {new Date().getFullYear()} EMOTIVA TECH S.A.S. Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer font-bold">
              Ir arriba ↑
            </button>
            {onOpenTerms && (
              <button onClick={onOpenTerms} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer font-bold">
                Términos y Condiciones
              </button>
            )}
            <button onClick={onBack} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer font-bold">
              Volver
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};

// Pequeño helper icono de calendario
function CalendarIcon(props: any) {
  return <Clock {...props} />;
}
