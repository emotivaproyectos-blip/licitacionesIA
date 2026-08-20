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
  Briefcase
} from "lucide-react";

interface TermsPageProps {
  onBack: () => void;
  darkMode?: boolean;
  onToggleTheme?: () => void;
  onEnterDashboard?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onOpenPrivacy?: () => void;
}

interface SectionItem {
  id: string;
  num: number;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export const TermsPage: React.FC<TermsPageProps> = ({
  onBack,
  darkMode = false,
  onToggleTheme,
  onEnterDashboard,
  onOpenAuth,
  onOpenPrivacy
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

  // Definición completa de las 26 secciones legales adaptadas a LicitIA
  const sections: SectionItem[] = useMemo(() => [
    {
      id: "sec-1",
      num: 1,
      title: "Identificación de la Compañía y alcance de los Términos",
      icon: Building2,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Estos Términos y Condiciones de Uso regulan el acceso, navegación, registro, contratación y uso de <strong>LicitIA</strong> (en adelante, la "Plataforma" o los "Servicios"), una solución tecnológica SaaS especializada en inteligencia de contratación pública y privada, de propiedad y operada por <strong>EMOTIVA TECH S.A.S.</strong>, sociedad comercial debidamente constituida bajo las leyes de la República de Colombia, identificada con NIT 901.452.890-1 (en adelante la "Compañía" o "LicitIA").
          </p>
          <p className="leading-relaxed">
            Estos Términos aplican al sitio web principal, aplicaciones web, aplicaciones móviles, integraciones de API, motores de extracción de datos, módulos de análisis con inteligencia artificial, tableros analíticos, reportes de precalificación, alertas licitatorias, documentación y servicios de soporte técnico actuales o futuros.
          </p>
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-sm flex gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong>Uso empresarial y marco legal:</strong> El Cliente declara y acepta que utiliza LicitIA con propósitos empresariales, profesionales o comerciales para la identificación, monitoreo, análisis y gestión de oportunidades de contratación pública (SECOP I, SECOP II y afines) o privada. Cuando el usuario actúe en calidad de consumidor bajo la <strong>Ley 1480 de 2011 (Estatuto del Consumidor)</strong>, se garantizarán sus derechos legales irrenunciables.
            </div>
          </div>
          <p className="leading-relaxed">
            Quien acepte estos Términos en representación de una persona jurídica, consorcio, unión temporal o tercero, declara bajo la gravedad de juramento contar con facultades y autorización legal suficiente para vincular a dicha entidad. Quien carezca de tales facultades deberá abstenerse de registrarse, pagar o utilizar la Plataforma.
          </p>
        </div>
      )
    },
    {
      id: "sec-2",
      num: 2,
      title: "Definiciones",
      icon: FileText,
      content: (
        <div className="space-y-3">
          <p className="leading-relaxed">Para efectos de la interpretación de este contrato, se establecen las siguientes definiciones:</p>
          <ul className="space-y-3 list-none pl-0">
            <li className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 font-bold block mb-1">Administrador de Cuenta:</strong>
              Persona natural designada por el Cliente para contratar, configurar, administrar usuarios autorizados, roles, credenciales, facturación, planes y datos dentro de LicitIA.
            </li>
            <li className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 font-bold block mb-1">Cliente:</strong>
              Persona natural o jurídica que adquiere o utiliza un plan gratuito, prueba piloto, suscripción de pago o servicio con LicitIA.
            </li>
            <li className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 font-bold block mb-1">Usuario Autorizado:</strong>
              Empleado, directivo, contratista, asesor o colaborador a quien el Cliente concede acceso a la Plataforma bajo los límites de su suscripción.
            </li>
            <li className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 font-bold block mb-1">Contenido del Cliente:</strong>
              Datos, balances contables, estados financieros, certificados de Registro Único de Proponentes (RUP), matrices de experiencia, archivos PDF, instrucciones o consultas cargadas o generadas por el Cliente en el sistema.
            </li>
            <li className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 font-bold block mb-1">RUP (Registro Único de Proponentes):</strong>
              Certificado expedido por las Cámaras de Comercio de Colombia que contiene información de capacidad jurídica, experiencia, capacidad financiera, capacidad organizacional y clasificación UNSPSC.
            </li>
            <li className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 font-bold block mb-1">Análisis con Inteligencia Artificial (IA):</strong>
              Algoritmos, modelos de lenguaje (LLMs), visión computacional y motores semánticos empleados por LicitIA para extraer, resumir pliegos, contrastar indicadores financieros y calificar la compatibilidad de procesos de contratación.
            </li>
            <li className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <strong className="text-blue-600 dark:text-blue-400 font-bold block mb-1">Proceso Licitatorio:</strong>
              Licitación pública, selección abreviada, concurso de méritos, mínima cuantía, contratación directa, acuerdo marco u oportunidad publicada en portales estatales (SECOP I, SECOP II) o privados.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "sec-3",
      num: 3,
      title: "Aceptación, contrato electrónico y prueba",
      icon: CheckCircle2,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            El acceso, registro, autenticación, compra de planes, uso de la plataforma o la marcación expresa de la casilla <em>"Acepto los Términos y Condiciones"</em> constituye un contrato electrónico vinculante entre el Cliente y EMOTIVA TECH S.A.S., regido por la <strong>Ley 527 de 1999 sobre Comercio Electrónico y Mensajes de Datos</strong>.
          </p>
          <p className="leading-relaxed">
            Para crear una cuenta en LicitIA es obligatorio aceptar estos Términos y la Política de Privacidad. La Compañía conservará registros técnicos inalterables de la fecha, hora, dirección IP, identificador de dispositivo, correo electrónico y versión de términos aceptada, los cuales tendrán plena validez probatoria conforme a la legislación colombiana.
          </p>
          <p className="leading-relaxed">
            Si el usuario no está de acuerdo con la totalidad de estas condiciones, deberá abstenerse inmediatamente de registrarse, pagar o utilizar los Servicios.
          </p>
        </div>
      )
    },
    {
      id: "sec-4",
      num: 4,
      title: "Descripción general de los Servicios",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            LicitIA es una plataforma integral SaaS de inteligencia y automatización diseñada para optimizar la búsqueda, filtrado, evaluación de requisitos habilitantes y preparación de expedientes de contratación en Colombia.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">✦ Monitoreo Continuo SECOP</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Consumo de datos abiertos oficiales de SECOP I y SECOP II para alertas en tiempo real.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">✦ Matching RUP y UNSPSC</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Cotejo automático de experiencia en SMMLV y clasificaciones de bienes y servicios.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">✦ Preevaluación Financiera con IA</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Cálculo de índice de liquidez, nivel de endeudamiento y cobertura de intereses.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">✦ Expedientes y Radicación</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Generación de checklists, formatos de postulación y empaquetado ZIP organizado.</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Carácter de herramienta de apoyo:</strong> LicitIA no sustituye la consulta obligatoria de las plataformas oficiales (SECOP I, SECOP II, Tienda Virtual del Estado Colombiano) ni reemplaza el criterio legal, contable o técnico de los proponentes. El Cliente siempre debe verificar los pliegos definitivos, adendas y aclaraciones publicadas por la entidad contratante.
            </div>
          </div>
        </div>
      )
    },
    {
      id: "sec-5",
      num: 5,
      title: "Naturaleza de la información pública y ausencia de intermediación",
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            LicitIA recopila, indexa y estructura información proveniente de los datos abiertos del portal oficial de Colombia Compra Eficiente y la plataforma SODA (datos.gov.co). La Compañía no ejerce control sobre la veracidad, oportunidad, exactitud, modificación o eliminación de los datos publicados originalmente por las entidades estatales o territoriales.
          </p>
          <p className="leading-relaxed">
            <strong>Inexistencia de intermediación o representación:</strong> EMOTIVA TECH S.A.S. no es entidad estatal, cámara de comercio, apoderado judicial, estructurador oficial ni intermediario en adjudicaciones. El uso de LicitIA no garantiza la adjudicación de contratos públicos ni asegura que la entidad contratante califique favorablemente una oferta.
          </p>
          <p className="leading-relaxed">
            En caso de cualquier contradicción o discrepancia entre los resultados mostrados por LicitIA y las publicaciones en el expediente oficial de SECOP I o SECOP II, prevalecerá en todo caso la fuente oficial del Estado.
          </p>
        </div>
      )
    },
    {
      id: "sec-6",
      num: 6,
      title: "Funcionalidades de IA, análisis RUP y límites de preevaluación",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            La Plataforma utiliza modelos de inteligencia artificial para lectura de pliegos, extracción de requisitos habilitantes y cálculo comparativo contra la información financiera y de experiencia RUP suministrada por el Cliente.
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li><strong>Revisión crítica obligatoria:</strong> Los resúmenes, matrices de compatibilidad y scores porcentuales generados por IA son aproximaciones analíticas y pueden contener imprecisiones derivadas de la calidad de los documentos escaneados, adendas de última hora o interpretaciones particulares de cada comité evaluador. El Cliente debe efectuar una validación humana previa a cualquier radicación.</li>
            <li><strong>No prestación de asesoría jurídica o revisoría fiscal:</strong> LicitIA no presta servicios de abogacía, auditoría, fe pública ni dictámenes financieros certificados.</li>
            <li><strong>Límites de uso y consumo equitativo:</strong> Los análisis de procesos y consumo de IA están sujetos a las cuotas y políticas de uso razonable del Plan contratado.</li>
          </ul>
        </div>
      )
    },
    {
      id: "sec-7",
      num: 7,
      title: "Registro, cuenta y Usuarios Autorizados",
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Para acceder a las funcionalidades completas, el Cliente debe registrar una cuenta proporcionando información veraz, precisa y actualizada (razón social, NIT, correo corporativo, representante legal y datos de facturación).
          </p>
          <p className="leading-relaxed">
            Las credenciales de acceso son de carácter personal, confidencial e intransferible. Queda prohibida la compartición indebida de credenciales, la reventa no autorizada de accesos o la elusión de los límites de usuarios simultáneos establecidos para cada Plan. El Cliente responderá por todas las actividades efectuadas desde su cuenta.
          </p>
        </div>
      )
    },
    {
      id: "sec-8",
      num: 8,
      title: "Planes, licencias, cuotas de uso y disponibilidad",
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            EMOTIVA TECH S.A.S. otorga al Cliente una licencia de uso limitada, no exclusiva, intransferible, revocable y condicionada al pago oportuno para acceder y utilizar LicitIA conforme al plan contratado (Free / Starter, Licitador Pro, Enterprise Corporativo).
          </p>
          <p className="leading-relaxed">
            Cada plan incluye límites específicos de evaluaciones mensuales de pliegos, almacenamiento de expedientes, alertas y soporte. La Compañía implementa esfuerzos comercialmente razonables para mantener una disponibilidad superior al 99.5%, pero no responde por caídas originadas en la infraestructura de datos de SECOP, proveedores de telecomunicaciones o mantenimientos programados informados previamente.
          </p>
        </div>
      )
    },
    {
      id: "sec-9",
      num: 9,
      title: "Compras web, facturación, renovación y pagos",
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Los precios de los planes se indican en Pesos Colombianos (COP), más los impuestos aplicables conforme a la legislación tributaria nacional. Los pagos se procesan a través de pasarelas de pago certificadas (PSE, tarjetas de crédito, Wompi, Stripe u otros procesadores habilitados).
          </p>
          <p className="leading-relaxed">
            Salvo que se estipule expresamente lo contrario en la orden de compra, las suscripciones recurrentes se renovarán automáticamente por periodos equivalentes (mensuales o anuales), a menos que el Cliente solicite la cancelación antes de la fecha de corte desde su panel de usuario.
          </p>
          <p className="leading-relaxed">
            La Compañía emitirá la factura electrónica correspondiente conforme a las disposiciones de la DIAN y la enviará al correo registrado por el Cliente.
          </p>
        </div>
      )
    },
    {
      id: "sec-10",
      num: 10,
      title: "Compras y suscripciones en plataformas móviles o marketplace",
      icon: Briefcase,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            En caso de contrataciones realizadas a través de tiendas de aplicaciones (Google Play Store, Apple App Store u otros marketplaces), las transacciones, renovaciones y cancelaciones se regirán complementariamente por los términos y condiciones de la tienda respectiva.
          </p>
        </div>
      )
    },
    {
      id: "sec-11",
      num: 11,
      title: "Cancelaciones, derecho de retracto, reversión y devoluciones",
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            El Cliente podrá cancelar la renovación automática de su plan en cualquier momento. La cancelación surtirá efectos al finalizar el ciclo de facturación pagado, sin que procedan reembolsos por periodos ya transcurridos o créditos de IA efectivamente consumidos.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm space-y-2">
            <div className="font-bold text-slate-900 dark:text-white">Derecho de Retracto (Ley 1480 de 2011, Art. 47):</div>
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              En ventas realizadas por comercio electrónico a consumidores, el usuario podrá ejercer el derecho de retracto dentro de los cinco (5) días hábiles siguientes a la contratación, siempre y cuando no se haya iniciado la prestación efectiva del servicio mediante el consumo de evaluaciones, generación de expedientes o análisis RUP con IA acordados.
            </p>
            <div className="font-bold text-slate-900 dark:text-white pt-2">Reversión de pagos:</div>
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              Procede conforme al Decreto 587 de 2016 en casos de fraude, operaciones no solicitadas o fallas técnicas imputables comprobadas.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "sec-12",
      num: 12,
      title: "Uso aceptable y conductas prohibidas",
      icon: Ban,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">El Cliente y sus Usuarios Autorizados se comprometen a utilizar la Plataforma estrictamente para fines lícitos y bajo el principio de buena fe. Queda estrictamente prohibido:</p>
          <ul className="space-y-2 list-disc pl-5 text-sm">
            <li>Efectuar ingeniería inversa, descompilación, scraping masivo malicioso o extracción no autorizada de la base de datos de LicitIA.</li>
            <li>Cargar documentos falsos, alterados, apócrifos o que violen derechos de autor o secreto empresarial de terceros.</li>
            <li>Utilizar los servicios de LicitIA para actividades de colusión, prácticas restrictivas de la competencia, acuerdos anticompetitivos o infracciones al Estatuto Anticorrupción (Ley 1474 de 2011).</li>
            <li>Introducir virus, malware, scripts automatizados no autorizados o intentar vulnerar las medidas de seguridad de la infraestructura en la nube.</li>
            <li>Revender, alquilar o sublicenciar los informes o accesos sin autorización previa y escrita de la Compañía.</li>
          </ul>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
            El incumplimiento de estas obligaciones facultará a la Compañía para suspender o cancelar la cuenta de inmediato sin derecho a reembolso y adelantar las acciones legales correspondientes.
          </p>
        </div>
      )
    },
    {
      id: "sec-13",
      num: 13,
      title: "Contenido del Cliente, confidencialidad y autorizaciones",
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            <strong>Titularidad y reserva:</strong> El Cliente conserva en todo momento la propiedad exclusiva sobre sus estados financieros, certificados RUP, balances, documentos corporativos y expedientes cargados a la plataforma.
          </p>
          <p className="leading-relaxed">
            LicitIA recibe únicamente una licencia técnica de uso limitada para procesar, estructurar, comparar y calcular los requisitos habilitantes necesarios para la prestación del servicio. EMOTIVA TECH S.A.S. tratará dicha información bajo el más riguroso deber de <strong>estricta confidencialidad</strong> y no comercializará ni transferirá datos financieros privados a terceros no autorizados.
          </p>
        </div>
      )
    },
    {
      id: "sec-14",
      num: 14,
      title: "Tratamiento de datos personales y Habeas Data",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            El tratamiento de datos personales realizado por la Compañía se rige rigurosamente por la <strong>Ley Estatutaria 1581 de 2012</strong>, el <strong>Decreto 1377 de 2013</strong> y la Política de Tratamiento de Datos Personales de LicitIA.
          </p>
          <p className="leading-relaxed">
            La información recolectada se utilizará para la creación de cuentas, validación de identidad, prestación del servicio, emisión de facturación, soporte técnico y envío de notificaciones de procesos licitatorios de interés. Los titulares de datos pueden ejercer en cualquier momento sus derechos de consulta, rectificación, supresión y revocatoria mediante el canal oficial de PQRS.
          </p>
          {onOpenPrivacy && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Consultar Política de Privacidad Completa (Ley 1581 de 2012) &rarr;</span>
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      id: "sec-15",
      num: 15,
      title: "Notificaciones, alertas y canales de comunicación",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            El Cliente autoriza a LicitIA para enviarle alertas operativas sobre licitaciones coincidentes con su perfil RUP, cambios de estado en SECOP, vencimientos de plazos de observación, actualizaciones del sistema y comunicaciones transaccionales a través de correo electrónico, notificaciones push, WhatsApp corporativo y mensajería en la plataforma.
          </p>
          <p className="leading-relaxed">
            El usuario podrá configurar en cualquier momento sus preferencias de notificación o darse de baja de comunicaciones comerciales mediante el enlace provisto al pie de cada mensaje.
          </p>
        </div>
      )
    },
    {
      id: "sec-16",
      num: 16,
      title: "Soporte técnico, niveles de servicio y consultoría",
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            La Compañía brindará soporte técnico a través de correo electrónico y canales digitales dentro de los horarios hábiles colombianos (lunes a viernes de 8:00 a.m. a 6:00 p.m.).
          </p>
          <p className="leading-relaxed">
            El soporte estándar cubre incidentes técnicos de la plataforma, dudas sobre el funcionamiento de las herramientas y orientación operativa. No incluye estructuración personalizada de ofertas licitatorias, redacción de observaciones jurídicas a pliegos ni asistencia presencial, salvo que se contrate un plan Enterprise o paquete de servicios profesionales independiente.
          </p>
        </div>
      )
    },
    {
      id: "sec-17",
      num: 17,
      title: "Propiedad intelectual y derechos de autor",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Todos los derechos de propiedad intelectual, marcas, nombres comerciales, logotipos, código fuente, algoritmos, prompts de inteligencia artificial, arquitecturas de base de datos, diseños gráficos, flujos UX/UI y documentación técnica de <strong>LicitIA</strong> son de propiedad exclusiva de <strong>EMOTIVA TECH S.A.S.</strong>, protegidos por la Decisión Andina 486, la Decisión 351 y las leyes nacionales e internacionales de propiedad industrial y derechos de autor.
          </p>
          <p className="leading-relaxed">
            Ninguna cláusula de estos Términos transfiere al Cliente la titularidad o derechos de propiedad sobre la tecnología de LicitIA.
          </p>
        </div>
      )
    },
    {
      id: "sec-18",
      num: 18,
      title: "Proveedores terceros, integraciones y fuentes externas",
      icon: ExternalLink,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            LicitIA interactúa con proveedores de infraestructura en la nube (PostgreSQL, Supabase, servidores Cloudflare / Vercel), modelos de inteligencia artificial y APIs públicas gubernamentales de Colombia Compra Eficiente.
          </p>
          <p className="leading-relaxed">
            La Compañía no se hace responsable por interrupciones extraordinarias derivadas de caídas globales en los centros de datos de dichos proveedores terceros o modificaciones intempestivas en las APIs estatales, aunque implementará medidas de contingencia y respaldos para mitigar cualquier afectación.
          </p>
        </div>
      )
    },
    {
      id: "sec-19",
      num: 19,
      title: "Seguridad de la información y medidas técnicas",
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            LicitIA implementa rigurosas salvaguardas tecnológicas y administrativas, tales como:
          </p>
          <ul className="space-y-2 list-disc pl-5 text-sm">
            <li>Políticas estrictas de <strong>Row-Level Security (RLS)</strong> en base de datos PostgreSQL, garantizando aislamiento total entre empresas (multitenancy hermético).</li>
            <li>Cifrado de datos en tránsito (TLS 1.3 / HTTPS) y en reposo (AES-256).</li>
            <li>Políticas de contraseñas seguras y opciones de autenticación con enlaces mágicos o proveedores OAuth verificados.</li>
            <li>Respaldos automáticos periódicos y monitoreo continuo contra accesos no autorizados.</li>
          </ul>
        </div>
      )
    },
    {
      id: "sec-20",
      num: 20,
      title: "Suspensión, bloqueo preventivo y terminación",
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            LicitIA podrá suspender preventivamente o terminar el acceso a la cuenta cuando: (i) exista mora en el pago de la suscripción; (ii) se detecten indicios fundados de fraude, suplantación o violación de medidas de seguridad; (iii) se compruebe uso indebido o abuso de las cuotas de IA; o (iv) sea requerido por orden judicial o autoridad administrativa competente.
          </p>
        </div>
      )
    },
    {
      id: "sec-21",
      num: 21,
      title: "Garantías, exclusiones y límite de responsabilidad",
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            La Plataforma se suministra <em>"tal como está"</em> y <em>"según disponibilidad"</em>, contrayendo obligaciones de medio consistentes en el procesamiento diligente y estructurado de la información pública de contratación.
          </p>
          <p className="leading-relaxed">
            EMOTIVA TECH S.A.S. no responderá por: (i) decisiones comerciales, técnicas o financieras adoptadas por el Cliente con base en los análisis generados; (ii) no adjudicación, descalificación o rechazo de ofertas en procesos licitatorios; (iii) errores u omisiones en pliegos y adendas originados por las entidades públicas; o (iv) pérdidas de oportunidad, lucro cesante o daños indirectos.
          </p>
          <p className="leading-relaxed text-sm bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
            En cualquier circunstancia y en el grado máximo permitido por la ley colombiana, la responsabilidad total agregada de la Compañía frente a reclamaciones contractuales directas estará limitada al monto efectivamente pagado por el Cliente durante los tres (3) meses inmediatamente anteriores al hecho generador.
          </p>
        </div>
      )
    },
    {
      id: "sec-22",
      num: 22,
      title: "Indemnidad",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            El Cliente se obliga a mantener indemne a EMOTIVA TECH S.A.S., sus accionistas, administradores, empleados y aliados frente a cualquier reclamación, demanda, sanción administrativa o gasto legal originado en: (i) el uso indebido de la Plataforma por parte del Cliente o sus usuarios; (ii) la carga de información falsa o no autorizada; o (iii) el incumplimiento de la normatividad de contratación pública o protección de datos por parte del proponente.
          </p>
        </div>
      )
    },
    {
      id: "sec-23",
      num: 23,
      title: "Modificación de los Términos y del Servicio",
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            La Compañía se reserva la facultad de actualizar estos Términos para reflejar cambios normativos, mejoras tecnológicas, nuevas funcionalidades o ajustes comerciales. La versión vigente estará permanentemente publicada en la Plataforma con la indicación de la fecha de última actualización.
          </p>
          <p className="leading-relaxed">
            En caso de modificaciones sustanciales que alteren materialmente derechos u obligaciones, se notificará a los usuarios mediante aviso en la plataforma o correo electrónico registrado con antelación a su entrada en vigencia. El uso continuado de los Servicios tras dicha fecha constituirá aceptación expresa de las modificaciones.
          </p>
        </div>
      )
    },
    {
      id: "sec-24",
      num: 24,
      title: "Peticiones, quejas, reclamos (PQRS) y canales de contacto",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">Para la atención de consultas, solicitudes de soporte, ejercicio de derechos de Habeas Data o radicación de PQRS, se disponen los siguientes canales oficiales:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                <Mail className="w-4 h-4" /> Correo Electrónico
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">contacto@emotivatech.co / soporte@licitia.co</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                <MapPin className="w-4 h-4" /> Sede Principal
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Bogotá D.C. / Bucaramanga, Colombia</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Las peticiones y reclamos serán tramitados dentro de los términos legales establecidos en la Ley 1755 de 2015 y el Estatuto del Consumidor.
          </p>
        </div>
      )
    },
    {
      id: "sec-25",
      num: 25,
      title: "Ley aplicable y solución de controversias",
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Estos Términos y Condiciones se rigen e interpretan conforme a las <strong>leyes de la República de Colombia</strong>.
          </p>
          <p className="leading-relaxed">
            Cualquier discrepancia o controversia derivada de este contrato se procurará resolver de forma amigable mediante arreglo directo entre las partes dentro de un término no superior a treinta (30) días calendario.
          </p>
          <p className="leading-relaxed">
            En caso de no llegar a acuerdo, para clientes en el ámbito mercantil o corporativo, la controversia podrá someterse a conciliación o al Centro de Arbitraje y Conciliación de la Cámara de Comercio correspondiente. Tratándose de usuarios en calidad de consumidores, se respetará el acceso a la jurisdicción ordinaria o a las acciones ante la Superintendencia de Industria y Comercio (SIC).
          </p>
        </div>
      )
    },
    {
      id: "sec-26",
      num: 26,
      title: "Disposiciones finales e integridad del acuerdo",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            <strong>Independencia de cláusulas:</strong> Si cualquier disposición de estos Términos fuere declarada nula o ineficaz por autoridad judicial competente, las restantes cláusulas conservarán plena validez y vigencia.
          </p>
          <p className="leading-relaxed">
            <strong>Integridad:</strong> Estos Términos y Condiciones, junto con la Política de Privacidad y las condiciones específicas del Plan contratado, constituyen el acuerdo total y definitivo entre las partes respecto del uso de LicitIA, sustituyendo cualquier comunicación previa verbal o escrita.
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
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">LicitIA</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block -mt-0.5">Legal & Términos</span>
              </div>
            </div>
          </div>

          {/* Buscador en vivo de cláusulas */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en los términos (ej: IA, RUP, Retracto, Pagos)..."
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

            {onOpenPrivacy && (
              <button
                onClick={onOpenPrivacy}
                className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs hidden md:flex items-center gap-1.5"
                title="Ver Política de Privacidad"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Privacidad</span>
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

      {/* CUERPO PRINCIPAL CON HERO Y DOS COLUMNAS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* HERO BANNER LEGAL */}
        <div className="mb-10 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide uppercase shadow-xs">
            <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Marco Legal de Contratación SaaS en Colombia
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Términos y Condiciones de Uso
          </h1>
          
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Reglas de acceso, navegación, planes, modelos de IA, análisis RUP, facturación y licenciamiento de la plataforma <strong>LicitIA</strong> operada por <strong>EMOTIVA TECH S.A.S.</strong>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              Versión 1.0 &mdash; Actualizado Mayo de 2026
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              Jurisdicción: República de Colombia
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              26 Secciones
            </span>
          </div>
        </div>

        {/* TARJETAS DE RESUMEN EJECUTIVO ("CLAVES EN 60 SEGUNDOS") */}
        <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Herramienta de Apoyo</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Los análisis con IA de pliegos y balances son preevaluaciones. Siempre prevalece la fuente oficial de SECOP I o II.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Confidencialidad RUP</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tus balances y documentos son de tu exclusiva propiedad con protección estricta RLS en PostgreSQL.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Planes Claros & PSE</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Facturación en Pesos Colombianos (COP) vía pasarelas oficiales, facturación electrónica DIAN y cancelación sin ataduras.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Normativa Colombiana</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Alineado a las leyes 1480 de 2011 (Consumidor), 1581 de 2012 (Habeas Data) y 527 de 1999 (Comercio Electrónico).
            </p>
          </div>
        </div>

        {/* GRID DE DOS COLUMNAS: SIDEBAR ÍNDICE + CONTENIDO LEGAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: ÍNDICE NAVEGABLE STICKY (4 Cols) */}
          <aside className="lg:col-span-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 custom-scrollbar hidden lg:block">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Tabla de Contenido
                </span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                  {filteredSections.length} cláusulas
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

              {/* Botón de ayuda rápida PQRS */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs space-y-1.5">
                  <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    ¿Dudas legales o comerciales?
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Escríbenos a <span className="font-bold text-blue-600 dark:text-blue-400">contacto@emotivatech.co</span> para aclaraciones sobre planes o contratos.
                  </p>
                </div>
              </div>

            </div>
          </aside>

          {/* COLUMNA DERECHA: SECCIONES COMPLETAS (8 Cols) */}
          <div ref={contentRef} className="lg:col-span-8 space-y-8">
            
            {filteredSections.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <Search className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No se encontraron cláusulas coincidentes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Intenta buscar con otros términos como "IA", "RUP", "Retracto", "SECOP" o "Responsabilidad".
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Ver todas las cláusulas
                </button>
              </div>
            ) : (
              filteredSections.map((sec) => {
                return (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-300 dark:hover:border-blue-800/80 transition-all scroll-mt-28"
                  >
                    <div className="flex items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-mono font-bold text-sm shadow-xs">
                        {sec.num}
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                          Cláusula {sec.num}
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

            {/* CAJA DE FINALIZACIÓN Y ACEPTACIÓN */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/50 shadow-2xl space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Transparencia & Cumplimiento Legal
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  ¿Listo para evaluar y ganar licitaciones con LicitIA?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Al crear tu cuenta o acceder a la plataforma, comienzas a disfrutar del poder de la inteligencia artificial sobre el SECOP colombiano con total respaldo de seguridad.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                {onEnterDashboard && (
                  <button
                    onClick={onEnterDashboard}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    <span>Ingresar a la Plataforma</span>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                )}

                {onOpenAuth && (
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
                  >
                    <span>Crear Cuenta Nueva</span>
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

      {/* FOOTER SIMPLE DEL DOCUMENTO */}
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
            {onOpenPrivacy && (
              <button onClick={onOpenPrivacy} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer font-bold">
                Privacidad
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
