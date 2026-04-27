/**
 * Phase 9 — Employment timeline data.
 *
 * Per PROJECT.md §Employment timeline (most recent company first):
 *  - Hypthon: 3 titles grouped under one company block (Apr 2022 – Dec 2025)
 *  - UDS Data Systems Limited (May 2021 – Mar 2022)
 *
 * Two company blocks. Companies and entries are sorted by date descending
 * (most recent first).
 */

export interface TimelineEntry {
  period: string;
  title: string;
  highlights: string[];
}

export interface CompanyBlock {
  company: string;
  /** When the company block spans multiple roles, show the combined range */
  periodRange: string;
  entries: TimelineEntry[];
}

export const TIMELINE: CompanyBlock[] = [
  {
    company: 'Pints AI',
    periodRange: 'Mar 2026 – Present',
    entries: [
      {
        period: 'Mar 2026 – Present',
        title: 'Senior Software Engineer',
        highlights: [
          'Developed the technical product end-to-end across frontend and backend, delivering core modules that serve 100+ enterprise users.',
          'Architected, implemented, and oversaw AI/ML model training pipelines and deployment workflows, including production-level release processes, reducing model deployment time by 90%.',
          'Designed and planned software architecture, wrote unit tests, and supported User Acceptance Testing (UAT) as required.',
          'Assisted in project management and, where assigned, mentored/supervised team members and conducted code reviews.',
          'Built and implemented AIOps for BEA, and developed an in-house AI solution platform to manage, build, and deploy AI agents at production scale, reducing agent deployment time by 90%.',
        ],
      },
    ],
  },
  {
    company: 'Hypthon',
    periodRange: 'Apr 2022 – Dec 2025',
    entries: [
      {
        period: 'Apr 2025 – Dec 2025',
        title: 'Senior Full-Stack Developer — AI Innovation',
        highlights: [
          'Mentored 2+ junior developers per project, drove architectural decisions for scalable AI-infused systems serving 10+ enterprise clients, and delivered 10+ production projects.',
          'Led innovation initiatives for AI-enhanced web/mobile platforms, focusing on productivity tools, content generation, and data-driven decision-making that improved client workflow efficiency by 50%.',
          'Developed AI SaaS platform for enterprise-level chatbots, marketing AI agents and more using LangGraph, LangChain, and LangSmith in Python and Next.js, while managing the full Agile SDLC process.',
        ],
      },
      {
        period: 'Oct 2023 – Apr 2025',
        title: 'Full-Stack Developer',
        highlights: [
          'Full-stack development with cloud-based solutions for 10+ clients across multiple sectors using backend frameworks such as Laravel, .NET, FastAPI, and Next.js.',
          'End-to-end project delivery, including writing technical documents, requirement analysis, coding, testing, deployment, and post-launch optimisations.',
          'Led the migration and standardisation of CI/CD workflows across GitLab CI/CD and GitHub Actions, automating builds and deployments to multi-cloud (AWS + Azure) and cutting deployment time by 80%.',
        ],
      },
      {
        period: 'Apr 2022 – Oct 2023',
        title: 'Web Developer',
        highlights: [
          'Front-end development for 10+ client websites across property, insurance, banking and other sectors — delivering responsive, user-centric interfaces and achieving 95+ Lighthouse performance scores on key pages.',
          'Implemented frontend layouts with a range of frameworks, including React, TypeScript, Angular, Vue, and Tailwind CSS.',
        ],
      },
    ],
  },
  {
    company: 'UDS Data Systems Limited',
    periodRange: 'May 2021 – Mar 2022',
    entries: [
      {
        period: 'May 2021 – Mar 2022',
        title: 'Software Engineer & Web Developer',
        highlights: [
          'Implemented multiple company websites in PHP for both internal and tutorial use cases.',
          'Developed a cybersecurity training platform using Ansible, Apache, and related tooling.',
          'Handled disparate project documentation, including design specifications and technical write-ups.',
        ],
      },
    ],
  },
];

/**
 * Flattened slide list consumed by the animated About view.
 *
 * Derives from `TIMELINE`, preserving its (descending-by-date) order: each
 * company's entries are emitted in turn, with the parent company carried
 * along so the animated card can stamp the company name above the title.
 */
export interface JobSlide {
  /** Company the role was at. */
  company: string;
  /** Role-specific period (e.g. "Apr 2025 – Dec 2025"). */
  period: string;
  /** Job title. */
  title: string;
  /** Bullet highlights — same shape as TimelineEntry.highlights. */
  highlights: string[];
}

export const JOBS: JobSlide[] = TIMELINE.flatMap((block) =>
  block.entries.map((entry) => ({
    company: block.company,
    period: entry.period,
    title: entry.title,
    highlights: entry.highlights,
  })),
);
