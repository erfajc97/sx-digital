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
  /** Live site or case study. Omit for concepts (no link is shown). */
  href?: string;
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
  phone: '+34 610 70 27 98',
  // Opcional: número distinto para el botón de WhatsApp (si falta, usa `phone`).
  whatsapp: undefined as string | undefined,
  // Oficinas (una línea cada una en el pie). La primera es la sede legal.
  locations: ['Madrid, España', 'Guayaquil, Ecuador'],
  // Link público de Cal.com (página de reserva). Cámbialo si renombras el usuario.
  bookingUrl: 'https://cal.com/solvyxdigital/30min',
  // Solo el "handle/evento" de Cal.com (lo que va después de cal.com/).
  // Abre el modal de reserva desde los botones CTA.
  calLink: 'solvyxdigital/30min',
  // Namespace del embed Cal (una sola instancia precargada, sin fugas).
  calNamespace: 'solvyx',
  // Google Search Console → "Etiqueta HTML": pega solo el valor de content="…".
  // Es público (va en el HTML de todas las páginas). Vacío = no se añade.
  googleSiteVerification: 'xzoqRblyzWvNmE_E7VQYGSdYFvWLNDL3avcRwKno2Ds',
  // Redes sociales: botones redondos del pie + `sameAs` para Google.
  // Las que tengan `href` vacío no se muestran. Orden = orden en el pie.
  social: [
    { network: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/solvyx.digital/' },
    { network: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/p/SolvyX-Digital-61596073448848/' },
    { network: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@solvyxdigital' },
    { network: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/solvyx-digital/' },
  ] as { network: 'instagram' | 'facebook' | 'tiktok' | 'linkedin'; label: string; href: string }[],
};

/* Team — real people behind SolvyX (E-E-A-T: experience + authority).
   Order = order on /nosotros. `founder: true` marks them as founder in the
   structured data. Links are optional (a button renders only when set). */
export interface TeamMember {
  /** Stable id for structured data (#person-<id>). */
  id: string;
  name: string;
  role: string;
  bio: string;
  highlights: string[];
  avatar: string;
  founder?: boolean;
  linkedin?: string;
  github?: string;
  knowsAbout?: string[];
}

export const team: TeamMember[] = [
  {
    id: 'miguel-angel-brito',
    name: 'Miguel Ángel Brito',
    role: 'Fundador & CEO',
    bio: 'Ingeniero de Telecomunicación con más de 7 años de experiencia liderando la evaluación técnica de proyectos, desarrollo de negocio y estrategias comerciales. Ha dirigido la elaboración de propuestas técnico-económicas, captación de clientes y optimización de soluciones energéticas y tecnológicas adaptadas al mercado. En SolvyX une su visión estratégica de negocio y liderazgo de producto para impulsar el crecimiento, cerrar alianzas clave y transformar ideas en soluciones tecnológicas de alto impacto.',
    highlights: [
      'Ingeniero de Telecomunicación',
      'Desarrollo de negocio y ventas',
      'Estrategia de producto',
      '+7 años de experiencia',
    ],
    avatar: '/team/miguel-angel-brito.webp',
    founder: true,
    linkedin: 'https://www.linkedin.com/in/miguel-angel-brito-chamorro-4a0659171/',
    knowsAbout: ['Desarrollo de negocio', 'Estrategia de producto', 'Ingeniería de telecomunicación', 'Ventas B2B', 'Soluciones energéticas'],
  },
  {
    id: 'erick-jimenez-cruz',
    name: 'Erick Jiménez Cruz',
    role: 'CTO & Arquitecto de Software',
    bio: 'Ingeniero full-stack senior con más de 5 años construyendo plataformas fintech y sistemas de alto rendimiento. Creó Eranpay —una wallet fintech con core bancario, KYC y servicios en tiempo real— y lideró apps premiadas (1.er lugar y $50K en una ronda de inversores en Madrid). En SolvyX une ese rigor de ingeniería con IA de punta para entregar automatización y software a medida que mueve la aguja de verdad.',
    highlights: [
      '+5 años de ingeniería',
      'Fintech, IA y blockchain',
      'Creador de Eranpay',
      'App premiada · $50K en Madrid',
    ],
    linkedin: 'https://www.linkedin.com/in/erickjimenezcruz/',
    github: 'https://github.com/erfajc97',
    avatar: '/avatar-solvyx-ej.png',
    knowsAbout: ['Automatización con IA', 'Desarrollo de software a medida', 'Fintech', 'Blockchain', 'React', 'Node.js', 'Rust'],
  },
];

/* Rutas absolutas ("/#...") para que el nav funcione también desde las
   páginas internas (/nosotros, /agendar), no solo desde la landing. */
export const nav: NavLink[] = [
  { label: 'Servicios', href: '/#servicios' },
  { label: 'Trabajo', href: '/#trabajo' },
  { label: 'Planes', href: '/#planes' },
  { label: 'Nosotros', href: '/nosotros/' },
  { label: 'Preguntas', href: '/preguntas/' },
  { label: 'Auditoría Gratis', href: '/auditoria/' },
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

export interface ServiceOption {
  label: string;
  icon: IconName;
}

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
    options: [
      { label: 'Automatización IA', icon: 'ai' },
      { label: 'Marketing & Ads', icon: 'megaphone' },
      { label: 'Web / App', icon: 'web' },
      { label: 'Fintech', icon: 'wallet' },
      { label: 'Otro', icon: 'spark' },
    ] as ServiceOption[],
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
  formEndpoint: '/api/contact',
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

/* Marquee: the stack we build with (real tools, no invented client logos).
   Swap for real client wordmarks once there are several to show. */
export const clients: string[] = [
  'Astro',
  'Next.js',
  'React Native',
  'Expo',
  'Tailwind CSS',
  'Supabase',
  'Claude AI',
  'Netlify',
  'Cal.com',
  'PostHog',
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
    slug: 'escapadas-madrid',
    title: 'Escapadas Madrid',
    category: 'Turismo · Web a medida',
    blurb:
      'Web para un club de escapadas y experiencias cerca de Madrid: destinos, membresías, área de socios, blog y versión en inglés.',
    image: '/work/escapadas-madrid.jpg',
    tags: ['Web a medida', 'Membresías', 'ES / EN'],
    href: 'https://www.escapadasmadrid.com',
    result: 'Web en vivo',
  },
  {
    slug: 'concepto-wallet',
    title: 'Wallet fintech',
    category: 'Concepto · App móvil',
    blurb:
      'Concepto de app de pagos: tarjeta virtual, envíos y recepciones al instante e historial de movimientos.',
    image: '/work/concept-wallet.jpg',
    tags: ['Fintech', 'iOS + Android', 'Concepto'],
    result: 'Concepto',
  },
  {
    slug: 'concepto-leads',
    title: 'Panel de leads con IA',
    category: 'Concepto · Automatización',
    blurb:
      'Concepto de panel que reúne los leads de tus anuncios, los califica con IA y muestra el embudo en tiempo real.',
    image: '/work/concept-leads.jpg',
    tags: ['IA', 'Leads', 'Concepto'],
    result: 'Concepto',
  },
  {
    slug: 'concepto-blockchain',
    title: 'Pagos blockchain',
    category: 'Concepto · Web3',
    blurb:
      'Concepto de plataforma de pagos con smart contracts y un panel de control para seguir cada transacción.',
    image: '/work/concept-blockchain.jpg',
    tags: ['Web3', 'Dashboard', 'Concepto'],
    result: 'Concepto',
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
      'Despliegue, medición y mejora continua. El lanzamiento es solo el inicio: seguimos optimizando resultados.',
  },
];

export const stats: Stat[] = [
  { value: 'En días', label: 'lanzamos automatizaciones e IA' },
  { value: '2 sem.', label: 'al primer producto en vivo' },
  { value: '100%', label: 'del código y los datos a tu nombre' },
  { value: 'Mismo día', label: 'respondemos tu consulta' },
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

/* Only real quotes, with the client's permission. Empty = section hidden. */
export const testimonials: Testimonial[] = [];

/* Shown in place of testimonials while there are none. Every line restates a
   promise already made elsewhere on the site (FAQ, process, contact). */
export interface Commitment {
  icon: IconName;
  title: string;
  description: string;
}

export const commitments: Commitment[] = [
  {
    icon: 'chart',
    title: 'Estimado claro desde la primera llamada',
    description: 'Sales de la llamada sabiendo qué vamos a hacer, cuánto cuesta y cuánto tarda.',
  },
  {
    icon: 'spark',
    title: 'Avance que ves cada semana',
    description: 'Demos en vivo y entregas continuas. Nada de meses de silencio.',
  },
  {
    icon: 'code',
    title: 'Todo a tu nombre',
    description: 'Te entregamos el repositorio, la documentación y los accesos a tu nombre. Sin cajas negras ni amarres.',
  },
  {
    icon: 'mail',
    title: 'Respuesta el mismo día',
    description: 'Escríbenos por email o WhatsApp y te respondemos el mismo día.',
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
    description: 'Equipo dedicado para empresas que necesitan ingeniería e IA constantes.',
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
  {
    q: '¿Quiénes están detrás de SolvyX?',
    a: 'SolvyX la lideran Miguel Ángel Brito, fundador y CEO (ingeniero de Telecomunicación con más de 7 años en desarrollo de negocio y estrategia de producto), y Erick Jiménez Cruz, CTO y arquitecto de software (más de 5 años construyendo fintech y sistemas de alto rendimiento, creador de Eranpay). Conoce al equipo y cómo trabajamos en la página "Nosotros".',
  },
];

export const finalCta = {
  title: 'Menos trabajo manual. Más clientes. Empecemos.',
  subtitle:
    'Agenda 30 minutos. Salimos de la llamada con una ruta clara y un estimado honesto — sin compromiso.',
  primary: { label: 'Agenda tu llamada', href: '#agenda' },
  secondary: { label: 'contact@solvyxdigital.com', href: 'mailto:contact@solvyxdigital.com' },
};

/* UI strings de componentes compartidos (se traducen por idioma). */
export const ui = {
  defaultTitle: 'Automatización con IA y Desarrollo de Software a Medida | SolvyX',
  nav: { cta: 'Agendar llamada', ctaShort: 'Agendar', open: 'Abrir menú', close: 'Cerrar menú', skip: 'Saltar al contenido', home: 'inicio' },
  marquee: 'La tecnología con la que construimos',
  heroUi: { selectHint: 'selecciona uno o más', cta: 'Agenda tu llamada', selectedPrefix: 'Listo para hablar de:' },
  // Paneles de cristal junto a Solvy en el hero
  heroStage: {
    codeBadge: 'Next.js / Astro',
    codeComment: '// Desarrollo con Next.js / Astro',
    eta: 'días, no meses',
    flowBadge: 'IA activa',
    flow: ['Ads', 'Agente IA', 'Califica', 'CRM'],
  },
  servicesSection: {
    eyebrow: 'Lo que hacemos por ti',
    title: 'Marketing con IA que vende por ti — y la ingeniería que lo sostiene',
    description:
      'Nuestro fuerte: ads, leads y contenido con IA que llenan tu agenda. Y cuando necesitas producto, construimos el software, las apps y la fintech que aguantan el crecimiento.',
    spotKicker: 'Lo que más piden ahora',
    spotTitle: 'Más clientes en piloto automático',
    spotText:
      'Conectamos tus ads de Meta y Google a una IA que captura, califica y nutre leads sola — y producimos los videos e imágenes que alimentan tus campañas.',
    spotChips: ['Más leads', 'Campañas 24/7', 'Contenido en días'],
    spotCta: 'Quiero más clientes',
    spotPlans: 'Ver planes',
    reelKicker: 'Todo lo que hacemos, en un vistazo',
    categories: {
      'ai-automation': 'Automatización',
      growth: 'Marketing IA',
      media: 'Contenido IA',
      fintech: 'Fintech',
      mobile: 'Apps',
      software: 'Software',
    } as Record<string, string>,
  },
  workSection: {
    eyebrow: 'Trabajo seleccionado',
    title: 'Lo que construimos',
    description: 'Un proyecto real que puedes visitar hoy y conceptos de lo que podemos construir para ti.',
    dotAria: 'Ir al proyecto',
  },
  statsSection: {
    eyebrow: 'Por qué SolvyX',
    title: 'La diferencia entre contratar a un proveedor y a un socio',
    description: 'Trabajamos como una extensión de tu equipo. Pocos clientes a la vez, foco total en cada uno.',
  },
  processSection: {
    eyebrow: 'Cómo trabajamos',
    title: 'Un proceso que ves avanzar cada semana',
    description:
      'Nada de cajas negras ni reportes que no entiendes. Demos en vivo, decisiones rápidas y código en producción.',
  },
  showcase: {
    kicker: 'Ingeniería con IA',
    title: 'Construido para producción, no para demos',
    text: 'Diseñamos y construimos software, automatización y fintech con estándar real de producción — seguro, escalable y listo para crecer contigo.',
    cta: 'Hablemos de tu proyecto',
    alt: 'SolvyX — render 3D de la marca',
  },
  testimonialsSection: { eyebrow: 'En palabras de clientes', title: 'Lo que dicen quienes ya nos contrataron' },
  commitmentsSection: { eyebrow: 'Nuestro compromiso', title: 'Lo que puedes esperar al trabajar con nosotros' },
  packagesSection: {
    eyebrow: 'Formas de trabajar juntos',
    title: 'Elige el ritmo que tu proyecto necesita',
    description: 'Desde una pieza puntual hasta un equipo dedicado. Precios honestos desde la primera llamada.',
    badge: 'Recomendado',
    dotAria: 'Ir al plan',
  },
  bookingUi: { fallback: '¿Prefieres que te escribamos? Déjanos un mensaje' },
  founderUi: { eyebrow: 'Quiénes están detrás' },
  footerUi: { rights: 'Todos los derechos reservados.' },
  introUi: { skip: 'Saltar intro', aria: 'Intro SolvyX' },
  langBanner: {
    text: 'Esta página también está disponible en español.',
    cta: 'Ver en español',
    close: 'Cerrar',
  },
  modalUi: {
    close: 'Cerrar',
    name: 'Nombre',
    namePh: 'Tu nombre',
    email: 'Correo',
    emailPh: 'tucorreo@empresa.com',
    company: 'Empresa',
    companyPh: 'Nombre de tu empresa',
    project: 'Tipo de proyecto',
    projectPh: 'Elige una opción…',
    message: 'Cuéntanos más',
    optional: '(opcional)',
    messagePh: 'Una frase sobre tu idea o reto',
    or: 'O escríbenos a',
  },
};

/* Textos para datos estructurados / meta (por idioma). */
export const seo = {
  // Home <title> (≤60 chars) and meta description (≤155 chars, ends with a CTA).
  homeTitle: 'Automatización con IA y Software · Madrid y Guayaquil | SolvyX',
  homeDescription:
    'Automatización con IA y software a medida en días, no meses. Equipo en Madrid y Guayaquil para España y Latinoamérica. Auditoría IA Gratis o llamada de 30 min.',
  slogan: 'Automatización con IA y software a medida — en días, no en meses.',
  orgDescription:
    'Especialistas en automatización con IA y desarrollo de software a medida. Automatizamos procesos de negocio y marketing con inteligencia artificial (conexión de ads, generación y nurturing de leads), creamos multimedia con IA, y construimos software a medida, apps móviles, wallets fintech y blockchain — entregado en días, no en meses.',
  serviceDescription:
    'Agencia y estudio especializado en automatización con IA y desarrollo de software a medida para empresas que quieren crecer rápido.',
  ogAlt: 'SolvyX — automatización con IA y desarrollo de software a medida',
  knowsAbout: [
    'Automatización con IA',
    'Desarrollo de software a medida',
    'Inteligencia artificial para negocios',
    'Agentes de IA',
    'Marketing con IA',
    'Generación de leads',
    'Aplicaciones móviles',
    'Fintech',
    'Blockchain',
    'Integración de APIs',
  ],
  serviceTypes: [
    'Automatización con IA',
    'Desarrollo de software a medida',
    'Marketing con IA',
    'Aplicaciones móviles',
    'Fintech y blockchain',
  ],
};

export const footer = {
  blurb:
    'SolvyX es un estudio de IA, automatización e ingeniería. Hacemos crecer negocios con marketing y automatización con IA, y construimos software, apps móviles y fintech.',
  columns: [
    {
      title: 'Servicios',
      links: [
        { label: 'Automatización con IA', href: '/#servicios' },
        { label: 'Marketing y ads con IA', href: '/#servicios' },
        { label: 'Multimedia con IA', href: '/#servicios' },
        { label: 'Fintech & Blockchain', href: '/#servicios' },
        { label: 'Software y apps', href: '/#servicios' },
      ],
    },
    {
      title: 'Estudio',
      links: [
        { label: 'Quiénes somos', href: '/nosotros/' },
        { label: 'Trabajo', href: '/#trabajo' },
        { label: 'Planes', href: '/#planes' },
        { label: 'Agenda una llamada', href: '/agendar/' },
        { label: 'Preguntas frecuentes', href: '/preguntas/' },
      ],
    },
  ],
};
