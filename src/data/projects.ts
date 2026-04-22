/**
 * Phase 8 — Project data.
 *
 * 11 projects for Ronald Cheng's portfolio.
 * Images served from /public/projects/<slug>/ (PROJ-006).
 * If a project has no screenshots yet, the slider shows a placeholder.
 */

export interface Project {
  slug: string;
  name: string;
  url: string;
  description: string;
  tech: string[];
  /** Paths relative to /public (e.g. /projects/ailex/1.png) */
  images: string[];
}

export const PROJECTS: Project[] = [
  {
    slug: 'chinachem-corpsite',
    name: 'Chinachem Corpsite',
    url: 'https://www.chinachemgroup.com/zh-hk/',
    description:
      'Corporate website for Chinachem Group — a Hong Kong property developer. Built on .NET MVC with AngularJS-driven interactive components and Umbraco CMS for content management.',
    tech: ['.NET MVC', 'AngularJS', 'Umbraco', 'SCSS'],
    images: ['/projects/chinachem-corpsite/1.png'],
  },
  {
    slug: 'sustainability-report',
    name: 'Sustainability Report',
    url: 'https://www.chinachemgroup.com/zh-hk/sustainability-report-2023-2024/',
    description:
      'Interactive sustainability report microsite for Chinachem Group. Astro.js with React islands and MDX-driven content, Framer Motion page transitions, and Lottie animations for data visualisation.',
    tech: ['Astro.js', 'React', 'MDX', 'Framer Motion', 'Lottie'],
    images: ['/projects/sustainability-report/1.png'],
  },
  {
    slug: 'ninapark',
    name: 'Ninapark',
    url: 'https://www.ninapark.org/zh-hk/',
    description:
      'E-commerce and interactive destination website for Nina Park. Three.js-powered immersive product experiences, Stripe payments, Umbraco CMS, built on .NET MVC.',
    tech: ['.NET MVC', 'Three.js', 'Umbraco', 'Ecommerce', 'Stripe'],
    images: ['/projects/ninapark/1.png'],
  },
  {
    slug: 'hang-lung-corpsite',
    name: 'Hang Lung Corpsite',
    url: 'https://www.hanglung.com/zh-hk/home',
    description:
      'Multi-site corporate platform for Hang Lung Properties — a major HK real-estate group. Vue.js components with TailwindCSS, Kentico CMS, subdomain-based multi-site architecture on .NET MVC.',
    tech: ['.NET MVC', 'Kentico', 'Vue.js', 'TailwindCSS', 'Multi-site'],
    images: ['/projects/hang-lung-corpsite/1.png'],
  },
  {
    slug: 'towngas-corpsite',
    name: 'Towngas Corpsite',
    url: 'https://www.towngas.com/tc/',
    description:
      'Corporate website for The Hong Kong and China Gas Company (Towngas). Full CMS revamp from Kentico to Umbraco on .NET MVC, maintaining parity with dozens of content types.',
    tech: ['.NET MVC', 'Umbraco', 'SCSS'],
    images: ['/projects/towngas-corpsite/1.png'],
  },
  {
    slug: 'towngas-cooking',
    name: 'Towngas Cooking Centre',
    url: 'https://www.towngascooking.com/tc',
    description:
      "Booking and content platform for Towngas Cooking Centre — Hong Kong's premier culinary school. Integrates cron-job class schedules, Flipping Book digital catalogs, Google Maps, and YouTube API. Built on Astro.js + Umbraco.",
    tech: ['.NET MVC', 'Umbraco', 'Astro.js', 'Google Maps', 'YouTube API', 'Cron'],
    images: ['/projects/towngas-cooking/1.png'],
  },
  {
    slug: 'pcpd-corpsite',
    name: 'PCPD Corpsite',
    url: 'https://www.pcpd.com/',
    description:
      'Corporate website for Hong Kong\u2019s Privacy Commissioner for Personal Data (PCPD). Built on Laravel with TwillCMS for editorial flexibility and compliance-grade accessibility.',
    tech: ['Laravel', 'TwillCMS', 'PHP'],
    images: ['/projects/pcpd-corpsite/1.png'],
  },
  {
    slug: 'maximsmx-corpsite',
    name: 'MaximsMX Corpsite',
    url: 'https://www.maximsmx.com.hk/zh-HK',
    description:
      "Corporate and e-commerce site for Maxim's MX — a premium grocery chain. Next.js storefront with .NET MVC + Umbraco backend, covering full shopping cart and checkout flows.",
    tech: ['Next.js', '.NET MVC', 'Umbraco', 'Ecommerce'],
    images: ['/projects/maximsmx-corpsite/1.png'],
  },
  {
    slug: 'bea-cross-border',
    name: 'BEA Cross Border Minisite',
    url: 'https://www.hkbea.com/html/cross-boundary-wealth-management/en/',
    description:
      'Promotional microsite for Bank of East Asia cross-boundary wealth management product. Static React/TypeScript SPA built with Gatsby — fast, SEO-optimised, and easily editable.',
    tech: ['React', 'TypeScript', 'Gatsby'],
    images: ['/projects/bea-cross-border/1.png'],
  },
  {
    slug: 'rhkyc',
    name: 'RHKYC',
    url: 'https://www.rhkyc.org.hk/',
    description:
      'Website for the Royal Hong Kong Yacht Club. Laravel + OctoberCMS with GrapesJS visual page builder for non-technical staff to maintain rich content pages.',
    tech: ['Laravel', 'OctoberCMS', 'GrapesJS', 'PHP'],
    images: ['/projects/rhkyc/1.png'],
  },
  {
    slug: 'ailex',
    name: 'AiLex',
    url: 'https://event.masteralex.io/',
    description:
      'AI-powered legal + event SaaS platform. Multi-agent orchestration with LangGraph and LangChain, CopilotKit for copilot UX, Three.js hero scene, Framer Motion animations, Clerk auth, Stripe billing, MongoDB + PostgreSQL + PGVector databases.',
    tech: [
      'Next.js',
      'TypeScript',
      'Python',
      'LangGraph',
      'LangChain',
      'CopilotKit',
      'Three.js',
      'Framer Motion',
      'TailwindCSS',
      'Shadcn',
      'Clerk',
      'Stripe',
      'MongoDB',
      'PostgreSQL',
      'PGVector',
    ],
    images: ['/projects/ailex/1.png'],
  },
];
