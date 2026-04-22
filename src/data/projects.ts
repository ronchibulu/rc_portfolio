/**
 * Phase 8 — Project data.
 *
 * 11 projects for Ronald Cheng's portfolio.
 * Images served from /public/projects/<folder>/<file>.png (PROJ-006).
 * Folder names use underscores; slugs (URL keys) use hyphens.
 * First image in each array is the lead screenshot.
 */

export interface Project {
  slug: string;
  name: string;
  url: string;
  description: string;
  tech: string[];
  /** Paths relative to /public (e.g. /projects/ailex/home.png) */
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
    images: [
      '/projects/chinachem_corpsite/home.png',
      '/projects/chinachem_corpsite/slider.png',
      '/projects/chinachem_corpsite/description_page.png',
      '/projects/chinachem_corpsite/property_page.png',
      '/projects/chinachem_corpsite/property_page_2.png',
      '/projects/chinachem_corpsite/news_page.png',
      '/projects/chinachem_corpsite/magazine_page.png',
      '/projects/chinachem_corpsite/ccg_heart_minisite.png',
    ],
  },
  {
    slug: 'sustainability-report',
    name: 'Sustainability Report',
    url: 'https://www.chinachemgroup.com/zh-hk/sustainability-report-2023-2024/',
    description:
      'Interactive sustainability report microsite for Chinachem Group. Astro.js with React islands and MDX-driven content, Framer Motion page transitions, and Lottie animations for data visualisation.',
    tech: ['Astro.js', 'React', 'MDX', 'Framer Motion', 'Lottie'],
    images: [
      '/projects/sustainability_report/23-24_home.png',
      '/projects/sustainability_report/22-23_home.png',
      '/projects/sustainability_report/21-22_home.png',
      '/projects/sustainability_report/timeline.png',
      '/projects/sustainability_report/environment_page.png',
      '/projects/sustainability_report/people_page.png',
      '/projects/sustainability_report/prosperity_page.png',
      '/projects/sustainability_report/governance_page.png',
      '/projects/sustainability_report/performance_page.png',
      '/projects/sustainability_report/you_may_also_like.png',
    ],
  },
  {
    slug: 'ninapark',
    name: 'Ninapark',
    url: 'https://www.ninapark.org/zh-hk/',
    description:
      'E-commerce and interactive destination website for Nina Park. Three.js-powered immersive product experiences, Stripe payments, Umbraco CMS, built on .NET MVC.',
    tech: ['.NET MVC', 'Three.js', 'Umbraco', 'Ecommerce', 'Stripe'],
    images: [
      '/projects/ninapark/home.png',
      '/projects/ninapark/home_2.png',
      '/projects/ninapark/3d_scroll.png',
      '/projects/ninapark/3d_object_interaction.png',
      '/projects/ninapark/wood_fossil.png',
      '/projects/ninapark/plants_page.png',
      '/projects/ninapark/plant_detail.png',
      '/projects/ninapark/event_listing.png',
      '/projects/ninapark/event_booking_1.png',
      '/projects/ninapark/event_booking_2.png',
      '/projects/ninapark/map.png',
      '/projects/ninapark/video.png',
    ],
  },
  {
    slug: 'hang-lung-corpsite',
    name: 'Hang Lung Corpsite',
    url: 'https://www.hanglung.com/zh-hk/home',
    description:
      'Multi-site corporate platform for Hang Lung Properties — a major HK real-estate group. Vue.js components with TailwindCSS, Kentico CMS, subdomain-based multi-site architecture on .NET MVC.',
    tech: ['.NET MVC', 'Kentico', 'Vue.js', 'TailwindCSS', 'Multi-site'],
    images: [
      '/projects/hanglung_corpsite/group_home.png',
      '/projects/hanglung_corpsite/about_us.png',
      '/projects/hanglung_corpsite/news.png',
      '/projects/hanglung_corpsite/property_home.png',
      '/projects/hanglung_corpsite/properties.png',
      '/projects/hanglung_corpsite/property_page.png',
      '/projects/hanglung_corpsite/property_gallery.png',
      '/projects/hanglung_corpsite/photo_gallery.png',
      '/projects/hanglung_corpsite/video_gallery.png',
      '/projects/hanglung_corpsite/publications.png',
    ],
  },
  {
    slug: 'towngas-corpsite',
    name: 'Towngas Corpsite',
    url: 'https://www.towngas.com/tc/',
    description:
      'Corporate website for The Hong Kong and China Gas Company (Towngas). Full CMS revamp from Kentico to Umbraco on .NET MVC, maintaining parity with dozens of content types.',
    tech: ['.NET MVC', 'Umbraco', 'SCSS'],
    images: [
      '/projects/towngas_corpsite/home.png',
      '/projects/towngas_corpsite/home_2.png',
      '/projects/towngas_corpsite/timeline.png',
      '/projects/towngas_corpsite/inner_page.png',
      '/projects/towngas_corpsite/news_centre.png',
      '/projects/towngas_corpsite/publication_page.png',
      '/projects/towngas_corpsite/stock.png',
    ],
  },
  {
    slug: 'towngas-cooking',
    name: 'Towngas Cooking Centre',
    url: 'https://www.towngascooking.com/tc',
    description:
      "Booking and content platform for Towngas Cooking Centre — Hong Kong's premier culinary school. Integrates cron-job class schedules, Flipping Book digital catalogs, Google Maps, and YouTube API. Built on Astro.js + Umbraco.",
    tech: ['.NET MVC', 'Umbraco', 'Astro.js', 'Google Maps', 'YouTube API', 'Cron'],
    images: [
      '/projects/towngas_cooking_centre/home.png',
      '/projects/towngas_cooking_centre/cooking_course.png',
      '/projects/towngas_cooking_centre/recipe.png',
      '/projects/towngas_cooking_centre/venue.png',
      '/projects/towngas_cooking_centre/map.png',
      '/projects/towngas_cooking_centre/flipping_book.png',
      '/projects/towngas_cooking_centre/youtube.png',
    ],
  },
  {
    slug: 'pcpd-corpsite',
    name: 'PCPD Corpsite',
    url: 'https://www.pcpd.com/',
    description:
      'Corporate website for Hong Kong’s Privacy Commissioner for Personal Data (PCPD). Built on Laravel with TwillCMS for editorial flexibility and compliance-grade accessibility.',
    tech: ['Laravel', 'TwillCMS', 'PHP'],
    images: [
      '/projects/pcpd_corpsite/home.png',
      '/projects/pcpd_corpsite/home_2.png',
      '/projects/pcpd_corpsite/description_page.png',
      '/projects/pcpd_corpsite/property.png',
      '/projects/pcpd_corpsite/report_listing.png',
      '/projects/pcpd_corpsite/photo_gallery.png',
    ],
  },
  {
    slug: 'maximsmx-corpsite',
    name: 'MaximsMX Corpsite',
    url: 'https://www.maximsmx.com.hk/zh-HK',
    description:
      "Corporate and e-commerce site for Maxim's MX — a premium grocery chain. Next.js storefront with .NET MVC + Umbraco backend, covering full shopping cart and checkout flows.",
    tech: ['Next.js', '.NET MVC', 'Umbraco', 'Ecommerce'],
    images: [
      '/projects/maximsmx_corpsite/home.png',
      '/projects/maximsmx_corpsite/home-2.png',
      '/projects/maximsmx_corpsite/about_mx.png',
      '/projects/maximsmx_corpsite/promotion_page.png',
      '/projects/maximsmx_corpsite/order.png',
      '/projects/maximsmx_corpsite/order_2.png',
      '/projects/maximsmx_corpsite/map.png',
      '/projects/maximsmx_corpsite/faq.png',
      '/projects/maximsmx_corpsite/recruitment.png',
    ],
  },
  {
    slug: 'bea-cross-border',
    name: 'BEA Cross Border Minisite',
    url: 'https://www.hkbea.com/html/cross-boundary-wealth-management/en/',
    description:
      'Promotional microsite for Bank of East Asia cross-boundary wealth management product. Static React/TypeScript SPA built with Gatsby — fast, SEO-optimised, and easily editable.',
    tech: ['React', 'TypeScript', 'Gatsby'],
    images: [
      '/projects/bea_cross_border_minisite/home.png',
      '/projects/bea_cross_border_minisite/vertical_nav.png',
      '/projects/bea_cross_border_minisite/inner_page_1.png',
      '/projects/bea_cross_border_minisite/inner_page_2.png',
      '/projects/bea_cross_border_minisite/map.png',
    ],
  },
  {
    slug: 'rhkyc',
    name: 'RHKYC',
    url: 'https://www.rhkyc.org.hk/',
    description:
      'Website for the Royal Hong Kong Yacht Club. Laravel + OctoberCMS with GrapesJS visual page builder for non-technical staff to maintain rich content pages.',
    tech: ['Laravel', 'OctoberCMS', 'GrapesJS', 'PHP'],
    images: [
      '/projects/rhkyc/home.png',
      '/projects/rhkyc/announcement.png',
      '/projects/rhkyc/calendar.png',
      '/projects/rhkyc/sail.png',
    ],
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
    images: [
      '/projects/ailex/home.png',
      '/projects/ailex/dashboard.png',
      '/projects/ailex/featuers.png',
      '/projects/ailex/content_creator_page.png',
      '/projects/ailex/persona_agent.png',
      '/projects/ailex/customer_service_agent.png',
      '/projects/ailex/clients_quote.png',
    ],
  },
];
