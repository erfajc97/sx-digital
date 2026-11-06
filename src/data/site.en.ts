/* =====================================================================
   SolvyX — ENGLISH content dictionary.
   Mirrors every export of site.ts (the Spanish source of truth) so
   `getDict(locale)` can swap modules wholesale. Locale-independent
   values (media paths, links) are re-exported or spread from site.ts.
   ===================================================================== */
import {
  brand as esBrand,
  team as esTeam,
  type TeamMember,
  type NavLink,
  type Service,
  type WorkItem,
  type ProcessStep,
  type Stat,
  type Testimonial,
  type Commitment,
  type Package,
  type Faq,
  type IconName,
  type ServiceOption,
} from './site';

export { heroMedia, clients } from './site';

export const brand = {
  ...esBrand,
  tagline:
    'Specialists in AI automation and custom software development. More leads, less manual work, and launches in days — not months. Get ahead of your competition.',
  locations: ['Madrid, Spain', 'Guayaquil, Ecuador'],
};

/* Same people and links as site.ts; only role, bio, badges and topics are translated. */
const teamEn: Record<string, Pick<TeamMember, 'role' | 'bio' | 'highlights' | 'knowsAbout'>> = {
  'miguel-angel-brito': {
    role: 'Founder & CEO',
    bio: 'Telecommunications engineer with 7+ years of experience leading technical project assessment, business development and commercial strategy. He has led the preparation of technical and financial proposals, client acquisition and the optimization of energy and technology solutions tailored to the market. At SolvyX he brings his strategic business vision and product leadership to drive growth, close key partnerships and turn ideas into high-impact technology solutions.',
    highlights: ['Telecommunications engineer', 'Business development & sales', 'Product strategy', '7+ years of experience'],
    knowsAbout: ['Business development', 'Product strategy', 'Telecommunications engineering', 'B2B sales', 'Energy solutions'],
  },
  'erick-jimenez-cruz': {
    role: 'CTO & Software Architect',
    bio: 'Senior full-stack engineer with 5+ years building fintech platforms and high-performance systems. He created Eranpay — a fintech wallet with a banking core, KYC and real-time services — and led award-winning apps (1st place and $50K at an investor round in Madrid). At SolvyX he combines that engineering rigor with cutting-edge AI to deliver automation and custom software that actually moves the needle.',
    highlights: ['5+ years of engineering', 'Fintech, AI & blockchain', 'Creator of Eranpay', 'Award-winning app · $50K in Madrid'],
    knowsAbout: ['AI automation', 'Custom software development', 'Fintech', 'Blockchain', 'React', 'Node.js', 'Rust'],
  },
};

export const team: TeamMember[] = esTeam.map((m) => ({ ...m, ...teamEn[m.id] }));

export const nav: NavLink[] = [
  { label: 'Services', href: '/en/#servicios' },
  { label: 'Work', href: '/en/#trabajo' },
  { label: 'Pricing', href: '/en/#planes' },
  { label: 'About', href: '/en/about/' },
  { label: 'FAQ', href: '/en/faq/' },
  { label: 'Free Audit', href: '/en/audit/' },
];

export const hero = {
  eyebrow: 'AI Studio · Automation · Software · Fintech',
  particleWords: ['AUTOMATION', 'AI MARKETING', 'AI CONTENT', 'WEB APPS', 'MOBILE APPS', 'FINTECH'],
  fallbackHeadline: 'AI automation and custom software that grow your business.',
  lead: 'We automate your business with AI and build the custom software that puts you ahead of your competition — delivered in days, not months.',
  secondaryCta: { label: 'See our work', href: '#trabajo' },
  servicePrompt: {
    title: 'What do you need?',
    subtitle: 'Pick everything that applies',
    options: [
      { label: 'AI Automation', icon: 'ai' },
      { label: 'Marketing & Ads', icon: 'megaphone' },
      { label: 'Web / App', icon: 'web' },
      { label: 'Fintech', icon: 'wallet' },
      { label: 'Other', icon: 'spark' },
    ] as ServiceOption[],
    placeholder: 'Tap to pick one or more services.',
    bannerLead: 'Ready to talk about:',
    cta: "Let's go",
    ctaHref: '#agenda',
  },
};

export const contact = {
  formEndpoint: '/api/contact',
  projectTypes: ['AI Automation', 'Marketing & Ads', 'Web / App', 'Fintech / Blockchain', 'AI Multimedia', 'Other'],
  modal: {
    title: "Let's talk about your project",
    subtitle: 'Tell us what you need and we reply the same day.',
    cta: 'Send',
    success: 'Thank you! We got your message and will reach out today.',
  },
  agenda: {
    eyebrow: 'Book a call',
    title: 'Book a 30-minute call',
    text: 'No endless forms, no strings attached. Tell us your idea and you leave the call with a clear roadmap and an honest estimate.',
    bullets: ['Same-day response', 'Clear roadmap & estimate', 'No commitment'],
    cta: 'Book a call',
  },
};

export const services: Service[] = [
  {
    id: 'ai-automation',
    icon: 'ai',
    title: 'AI business automation',
    description:
      'Agents and workflows that answer, sell and operate for you. We connect your tools and remove repetitive manual work.',
    bullets: ['Agents & copilots', '24/7 workflows', 'Integrates with your apps'],
  },
  {
    id: 'growth',
    icon: 'megaphone',
    title: 'AI marketing & ads',
    description:
      'We connect Meta and Google Ads, generate leads and turn them into customers with AI-optimized campaigns.',
    bullets: ['Ads integration', 'Lead generation', 'Automatic nurturing'],
  },
  {
    id: 'media',
    icon: 'video',
    title: 'AI multimedia',
    description:
      'Professional-quality videos and images for social media, in record time. Your brand, producing non-stop.',
    bullets: ['AI video', 'Social media assets', 'Ready in days'],
  },
  {
    id: 'fintech',
    icon: 'wallet',
    title: 'Fintech & Blockchain',
    description: 'Fintech-grade wallets, payments and web3 products. Secure, scalable and production-ready.',
    bullets: ['Fintech wallets', 'Web3 / smart contracts', 'Payments & integrations'],
  },
  {
    id: 'mobile',
    icon: 'mobile',
    title: 'Custom mobile apps',
    description: 'iOS and Android from a single codebase, with the smoothness of a native app.',
    bullets: ['React Native / Expo', 'Push & offline', 'App store releases'],
  },
  {
    id: 'software',
    icon: 'code',
    title: 'Software & web platforms',
    description:
      'Websites that convert, SaaS, dashboards and custom backends that handle real load and grow with you.',
    bullets: ['Next.js / Astro', 'Scalable APIs', 'Cloud + DevOps'],
  },
];

export const work: WorkItem[] = [
  {
    slug: 'escapadas-madrid',
    title: 'Escapadas Madrid',
    category: 'Travel · Custom website',
    blurb:
      'Website for a club of curated getaways and experiences near Madrid: destinations, memberships, members area, blog and an English version.',
    image: '/work/escapadas-madrid.jpg',
    tags: ['Custom website', 'Memberships', 'ES / EN'],
    href: 'https://www.escapadasmadrid.com',
    result: 'Live site',
  },
  {
    slug: 'concept-wallet',
    title: 'Fintech wallet',
    category: 'Concept · Mobile app',
    blurb:
      'Concept for a payments app: virtual card, instant send and receive, and a full transaction history.',
    image: '/work/concept-wallet.jpg',
    tags: ['Fintech', 'iOS + Android', 'Concept'],
    result: 'Concept',
  },
  {
    slug: 'concept-leads',
    title: 'AI lead dashboard',
    category: 'Concept · Automation',
    blurb:
      'Concept for a dashboard that gathers the leads from your ads, scores them with AI and shows the funnel live.',
    image: '/work/concept-leads.jpg',
    tags: ['AI', 'Leads', 'Concept'],
    result: 'Concept',
  },
  {
    slug: 'concept-blockchain',
    title: 'Blockchain payments',
    category: 'Concept · Web3',
    blurb:
      'Concept for a payments platform with smart contracts and a control panel to follow every transaction.',
    image: '/work/concept-blockchain.jpg',
    tags: ['Web3', 'Dashboard', 'Concept'],
    result: 'Concept',
  },
];

export const process: ProcessStep[] = [
  {
    step: '01',
    title: 'Discover',
    description:
      'One call to understand your business and where AI moves the needle. You leave with a clear plan and an honest estimate.',
  },
  {
    step: '02',
    title: 'Design',
    description: 'We define the flow, the design and the architecture before building. You approve the direction.',
  },
  {
    step: '03',
    title: 'Build fast',
    description: 'Automations and content in days; product in a couple of weeks. With progress you see live.',
  },
  {
    step: '04',
    title: 'Launch & scale',
    description:
      'Deploy, measure, improve. Launch is the starting line: we keep optimizing results.',
  },
];

export const stats: Stat[] = [
  { value: 'Days', label: 'to launch automations & AI' },
  { value: '2 wks', label: 'to your first live product' },
  { value: '100%', label: 'of the code & data in your name' },
  { value: 'Same day', label: 'reply to your enquiry' },
];

export const differentiators = [
  {
    icon: 'ai' as IconName,
    title: 'AI end to end',
    description: 'Automation, marketing, content and product — all genuinely powered by AI, not as a gimmick.',
  },
  {
    icon: 'spark' as IconName,
    title: 'Actually fast',
    description: 'Automations in days and product in a couple of weeks. No months of waiting, no excuses.',
  },
  {
    icon: 'check' as IconName,
    title: 'Your code, your data',
    description: 'Everything delivered documented and under your name. No lock-in, no black boxes.',
  },
];

/* Only real quotes, with the client's permission. Empty = section hidden. */
export const testimonials: Testimonial[] = [];

export const commitments: Commitment[] = [
  {
    icon: 'chart',
    title: 'A clear estimate from the first call',
    description: 'You leave the call knowing what we will build, what it costs and how long it takes.',
  },
  {
    icon: 'spark',
    title: 'Progress you see every week',
    description: 'Live demos and continuous delivery. No months of silence.',
  },
  {
    icon: 'code',
    title: 'Everything in your name',
    description: 'We hand over the repository, the documentation and the accounts in your name. No black boxes, no lock-in.',
  },
  {
    icon: 'mail',
    title: 'Same-day reply',
    description: 'Write to us by email or WhatsApp and we will get back to you the same day.',
  },
];

export const packages: Package[] = [
  {
    name: 'Express AI',
    price: 'Quote in 24 h',
    cadence: 'in days',
    description: 'One automation, agent or AI content piece, ready in days.',
    features: ['Delivery in days', 'Automation or AI content', 'Connected to your tools'],
    cta: 'Start now',
    featured: false,
  },
  {
    name: 'Growth',
    price: 'custom',
    cadence: 'most popular',
    description: 'AI marketing + automation + product. Your complete growth engine.',
    features: ['AI marketing & ads', 'Business automations', 'AI social content', 'Custom web or app'],
    cta: 'Design my plan',
    featured: true,
  },
  {
    name: 'Scale',
    price: 'custom',
    cadence: 'ongoing partner',
    description: 'A dedicated team for companies that need constant engineering and AI.',
    features: ['Dedicated team', 'Fintech / blockchain', 'SLA & 24/7 support'],
    cta: "Let's talk",
    featured: false,
  },
];

export const faqs: Faq[] = [
  {
    q: 'How much does it cost?',
    a: 'It depends on the scope: how many automations or screens, which tools it has to connect to and when you need it. After a 30-minute call we send you a fixed quote within 24 h — no commitment and no surprises later. If you are not sure yet what you need, start with the free website audit.',
  },
  {
    q: 'How fast do you deliver?',
    a: 'Automations, campaigns and AI content in days. A product in about 2 weeks. We work with continuous delivery so you see real progress, not months of silence.',
  },
  {
    q: 'How do you get me more customers with AI?',
    a: 'We connect your Meta and Google ads to AI workflows that capture, qualify and nurture leads automatically, and we produce the social content that feeds those campaigns. Less manual work, more conversions.',
  },
  {
    q: 'Do you build fintech and blockchain?',
    a: 'Yes — it is one of our specialties. We build fintech-grade wallets, payment integrations and web3 products with audited smart contracts.',
  },
  {
    q: 'Does AI content look professional?',
    a: 'Yes. We produce on-brand videos and images for social media — consistent and in record time. No generic templates.',
  },
  {
    q: 'Do I own the code and the accounts?',
    a: 'Always. We hand over the repository, the documentation and the access under your name. No black boxes, no lock-in.',
  },
  {
    q: 'Who is behind SolvyX?',
    a: 'SolvyX is led by Miguel Ángel Brito, Founder & CEO (telecommunications engineer with 7+ years in business development and product strategy), and Erick Jiménez Cruz, CTO & Software Architect (5+ years building fintech and high-performance systems, creator of Eranpay). Meet the team and how we work on the About page.',
  },
];

export const finalCta = {
  title: 'Less manual work. More customers. Let’s start.',
  subtitle:
    'Book 30 minutes. You leave the call with a clear roadmap and an honest estimate — no commitment.',
  primary: { label: 'Book your call', href: '#agenda' },
  secondary: { label: 'contact@solvyxdigital.com', href: 'mailto:contact@solvyxdigital.com' },
};

export const footer = {
  blurb:
    'SolvyX is an AI, automation and engineering studio. We grow businesses with AI marketing and automation, and we build software, mobile apps and fintech.',
  columns: [
    {
      title: 'Services',
      links: [
        { label: 'AI automation', href: '/en/#servicios' },
        { label: 'AI marketing & ads', href: '/en/#servicios' },
        { label: 'AI multimedia', href: '/en/#servicios' },
        { label: 'Fintech & Blockchain', href: '/en/#servicios' },
        { label: 'Software & apps', href: '/en/#servicios' },
      ],
    },
    {
      title: 'Studio',
      links: [
        { label: 'About us', href: '/en/about/' },
        { label: 'Work', href: '/en/#trabajo' },
        { label: 'Pricing', href: '/en/#planes' },
        { label: 'Book a call', href: '/en/book/' },
        { label: 'FAQ', href: '/en/faq/' },
      ],
    },
  ],
};

export const ui = {
  defaultTitle: 'AI Automation and Custom Software Development | SolvyX',
  nav: { cta: 'Book a call', ctaShort: 'Book a call', open: 'Open menu', close: 'Close menu', skip: 'Skip to content', home: 'home' },
  marquee: 'The stack we build with',
  heroUi: { selectHint: 'pick one or more', cta: 'Book your call', selectedPrefix: 'Ready to talk about:' },
  // Glass panels next to Solvy in the hero
  heroStage: {
    codeBadge: 'Next.js / Astro',
    codeComment: '// Built with Next.js / Astro',
    eta: 'days, not months',
    flowBadge: 'AI live',
    flow: ['Ads', 'AI agent', 'Qualify', 'CRM'],
  },
  servicesSection: {
    eyebrow: 'What we do for you',
    title: 'AI marketing that sells for you — and the engineering that backs it',
    description:
      'Our strong suit: AI ads, leads and content that fill your pipeline. And when you need product, we build the software, apps and fintech that sustain the growth.',
    spotKicker: 'Most requested right now',
    spotTitle: 'More customers on autopilot',
    spotText:
      'We connect your Meta and Google ads to an AI that captures, qualifies and nurtures leads on its own — and we produce the videos and images that feed your campaigns.',
    spotChips: ['More leads', '24/7 campaigns', 'Content in days'],
    spotCta: 'I want more customers',
    spotPlans: 'See pricing',
    reelKicker: 'Everything we do, at a glance',
    categories: {
      'ai-automation': 'Automation',
      growth: 'AI Marketing',
      media: 'AI Content',
      fintech: 'Fintech',
      mobile: 'Apps',
      software: 'Software',
    } as Record<string, string>,
  },
  workSection: {
    eyebrow: 'Selected work',
    title: 'What we build',
    description: 'A real project you can visit today, plus concepts of what we can build for you.',
    dotAria: 'Go to project',
  },
  statsSection: {
    eyebrow: 'Why SolvyX',
    title: 'The difference between hiring a vendor and a partner',
    description: 'We work as an extension of your team. Few clients at a time, full focus on each one.',
  },
  processSection: {
    eyebrow: 'How we work',
    title: 'A process you see moving every week',
    description: 'No black boxes, no reports you can’t parse. Live demos, fast decisions and code in production.',
  },
  showcase: {
    kicker: 'AI engineering',
    title: 'Built for production, not for demos',
    text: 'We design and build software, automation and fintech to a real production standard — secure, scalable and ready to grow with you.',
    cta: 'Let’s talk about your project',
    alt: 'SolvyX — 3D brand render',
  },
  testimonialsSection: { eyebrow: 'In our clients’ words', title: 'What the people who hired us say' },
  commitmentsSection: { eyebrow: 'Our commitment', title: 'What you can expect when you work with us' },
  packagesSection: {
    eyebrow: 'Ways to work together',
    title: 'Pick the pace your project needs',
    description: 'From a single piece to a dedicated team. After the call, a fixed quote within 24 h, no commitment.',
    auditHint: 'Not sure which plan you need? Start with the free audit: in 30 seconds you see what your website needs to sell more.',
    auditCta: 'Audit my website for free',
    badge: 'Recommended',
    dotAria: 'Go to plan',
  },
  bookingUi: { fallback: 'Prefer us to write to you? Leave us a message' },
  founderUi: { eyebrow: 'The team behind it' },
  footerUi: { rights: 'All rights reserved.' },
  introUi: { skip: 'Skip intro', aria: 'SolvyX intro' },
  langBanner: {
    text: 'This page is also available in English.',
    cta: 'View in English',
    close: 'Close',
  },
  modalUi: {
    close: 'Close',
    name: 'Name',
    namePh: 'Your name',
    email: 'Email',
    emailPh: 'you@company.com',
    company: 'Company',
    companyPh: 'Your company name',
    project: 'Project type',
    projectPh: 'Pick an option…',
    message: 'Tell us more',
    optional: '(optional)',
    messagePh: 'One line about your idea or challenge',
    or: 'Or write to us at',
  },
};

export const seo = {
  homeTitle: 'AI Automation & Software · Madrid & Guayaquil | SolvyX',
  homeDescription:
    'AI automation and custom software in days, not months. Teams in Madrid and Guayaquil serving Spain, Latin America and beyond. Free AI Audit or 30-min call.',
  slogan: 'AI automation and custom software — in days, not months.',
  orgDescription:
    'Specialists in AI automation and custom software development. We automate business and marketing processes with artificial intelligence (ads integration, lead generation and nurturing), create AI multimedia, and build custom software, mobile apps, fintech wallets and blockchain — delivered in days, not months.',
  serviceDescription:
    'Agency and studio specialized in AI automation and custom software development for companies that want to grow fast.',
  ogAlt: 'SolvyX — AI automation and custom software development',
  knowsAbout: [
    'AI automation',
    'Custom software development',
    'Artificial intelligence for business',
    'AI agents',
    'AI marketing',
    'Lead generation',
    'Mobile apps',
    'Fintech',
    'Blockchain',
    'API integration',
  ],
  serviceTypes: ['AI automation', 'Custom software development', 'AI marketing', 'Mobile apps', 'Fintech & blockchain'],
};
