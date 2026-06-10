/* =====================================================================
   SolvyX — Single source of truth for ALL landing content.

   HOW TO CUSTOMIZE
   ----------------
   • Text / links / numbers: edit the values below. Nothing else to touch.
   • Images: every image points to a placeholder on picsum.photos so the
     site works out of the box. To use your own art, drop files into
     /public (e.g. /public/work/wallet.jpg) and replace the URL with the
     absolute path "/work/wallet.jpg". The folders public/work and
     public/clients already exist for this.
   • Booking: `brand.bookingUrl` should be your REAL scheduler link
     (Cal.com / Calendly / Google Appointments). The CTAs open it in a new
     tab — that is the "real calendar", no custom UI to maintain.
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
  | 'phone'
  | 'megaphone'
  | 'video'
  | 'wallet'
  | 'blocks'
  | 'chart';

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
  logo3d: '/logo-3d.png',
  favicon: '/favicon.png',
  tagline:
    'Especialistas en automatización con IA y desarrollo de software a medida. Más leads, menos trabajo manual y lanzamientos en días, no en meses. Adelántate a tu competencia.',
  domain: 'solvyxdigital.com',
  email: 'contact@solvyxdigital.com',
  phone: '+34 645 42 55 82',
  location: 'Barcelona, España · Remote worldwide',
  // Link público de Cal.com (página de reserva). Cámbialo si renombras el usuario.
  bookingUrl: 'https://cal.com/solvyxdigital/30min',
  // Solo el "handle/evento" de Cal.com (lo que va después de cal.com/).
  // Abre el modal de reserva desde los botones CTA.
  calLink: 'solvyxdigital/30min',
  // Namespace del embed Cal (una sola instancia precargada, sin fugas).
  calNamespace: 'solvyx',
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/solvyx-digital/' },
  ],
};

/* Founder — real person behind SolvyX (E-E-A-T: experience + authority). */
export const founder = {
  name: 'Erick Jiménez Cruz',
  role: 'Fundador & Ingeniero principal',
  bio: 'Ingeniero full-stack senior con más de 5 años construyendo plataformas fintech y sistemas de alto rendimiento. Creó Eranpay —una wallet fintech con core bancario, KYC y servicios en tiempo real— y lideró apps premiadas (1.er lugar y $50K en una ronda de inversores en Madrid). En SolvyX une ese rigor de ingeniería con IA de punta para entregar automatización y software a medida que mueve la aguja de verdad.',
  highlights: [
    '+5 años de ingeniería',
    'Fintech, IA y blockchain',
    'Creador de Eranpay',
    'App premiada · $50K en Madrid',
  ],
  linkedin: 'https://www.linkedin.com/in/erickjimenezcruz/',
  github: 'https://github.com/erfajc97',
  // Foto del fundador (reemplázala cuando quieras en /public).
  avatar: '/avatar-solvyx-ej.png',
};

export const nav: NavLink[] = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Trabajo', href: '#trabajo' },
  { label: 'Proceso', href: '#proceso' },
  { label: 'Planes', href: '#planes' },
  { label: 'Preguntas', href: '#faq' },
];

/* Hero background video (optional). Leave `video` empty to keep the animated
   CSS console mock. When you have a clip, drop it in /public/hero/ and set:
     video: '/hero/loop.mp4', videoWebm: '/hero/loop.webm', poster: '/hero/poster.jpg'
   It autoplays muted/looped only on desktop with motion allowed (poster is the
   fallback on mobile, reduced-motion, and data-saver). */
export const heroMedia = {
  // Desktop / web (16:9)
  video: '/hero/loop.mp4',
  videoWebm: '/hero/loop.webm',
  poster: '/hero/poster.jpg',
  // Mobile (9:16). Deja vacío para reusar el de desktop en mobile.
  videoMobile: '/hero/loop-mobile.mp4',
  videoMobileWebm: '',
  posterMobile: '/hero/poster-mobile.jpg',
};

export const hero = {
  eyebrow: 'Estudio de IA · Automatización · Software · Fintech',
  // Titular: las palabras se animan con el efecto de partículas (ciclan).
  // Cortas y en MAYÚSCULA para que se lean bien formadas por partículas.
  particleWords: [
    'AUTOMATIZACIÓN',
    'MARKETING IA',
    'CONTENIDO IA',
    'DESARROLLO WEB',
    'APPS MÓVILES',
    'FINTECH',
  ],
  // Titular estático (SEO + fallback sin JS / reduced-motion).
  fallbackHeadline: 'Automatización con IA y software a medida que hacen crecer tu negocio.',
  lead: 'Automatizamos tu negocio con IA y construimos el software a medida que te pone por delante de tu competencia — entregado en días, no en meses.',
  secondaryCta: { label: 'Ver lo que hacemos', href: '#trabajo' },
  // Selector interactivo de servicios (pills multi-select).
  servicePrompt: {
    title: '¿Qué necesitas?',
    subtitle: 'Selecciona todo lo que aplique',
    options: ['Automatización IA', 'Marketing & Ads', 'Web / App', 'Fintech', 'Otro'],
    placeholder: 'Toca para elegir uno o más servicios.',
    bannerLead: 'Listo para hablar de:',
    cta: 'Vamos',
    ctaHref: '#agenda',
  },
};

/* Contact: the Agenda section copy + the modal form opened by every CTA.
   formEndpoint: deja vacío para usar mailto (abre el correo). Para capturar
   leads de verdad, pon aquí un endpoint de Formspree (https://formspree.io)
   o tu propia API y el formulario hará POST ahí. */
export const contact = {
  formEndpoint: '/.netlify/functions/contact',
  projectTypes: ['Automatización con IA', 'Marketing & Ads', 'Web / App', 'Fintech / Blockchain', 'Multimedia con IA', 'Otro'],
  modal: {
    title: 'Hablemos de tu proyecto',
    subtitle: 'Cuéntanos qué necesitas y te respondemos el mismo día.',
    cta: 'Enviar',
    success: '¡Gracias! Recibimos tu mensaje y te contactamos hoy mismo.',
  },
  agenda: {
    eyebrow: 'Agenda',
    title: 'Reserva una llamada de 30 minutos',
    text: 'Sin formularios eternos ni compromisos. Cuéntanos tu idea y salimos de la llamada con una ruta clara y un estimado honesto.',
    bullets: ['Respuesta el mismo día', 'Ruta y estimado claros', 'Sin compromiso'],
    cta: 'Agendar llamada',
  },
};

/* Marquee of "trusted by" names — replace with real client wordmarks or
   logos in /public/clients when available. */
export const clients: string[] = [
  'Verdant Growth',
  'NovaPay',
  'Lumio Health',
  'Northbeam Capital',
  'Cobalt Chain',
  'Pulsar Studio',
  'Aria Mobility',
  'Habitat Labs',
];

/* Order here = display order. The bento tiles as: row1 IA + marketing
   (featured), row2 the three medium cards, row3 the wide software card. */
export const services: Service[] = [
  {
    id: 'ai-automation',
    icon: 'ai',
    title: 'Automatización de negocio con IA',
    description:
      'Agentes y flujos que responden, venden y operan por ti. Conectamos tus herramientas y eliminamos el trabajo manual repetitivo.',
    bullets: ['Agentes y copilotos', 'Flujos 24/7', 'Integración con tus apps'],
  },
  {
    id: 'growth',
    icon: 'megaphone',
    title: 'Marketing y ads con IA',
    description:
      'Conectamos Meta y Google Ads, generamos leads y los convertimos en clientes con campañas optimizadas por IA.',
    bullets: ['Conexión de ads', 'Generación de leads', 'Nurturing automático'],
  },
  {
    id: 'media',
    icon: 'video',
    title: 'Multimedia con IA',
    description:
      'Videos e imágenes para redes con calidad profesional y en tiempo récord. Tu marca produciendo sin parar.',
    bullets: ['Video con IA', 'Imágenes para redes', 'Listo en días'],
  },
  {
    id: 'fintech',
    icon: 'wallet',
    title: 'Fintech & Blockchain',
    description:
      'Wallets tipo fintech, pagos y productos web3. Seguros, escalables y listos para producción.',
    bullets: ['Wallets fintech', 'Web3 / smart contracts', 'Pagos e integraciones'],
  },
  {
    id: 'mobile',
    icon: 'mobile',
    title: 'Apps móviles a medida',
    description:
      'iOS y Android desde una sola base de código, con la fluidez de una app nativa.',
    bullets: ['React Native / Expo', 'Push y offline', 'Publicación en stores'],
  },
  {
    id: 'software',
    icon: 'code',
    title: 'Software y plataformas web',
    description:
      'Webs que convierten, SaaS, dashboards y backends a medida que aguantan carga real y crecen contigo.',
    bullets: ['Next.js / Astro', 'APIs escalables', 'Cloud + DevOps'],
  },
];

export const work: WorkItem[] = [
  {
    slug: 'novapay-wallet',
    title: 'NovaPay Wallet',
    category: 'Fintech · App móvil',
    blurb:
      'Wallet tipo fintech con envíos instantáneos, KYC y on/off-ramp cripto. De cero a stores en semanas.',
    image: '/work/novapay.jpg',
    tags: ['Fintech', 'Wallet', 'iOS + Android'],
    href: 'https://example.com/casos/novapay',
    result: '120k usuarios',
  },
  {
    slug: 'verdant-growth',
    title: 'Verdant Growth',
    category: 'Marketing IA · Automatización',
    blurb:
      'Conectamos Meta y Google Ads a un motor de IA que califica y nutre leads solo. Más ventas, menos gasto.',
    image: '/work/verdant.jpg',
    tags: ['Ads', 'IA', 'Leads'],
    href: 'https://example.com/casos/verdant-growth',
    result: '+213% leads',
  },
  {
    slug: 'pulsar-studio',
    title: 'Pulsar Studio',
    category: 'Multimedia IA · Redes',
    blurb:
      'Producción de videos e imágenes para redes con IA: 300+ piezas al mes con el mismo branding.',
    image: '/work/pulsar.jpg',
    tags: ['Video IA', 'Contenido', 'Redes'],
    href: 'https://example.com/casos/pulsar',
    result: '318 piezas/mes',
  },
  {
    slug: 'cobalt-chain',
    title: 'Cobalt Chain',
    category: 'Blockchain · Web3',
    blurb:
      'Plataforma de pagos web3 con smart contracts auditados y un panel de control en tiempo real.',
    image: '/work/cobalt.jpg',
    tags: ['Web3', 'Smart contracts', 'Dashboard'],
    href: 'https://example.com/casos/cobalt',
    result: '−71% costos',
  },
];

export const process: ProcessStep[] = [
  {
    step: '01',
    title: 'Descubrimos',
    description:
      'Una llamada para entender tu negocio y dónde la IA mueve la aguja. Salimos con un plan claro y un estimado honesto.',
  },
  {
    step: '02',
    title: 'Diseñamos',
    description:
      'Definimos el flujo, el diseño y la arquitectura antes de construir. Tú apruebas la dirección.',
  },
  {
    step: '03',
    title: 'Construimos rápido',
    description:
      'Automatizaciones y contenido en días; producto en un par de semanas. Con avances que ves en vivo.',
  },
  {
    step: '04',
    title: 'Lanzamos y escalamos',
    description:
      'Deploy, medición y mejora continua. El launch es el inicio: seguimos optimizando resultados.',
  },
];

export const stats: Stat[] = [
  { value: 'En días', label: 'lanzamos automatizaciones e IA' },
  { value: '2 sem.', label: 'al primer producto en vivo' },
  { value: '+213%', label: 'más leads para nuestros clientes' },
  { value: '8.4×', label: 'ROI promedio reportado' },
];

export const differentiators = [
  {
    icon: 'ai' as IconName,
    title: 'IA de punta a punta',
    description:
      'Automatización, marketing, contenido y producto — todo potenciado con IA, no como adorno.',
  },
  {
    icon: 'spark' as IconName,
    title: 'Rápido de verdad',
    description:
      'Automatizaciones en días y producto en un par de semanas. Sin meses de espera ni excusas.',
  },
  {
    icon: 'check' as IconName,
    title: 'Código y datos tuyos',
    description:
      'Entregamos todo documentado y a tu nombre. Sin amarres ni cajas negras.',
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      'Sus automatizaciones de marketing nos triplicaron los leads en dos meses. Y el contenido con IA salió mejor que con nuestra agencia anterior.',
    name: 'Mariana Vélez',
    role: 'CEO · Northbeam Capital',
    avatar: 'https://picsum.photos/seed/solvyx-mariana/200/200',
  },
  {
    quote:
      'Conectaron nuestros ads con un motor de IA que califica leads solo. Cerramos más vendiendo menos.',
    name: 'Tomás Rensch',
    role: 'COO · Verdant Growth',
    avatar: 'https://picsum.photos/seed/solvyx-tomas/200/200',
  },
  {
    quote:
      'Lanzaron nuestra wallet fintech en dos semanas. Rápido, seguro y sin dramas. Justo lo que necesitábamos.',
    name: 'Priya Naidoo',
    role: 'Head of Product · NovaPay',
    avatar: 'https://picsum.photos/seed/solvyx-priya/200/200',
  },
];

export const packages: Package[] = [
  {
    name: 'Express IA',
    price: 'desde $1,200 USD',
    cadence: 'en días',
    description: 'Una automatización, agente o pieza de contenido con IA, lista en días.',
    features: ['Entrega en días', 'Automatización o contenido con IA', 'Conexión con tus herramientas'],
    cta: 'Empezar ya',
    featured: false,
  },
  {
    name: 'Crecimiento',
    price: 'a medida',
    cadence: 'el más elegido',
    description: 'Marketing con IA + automatización + producto. Tu motor de crecimiento completo.',
    features: [
      'Marketing y ads con IA',
      'Automatizaciones de negocio',
      'Contenido para redes con IA',
      'Web o app a medida',
    ],
    cta: 'Diseñar mi plan',
    featured: true,
  },
  {
    name: 'Escala',
    price: 'a medida',
    cadence: 'partner continuo',
    description: 'Equipo dedicado para empresas que necesitan ingeniería e IA constante.',
    features: ['Equipo dedicado', 'Fintech / blockchain', 'SLA y soporte 24/7'],
    cta: 'Hablemos',
    featured: false,
  },
];

export const faqs: Faq[] = [
  {
    q: '¿Cuánto cuesta?',
    a: 'Los proyectos arrancan desde $1,200 USD. Las automatizaciones y piezas con IA salen en días; un producto a medida (web, app o wallet) suele tomar ~2 semanas. De ahí escalamos a medida según el alcance, siempre con un estimado claro desde la primera llamada.',
  },
  {
    q: '¿Qué tan rápido entregan?',
    a: 'Automatizaciones, campañas y contenido con IA en días. Un producto en alrededor de 2 semanas. Trabajamos con entregas continuas para que veas avance real, no meses de silencio.',
  },
  {
    q: '¿Cómo me consiguen más clientes con IA?',
    a: 'Conectamos tus anuncios de Meta y Google a flujos con IA que capturan, califican y nutren leads automáticamente, y generamos contenido para redes que alimenta esas campañas. Menos trabajo manual, más conversiones.',
  },
  {
    q: '¿Hacen fintech y blockchain?',
    a: 'Sí, es una de nuestras especialidades. Creamos wallets tipo fintech, integraciones de pago y productos web3 con smart contracts auditados.',
  },
  {
    q: '¿El contenido con IA se ve profesional?',
    a: 'Sí. Producimos videos e imágenes para redes con calidad de marca, consistentes y en tiempo récord — no plantillas genéricas.',
  },
  {
    q: '¿El código y las cuentas son míos?',
    a: 'Siempre. Entregamos el repositorio, la documentación y los accesos a tu nombre. Sin cajas negras ni amarres.',
  },
];

export const finalCta = {
  title: 'Menos trabajo manual. Más clientes. Empecemos.',
  subtitle:
    'Agenda 30 minutos. Salimos de la llamada con una ruta clara y un estimado honesto — sin compromiso.',
  primary: { label: 'Agenda tu llamada', href: '#agenda' },
  secondary: { label: 'contact@solvyxdigital.com', href: 'mailto:contact@solvyxdigital.com' },
};

export const footer = {
  blurb:
    'SolvyX es un estudio de IA, automatización e ingeniería. Hacemos crecer negocios con marketing y automatización con IA, y construimos software, apps móviles y fintech.',
  columns: [
    {
      title: 'Servicios',
      links: [
        { label: 'Automatización con IA', href: '#servicios' },
        { label: 'Marketing y ads con IA', href: '#servicios' },
        { label: 'Multimedia con IA', href: '#servicios' },
        { label: 'Fintech & Blockchain', href: '#servicios' },
        { label: 'Software y apps', href: '#servicios' },
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
