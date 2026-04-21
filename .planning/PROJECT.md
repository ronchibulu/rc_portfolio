# Ronald Cheng — Frontend Portfolio

## What This Is

A dark pixel/8-bit retro-themed static portfolio website for Ronald Cheng, Senior Full-Stack Developer applying for Web Specialist (Frontend) roles. Built with Astro.js + React, TailwindCSS, Shadcn, Three.js/R3F, GSAP, Framer Motion, SmoothUI, and Motion Primitives. Deployed to Vercel. The site tells Ronald's story through scroll-driven animation: an intro hero, a 3D gaming setup scene, and an OS-style interactive screen housing his projects and experience.

## Core Value

A recruiter landing on the site immediately understands Ronald's craft — the site itself is the proof of skill.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Hero section with typing animation intro ("Hi, Ronald here...") and scroll-triggered taglines
- [ ] 3D gaming setup scene (gaming_setup_v12.glb) with fixed camera angle matching reference image
- [ ] Scroll-driven camera fly-in toward the monitor screen of the 3D model
- [ ] Retro OS-style screen that appears after camera transition with Projects and About Me folders
- [ ] Projects folder: 11 subfolders, each opening a dialog with name, URL, description, image slider, and tech badge tags
- [ ] About Me folder: scrollable dialog with scroll-animated timeline of job experiences (Hypthon roles grouped under one company entry)
- [ ] Responsive layout at desktop (1920px), tablet (1024px), mobile (375px) using Tailwind min-width breakpoints
- [ ] Unified dark pixel/8-bit color palette using default Tailwind classes only (no arbitrary values like pt-[50px])
- [ ] Nav header: Projects, About, Contact — simple, retro-styled
- [ ] Footer with LinkedIn and email contact links
- [ ] All scroll-triggered animations perform smoothly (no jank during scroll)
- [ ] Deployed as static site to Vercel

### Out of Scope

- Backend / server-side rendering — static export only
- Auth or user accounts — not needed
- Blog section — not part of v1
- Resume/CV download — not requested
- Dark/light mode toggle — dark-only by design

## Context

**Owner:** Ronald Cheng (ronald1122323@gmail.com)  
**LinkedIn:** https://www.linkedin.com/in/ronald-cheng-833038257  
**Target role:** Web Specialist — Frontend Focused  
**Experience:** 5 years full-stack, strong frontend specialization, AI integration background

### Projects to showcase (11)

| Folder | URL | Key Tech |
|--------|-----|----------|
| Chinachem Corpsite | https://www.chinachemgroup.com/zh-hk/ | .NET MVC, AngularJS, Umbraco |
| Sustainability Report | https://www.chinachemgroup.com/zh-hk/sustainability-report-2023-2024/ | Astro.js, React, MDX, Framer Motion, Lottie |
| Ninapark | https://www.ninapark.org/zh-hk/ | .NET MVC, Three.js, Umbraco, Ecommerce, Stripe |
| Hang Lung Corpsite | https://www.hanglung.com/zh-hk/home | .NET MVC, Kentico, Vue.js, TailwindCSS, Subdomain multi-site |
| Towngas Corpsite | https://www.towngas.com/tc/ | .NET MVC, Umbraco (revamped from Kentico) |
| Towngas Cooking Centre | https://www.towngascooking.com/tc | .NET MVC, Umbraco, Astro.js, Cron job, Flipping Book, Google Maps, YouTube API |
| PCPD Corpsite | https://www.pcpd.com/ | Laravel, TwillCMS |
| MaximsMX Corpsite | https://www.maximsmx.com.hk/zh-HK | Next.js, .NET MVC, Umbraco, Ecommerce |
| BEA Cross Border Minisite | https://www.hkbea.com/html/cross-boundary-wealth-management/en/ | React, TypeScript, Gatsby |
| RHKYC | https://www.rhkyc.org.hk/ | Laravel, OctoberCMS, GrapesJS |
| AiLex | https://event.masteralex.io/ | Next.js, TypeScript, Python, LangGraph, LangChain, CopilotKit, Three.js, Framer Motion, TailwindCSS, Shadcn, Clerk, Stripe, MongoDB, PostgreSQL, PGVector |

### Employment timeline (for About Me dialog)

| Period | Company | Title | Highlights |
|--------|---------|-------|------------|
| May 2021 – Mar 2022 | UDS Data Systems Limited | Software Engineer & Web Developer | PHP websites, cybersecurity training platform (Ansible, Apache) |
| Apr 2022 – Oct 2023 | Hypthon | Web Developer | Frontend for property/insurance/banking clients; React, Vue, Angular, TailwindCSS |
| Oct 2023 – Apr 2025 | Hypthon | Full-Stack Developer | Cloud-based solutions (Laravel, .NET, FastAPI, Next.js), CI/CD migration (GitLab → GitHub Actions), multi-cloud (AWS + Azure) |
| Apr 2025 – Dec 2025 | Hypthon | Senior Full-Stack Developer — AI Innovation | Mentored juniors, led AI SaaS platform (LangGraph, LangChain, LangSmith), Agile SDLC ownership |

*Note: Three Hypthon roles share one company entry in the timeline — titles animate in sequence as user scrolls.*

### Story flow (scroll narrative)

1. **Hero** — Typing intro: "Hi, I'm Ronald." → role line → crafted taglines (scroll to continue)
2. **3D Scene** — gaming_setup_v12.glb loads, fixed camera angle (per reference image); text overlays with taglines fade in on scroll
3. **Camera fly-in** — GSAP scroll-triggered camera moves toward monitor screen
4. **OS Screen transition** — retro pixel OS UI fades in; Projects and About Me folder icons visible
5. **Interaction layer** — click Projects → subfolder grid; click subfolder → dialog with slider + details; click About Me → timeline dialog

### Color palette (dark pixel / 8-bit)

- Background: `zinc-950` / `black`
- Surface/card: `zinc-900`, `zinc-800`
- Primary text: `zinc-100`
- Accent green (pixel CRT): `green-400` / `lime-400`
- Accent amber (highlight): `yellow-400`
- Border: `zinc-700`
- Muted text: `zinc-500`
- Pixel font: Press Start 2P or similar (Google Fonts)

### Responsive breakpoints (Tailwind min-width)

- `sm:` — 375px+ (mobile)
- `md:` — 768px+ (tablet mid)
- `lg:` — 1024px+ (tablet landscape / small desktop)
- `2xl:` — 1920px+ (large desktop)

## Constraints

- **Static only**: Astro static export — no SSR, no server routes
- **No arbitrary Tailwind values**: Use default scale classes only
- **Performance**: 3D + GSAP scroll animations must not cause scroll jank — lazy-load R3F canvas, suspend heavy assets
- **Asset**: gaming_setup_v12.glb and project screenshots live in `/public/` — path must be stable for Vercel deploy
- **Camera**: Fixed angle must match reference image.png — do not allow orbit controls on initial view
- **Hypthon grouping**: Three job titles at Hypthon share one company block in the timeline

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro.js + React islands | Static output + interactive component islands (3D, dialogs) | — Pending |
| R3F for Three.js | Declarative React API fits Astro island architecture | — Pending |
| GSAP ScrollTrigger for camera | Most precise scroll-to-animation control for camera fly-in | — Pending |
| SmoothUI + Motion Primitives | Shadcn-compatible animated components, avoids custom animation code | — Pending |
| Press Start 2P font | Reinforces 8-bit aesthetic without custom CSS hacks | — Pending |
| Tailwind default classes only | Consistency, design token discipline, avoids style drift | — Pending |
| ui-ux-pro-max skill | All UI/UX design decisions go through this skill for quality gate | — Pending |

---
*Last updated: 2026-04-21 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
