/* =====================================================================
   SolvyX — ENGLISH content dictionary.
   Mirrors every export of site.ts (the Spanish source of truth) so
   `getDict(locale)` can swap modules wholesale. Locale-independent
   values (media paths, links) are re-exported or spread from site.ts.
   ===================================================================== */
import {
  brand as esBrand,
  founder as esFounder,
  type NavLink,
  type Service,
  type WorkItem,
  type ProcessStep,
  type Stat,
  type Testimonial,
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
  location: 'Barcelona, Spain · Remote worldwide',
};

export const founder = {
  ...esFounder,
  role: 'Founder & Lead Engineer',
  bio: 'Senior full-stack engineer with 5+ years building fintech platforms and high-performance systems. He created Eranpay — a fintech wallet with a banking core, KYC and real-time services — and led award-winning apps (1st place and $50K at an investor round in Madrid). At SolvyX he combines that engineering rigor with cutting-edge AI to deliver automation and custom software that actually moves the needle.',
  highlights: [
    '5+ years of engineering',
    'Fintech, AI & blockchain',
    'Creator of Eranpay',
    'Award-winning app · $50K in Madrid',
  ],
};

export const nav: NavLink[] = [
  { label: 'Services', href: '/en/#servicios' },
  { label: 'Work', href: '/en/#trabajo' },
  { label: 'Pricing', href: '/en/#planes' },
  { label: 'About', href: '/en/about' },
  { label: 'FAQ', href: '/en/faq' },
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
  formEndpoint: '/.netlify/functions/contact',
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
    slug: 'novapay-wallet',
    title: 'NovaPay Wallet',
    category: 'Fintech · Mobile app',
    blurb: 'Fintech wallet with instant transfers, KYC and crypto on/off-ramp. From zero to the app stores in weeks.',
    image: '/work/novapay.jpg',
    tags: ['Fintech', 'Wallet', 'iOS + Android'],
    href: 'https://example.com/casos/novapay',
    result: '120k users',
  },
  {
    slug: 'verdant-growth',
    title: 'Verdant Growth',
    category: 'AI marketing · Automation',
    blurb: 'We wired Meta and Google Ads into an AI engine that qualifies and nurtures leads on its own. More sales, less spend.',
    image: '/work/verdant.jpg',
    tags: ['Ads', 'AI', 'Leads'],
    href: 'https://example.com/casos/verdant-growth',
    result: '+213% leads',
  },
  {
    slug: 'pulsar-studio',
    title: 'Pulsar Studio',
    category: 'AI multimedia · Social',
    blurb: 'AI-powered video and image production for social media: 300+ on-brand pieces per month.',
    image: '/work/pulsar.jpg',
    tags: ['AI video', 'Content', 'Social'],
    href: 'https://example.com/casos/pulsar',
    result: '318 pieces/mo',
  },
  {
    slug: 'cobalt-chain',
    title: 'Cobalt Chain',
    category: 'Blockchain · Web3',
    blurb: 'Web3 payments platform with audited smart contracts and a real-time control panel.',
    image: '/work/cobalt.jpg',
    tags: ['Web3', 'Smart contracts', 'Dashboard'],
    href: 'https://example.com/casos/cobalt',
    result: '−71% costs',
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
  { value: '+213%', label: 'more leads for our clients' },
  { value: '8.4×', label: 'average reported ROI' },
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

export const testimonials: Testimonial[] = [
  {
    quote:
      'Their marketing automations tripled our leads in two months. And the AI content came out better than our previous agency.',
    name: 'Mariana Vélez',
    role: 'CEO · Northbeam Capital',
    avatar: 'https://picsum.photos/seed/solvyx-mariana/200/200',
  },
  {
    quote: 'They wired our ads into an AI engine that qualifies leads on its own. We close more while selling less.',
    name: 'Tomás Rensch',
    role: 'COO · Verdant Growth',
    avatar: 'https://picsum.photos/seed/solvyx-tomas/200/200',
  },
  {
    quote: 'They launched our fintech wallet in two weeks. Fast, secure, no drama. Exactly what we needed.',
    name: 'Priya Naidoo',
    role: 'Head of Product · NovaPay',
    avatar: 'https://picsum.photos/seed/solvyx-priya/200/200',
  },
];

export const packages: Package[] = [
  {
    name: 'Express AI',
    price: 'from $1,200 USD',
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
    a: 'Projects start from $1,200 USD. Automations and AI pieces ship in days; a custom product (web, app or wallet) usually takes ~2 weeks. From there we scale with scope — always with a clear estimate from the first call.',
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
    a: 'SolvyX is led by Erick Jiménez Cruz, a senior full-stack engineer with 5+ years building fintech and high-performance systems (creator of Eranpay). Meet the team and how we work on the About page.',
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
        { label: 'About us', href: '/en/about' },
        { label: 'Work', href: '/en/#trabajo' },
        { label: 'Pricing', href: '/en/#planes' },
        { label: 'Book a call', href: '/en/book' },
        { label: 'FAQ', href: '/en/faq' },
      ],
    },
  ],
};

export const ui = {
  defaultTitle: 'AI Automation and Custom Software Development | SolvyX',
  nav: { cta: 'Book a call', open: 'Open menu', close: 'Close menu', skip: 'Skip to content', home: 'home' },
  marquee: 'Teams that trust us to build',
  heroUi: { selectHint: 'pick one or more', cta: 'Book your call', selectedPrefix: 'Ready to talk about:' },
  servicesSection: {
    eyebrow: 'What we do for you',
    title: 'AI marketing that sells for you — and the engineering that backs it',
    description:
      'Our strong suit: AI ads, leads and content that fill your pipeline. And when you need product, we build the software, apps and fintech that sustain the growth.',
    spotKicker: 'Most requested right now',
    spotTitle: 'More customers on autopilot',
    spotText:
      'We connect your Meta and Google ads to an AI that captures, qualifies and nurtures leads on its own — and we produce the videos and images that feed your campaigns.',
    spotChips: ['+213% leads', '24/7 campaigns', 'Content in days'],
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
    title: 'Products in production, not mockups',
    description: 'A sample of what we have built. Swipe through the projects.',
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
  packagesSection: {
    eyebrow: 'Ways to work together',
    title: 'Pick the pace your project needs',
    description: 'From a single piece to a dedicated team. Honest pricing from the first call.',
    badge: 'Recommended',
    dotAria: 'Go to plan',
  },
  bookingUi: { fallback: 'Prefer that we write first? Leave us a message' },
  founderUi: { eyebrow: 'Who is behind it' },
  footerUi: { rights: 'All rights reserved.' },
  introUi: { skip: 'Skip intro', aria: 'SolvyX intro' },
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
  founderKnows: ['AI automation', 'Custom software development', 'Fintech', 'Blockchain', 'React', 'Node.js', 'Rust'],
};
