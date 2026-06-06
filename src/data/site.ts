/* =====================================================================
   SolvyX — Single source of truth for ALL landing content.

   HOW TO CUSTOMIZE
   ----------------
   • Text / links / numbers: edit the values below. Nothing else to touch.
   • Images: every image points to a placeholder on picsum.photos so the
     site works out of the box. To use your own art, drop files into
     /public (e.g. /public/work/fintech.jpg) and replace the URL with the
     absolute path "/work/fintech.jpg". The folders public/work and
     public/clients already exist for this.
   • Logo + favicon already live in /public (logo.png, favicon.png).
   ===================================================================== */

export type IconName =
  | 'code'
  | 'mobile'
  | 'web'
  | 'dashboard'
  | 'ai'
  | 'gear'
  | 'arrow'
  | 'check'
  | 'spark'
  | 'plus'
  | 'mail'
  | 'pin'
  | 'phone';

export interface NavLink {
  label: string;
  href: string;
}

export interface Service {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  bullets: string[];
}

export interface WorkItem {
  slug: string;
  title: string;
  category: string;
  blurb: string;
  /** Swap for "/work/your-image.jpg" after placing the file in /public/work */
  image: string;
  tags: string[];
  /** Swap for the real case-study or live-site URL */
  href: string;
  result: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  /** Swap for "/clients/name.jpg" after placing the file in /public/clients */
  avatar: string;
}

export interface Package {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  featured: boolean;
}

export interface Faq {
  q: string;
  a: string;
}

/* --------------------------------------------------------------------- */

export const brand = {
  name: 'SolvyX',
  monogram: 'SX',
  logo: '/logo.png',
  favicon: '/favicon.png',
  tagline: 'We build the software other teams say is impossible.',
  email: 'hola@solvyx.com',
  phone: '+52 55 4148 7720',
  location: 'CDMX · Remote worldwide',
  bookingUrl: 'https://cal.com/solvyx/discovery',
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/solvyx' },
    { label: 'GitHub', href: 'https://github.com/solvyx' },
    { label: 'X', href: 'https://x.com/solvyx' },
    { label: 'Dribbble', href: 'https://dribbble.com/solvyx' },
  ],
};

export const nav: NavLink[] = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Trabajo', href: '#trabajo' },
  { label: 'Proceso', href: '#proceso' },
  { label: 'Planes', href: '#planes' },
  { label: 'Preguntas', href: '#faq' },
];

export const hero = {
  eyebrow: 'Estudio de producto + ingeniería con IA',
  titleLead: 'Convertimos ideas difíciles en',
  titleAccent: 'software que vende',
  titleTail: 'por ti.',
  subtitle:
    'Diseñamos y construimos aplicaciones web, apps móviles, dashboards y automatizaciones con IA — de extremo a extremo. Tú traes el problema; nosotros entregamos el producto en producción.',
  primaryCta: { label: 'Agenda una llamada', href: 'https://cal.com/solvyx/discovery' },
  secondaryCta: { label: 'Ver lo que hacemos', href: '#trabajo' },
  trust: [
    { value: '6 sem.', label: 'al primer release' },
    { value: '47', label: 'productos lanzados' },
    { value: '99.95%', label: 'uptime promedio' },
  ],
};

/* Marquee of "trusted by" names — replace with real client wordmarks or
   logos in /public/clients when available. */
export const clients: string[] = [
  'Verdant Logistics',
  'Lumio Health',
  'Northbeam Capital',
  'Cobalt Retail',
  'Aria Mobility',
  'Ledgerframe',
  'Pulsar Foods',
  'Habitat Studio',
];

/* Order here = display order. The bento tiles as: row1 web + ai (featured),
   row2 the three medium cards, row3 the wide "soporte" card. */
export const services: Service[] = [
  {
    id: 'web',
    icon: 'web',
    title: 'Plataformas y páginas web',
    description:
      'Desde una landing que convierte hasta SaaS multi-tenant. Rápidas, medibles y listas para escalar.',
    bullets: ['Next.js / Astro', 'SEO técnico', 'Pagos e integraciones'],
  },
  {
    id: 'ai',
    icon: 'ai',
    title: 'Automatización con IA',
    description:
      'Agentes, copilotos y flujos que eliminan trabajo repetitivo y responden por ti.',
    bullets: ['Agentes y RAG', 'Integración con tus datos', 'Flujos sin código humano'],
  },
  {
    id: 'mobile',
    icon: 'mobile',
    title: 'Apps móviles',
    description:
      'iOS y Android desde una sola base de código, con la fluidez de una app nativa.',
    bullets: ['React Native / Expo', 'Push y offline', 'Publicación en stores'],
  },
  {
    id: 'software',
    icon: 'code',
    title: 'Software a medida',
    description:
      'Sistemas internos, APIs y backends que aguantan carga real y crecen contigo.',
    bullets: ['Arquitectura escalable', 'APIs y microservicios', 'Cloud + DevOps'],
  },
  {
    id: 'dashboards',
    icon: 'dashboard',
    title: 'Dashboards y analítica',
    description:
      'Paneles que la gente sí usa: datos en vivo, decisiones rápidas, cero ruido.',
    bullets: ['Datos en tiempo real', 'Reportes automáticos', 'Roles y permisos'],
  },
  {
    id: 'care',
    icon: 'gear',
    title: 'Soporte y evolución',
    description:
      'No desaparecemos en el launch. Monitoreo, mejoras y nuevas features cada sprint.',
    bullets: ['Soporte continuo', 'Monitoreo 24/7', 'Roadmap compartido'],
  },
];

export const work: WorkItem[] = [
  {
    slug: 'fintech-ledger',
    title: 'Ledgerframe',
    category: 'Fintech · Web app',
    blurb:
      'Conciliación contable que antes tomaba días, ahora en minutos. Panel en tiempo real para 40+ equipos.',
    image: 'https://picsum.photos/seed/solvyx-ledger/1200/900',
    tags: ['Dashboard', 'Web', 'Automatización'],
    href: 'https://example.com/casos/ledgerframe',
    result: '−71% tiempo de cierre',
  },
  {
    slug: 'health-mobile',
    title: 'Lumio Health',
    category: 'Salud · App móvil',
    blurb:
      'App de seguimiento de pacientes con recordatorios inteligentes y triage asistido por IA.',
    image: 'https://picsum.photos/seed/solvyx-lumio/1200/900',
    tags: ['Móvil', 'IA', 'iOS + Android'],
    href: 'https://example.com/casos/lumio',
    result: '4.8★ en stores',
  },
  {
    slug: 'logistics-ops',
    title: 'Verdant Ops',
    category: 'Logística · Plataforma',
    blurb:
      'Centro de control de flotas con rutas optimizadas por IA y alertas predictivas de mantenimiento.',
    image: 'https://picsum.photos/seed/solvyx-verdant/1200/900',
    tags: ['Software', 'IA', 'Dashboard'],
    href: 'https://example.com/casos/verdant',
    result: '+213% pedidos/día',
  },
  {
    slug: 'retail-commerce',
    title: 'Cobalt Retail',
    category: 'Retail · E-commerce',
    blurb:
      'Tienda headless con recomendador propio y checkout en un paso. Black Friday sin caídas.',
    image: 'https://picsum.photos/seed/solvyx-cobalt/1200/900',
    tags: ['Web', 'Pagos', 'Escala'],
    href: 'https://example.com/casos/cobalt',
    result: '+38% conversión',
  },
];

export const process: ProcessStep[] = [
  {
    step: '01',
    title: 'Descubrimos',
    description:
      'Una sesión para entender el problema real, no solo la feature. Salimos con alcance, riesgos y un plan claro.',
  },
  {
    step: '02',
    title: 'Diseñamos',
    description:
      'Prototipos navegables y arquitectura técnica antes de escribir la primera línea de producción.',
  },
  {
    step: '03',
    title: 'Construimos',
    description:
      'Sprints semanales con demos en vivo. Ves el avance real, no reportes de PowerPoint.',
  },
  {
    step: '04',
    title: 'Lanzamos y evolucionamos',
    description:
      'Deploy, monitoreo y mejoras continuas. El launch es el inicio, no la meta.',
  },
];

export const stats: Stat[] = [
  { value: '8.4×', label: 'ROI promedio reportado por clientes' },
  { value: '6 sem.', label: 'del kickoff al primer producto en vivo' },
  { value: '132', label: 'integraciones y automatizaciones en producción' },
  { value: '0', label: 'proyectos abandonados a mitad de camino' },
];

export const differentiators = [
  {
    icon: 'spark' as IconName,
    title: 'Un equipo, no una agencia',
    description:
      'Hablas con quienes construyen. Sin capas de cuentas ni teléfono descompuesto.',
  },
  {
    icon: 'ai' as IconName,
    title: 'IA donde de verdad suma',
    description:
      'No metemos IA por moda. La usamos cuando elimina trabajo o crea ventaja medible.',
  },
  {
    icon: 'check' as IconName,
    title: 'Código que se mantiene',
    description:
      'Entregamos producto documentado y tuyo. Sin amarres ni cajas negras.',
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      'Llevábamos un año atorados con dos agencias. SolvyX lanzó el MVP en seis semanas y ya estamos facturando con él.',
    name: 'Mariana Vélez',
    role: 'CEO · Northbeam Capital',
    avatar: 'https://picsum.photos/seed/solvyx-mariana/200/200',
  },
  {
    quote:
      'El dashboard que armaron lo abre todo el equipo cada mañana. Eso nunca había pasado con una herramienta interna.',
    name: 'Tomás Rensch',
    role: 'COO · Verdant Logistics',
    avatar: 'https://picsum.photos/seed/solvyx-tomas/200/200',
  },
  {
    quote:
      'La automatización con IA nos quitó 30 horas a la semana de trabajo manual. Se pagó sola en el primer mes.',
    name: 'Priya Naidoo',
    role: 'Head of Ops · Pulsar Foods',
    avatar: 'https://picsum.photos/seed/solvyx-priya/200/200',
  },
];

export const packages: Package[] = [
  {
    name: 'Sprint',
    price: 'desde $4.9k',
    cadence: 'proyecto puntual',
    description: 'Una pieza bien definida: landing, automatización o feature crítica.',
    features: ['Alcance fijo en 2–4 semanas', 'Diseño + desarrollo', 'Deploy incluido'],
    cta: 'Empezar un sprint',
    featured: false,
  },
  {
    name: 'Producto',
    price: 'desde $14k/mes',
    cadence: 'equipo dedicado',
    description: 'Construimos tu producto de cero a producción con un equipo enfocado.',
    features: [
      'Equipo full-stack dedicado',
      'Demos y deploys semanales',
      'Diseño, dev, IA y DevOps',
      'Roadmap compartido',
    ],
    cta: 'Hablemos de tu producto',
    featured: true,
  },
  {
    name: 'Escala',
    price: 'a medida',
    cadence: 'partner continuo',
    description: 'Para empresas que necesitan capacidad de ingeniería seria y constante.',
    features: ['Múltiples squads', 'SLA y soporte 24/7', 'Arquitectura y seguridad'],
    cta: 'Diseñar un plan',
    featured: false,
  },
];

export const faqs: Faq[] = [
  {
    q: '¿Cuánto cuesta un proyecto?',
    a: 'Depende del alcance, pero somos transparentes desde la primera llamada. Un sprint puntual arranca alrededor de $4.9k y un producto completo se cotiza por equipo dedicado. Sin sorpresas a mitad de camino.',
  },
  {
    q: '¿Cuánto tardan en entregar?',
    a: 'La mayoría de clientes ve un primer producto en vivo en 6 semanas. Trabajamos en sprints semanales con demos reales, así que siempre sabes exactamente en qué punto vas.',
  },
  {
    q: 'No tengo specs técnicas, solo una idea. ¿Sirve?',
    a: 'Es nuestro punto de partida favorito. La fase de descubrimiento convierte tu idea en alcance, diseño y plan técnico antes de construir nada.',
  },
  {
    q: '¿El código es mío?',
    a: 'Siempre. Entregamos el repositorio, la documentación y los accesos. Nada de cajas negras ni amarres con licencias propias.',
  },
  {
    q: '¿Dan soporte después del lanzamiento?',
    a: 'Sí. El launch es el inicio. Ofrecemos planes de monitoreo, soporte y evolución continua para que el producto siga mejorando.',
  },
];

export const finalCta = {
  title: 'Tienes una idea. Nosotros la ponemos en producción.',
  subtitle:
    'Agenda 30 minutos. Salimos de la llamada con una ruta clara y un estimado honesto — sin compromiso.',
  primary: { label: 'Agenda tu llamada', href: 'https://cal.com/solvyx/discovery' },
  secondary: { label: 'hola@solvyx.com', href: 'mailto:hola@solvyx.com' },
};

export const footer = {
  blurb:
    'SolvyX es un estudio de producto e ingeniería. Diseñamos, construimos y escalamos software con IA para equipos que van en serio.',
  columns: [
    {
      title: 'Servicios',
      links: [
        { label: 'Páginas y plataformas web', href: '#servicios' },
        { label: 'Apps móviles', href: '#servicios' },
        { label: 'Software a medida', href: '#servicios' },
        { label: 'Dashboards', href: '#servicios' },
        { label: 'Automatización con IA', href: '#servicios' },
      ],
    },
    {
      title: 'Estudio',
      links: [
        { label: 'Trabajo', href: '#trabajo' },
        { label: 'Proceso', href: '#proceso' },
        { label: 'Planes', href: '#planes' },
        { label: 'Preguntas', href: '#faq' },
      ],
    },
  ],
};
