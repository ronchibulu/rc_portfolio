/**
 * Phase 9 — Employment timeline data.
 *
 * Per PROJECT.md §Employment timeline:
 *  - UDS Data Systems Limited (May 2021 – Mar 2022)
 *  - Hypthon: 3 titles grouped under one company block (Apr 2022 – Dec 2025)
 *
 * Two company blocks. Hypthon groups 3 titles in chronological order.
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
    company: 'UDS Data Systems Limited',
    periodRange: 'May 2021 – Mar 2022',
    entries: [
      {
        period: 'May 2021 – Mar 2022',
        title: 'Software Engineer & Web Developer',
        highlights: [
          'Built and maintained PHP-based websites for enterprise clients',
          'Developed cybersecurity training platform using Ansible and Apache',
          'Delivered full-stack solutions in agile team environment',
        ],
      },
    ],
  },
  {
    company: 'Hypthon',
    periodRange: 'Apr 2022 – Dec 2025',
    entries: [
      {
        period: 'Apr 2022 – Oct 2023',
        title: 'Web Developer',
        highlights: [
          'Delivered frontend for property, insurance, and banking clients',
          'Built interactive UIs with React, Vue, Angular, and TailwindCSS',
          'Led cross-browser a11y audits and performance optimisations',
        ],
      },
      {
        period: 'Oct 2023 – Apr 2025',
        title: 'Full-Stack Developer',
        highlights: [
          'Cloud-based solutions with Laravel, .NET, FastAPI, and Next.js',
          'Migrated CI/CD pipelines from GitLab to GitHub Actions',
          'Multi-cloud deployments across AWS + Azure',
        ],
      },
      {
        period: 'Apr 2025 – Dec 2025',
        title: 'Senior Full-Stack Developer — AI Innovation',
        highlights: [
          'Mentored junior developers and owned Agile SDLC ceremonies',
          'Led AI SaaS platform with LangGraph, LangChain, and LangSmith',
          'Architected multi-agent orchestration and RAG pipelines',
        ],
      },
    ],
  },
];
