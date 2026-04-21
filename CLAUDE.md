# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project

Dark pixel/8-bit retro frontend portfolio for Ronald Cheng (Senior Full-Stack Developer targeting Web Specialist — Frontend roles). Astro v5 static site with React 19 islands, R3F v9 + Three.js, GSAP ScrollTrigger + `@gsap/react`, Motion v12, Tailwind v4, Shadcn. Deploys to Vercel as static output.

The site tells a scroll-driven story: hero typing intro → fixed-angle 3D gaming setup scene (`gaming_setup_v12.glb`) → scroll-triggered camera fly-in toward the monitor → hard cut to retro OS screen with Projects (11 entries) and About Me folders.

## Planning Artifacts (Source of Truth)

- `.planning/PROJECT.md` — What this is, requirements status, constraints, key decisions
- `.planning/REQUIREMENTS.md` — v1 REQ-IDs (FND/HERO/SCENE/SCROLL/OS/PROJ/ABOUT/MOBILE/PERF/DEPLOY) with phase traceability
- `.planning/ROADMAP.md` — 11-phase breakdown with dependency graph
- `.planning/STATE.md` — Current milestone + phase status
- `.planning/research/SUMMARY.md` — Synthesized research (stack, architecture, features, pitfalls)
- `.planning/research/{STACK,FEATURES,ARCHITECTURE,PITFALLS}.md` — Full research docs

Always read relevant planning docs before implementation. `STATE.md` tells you which phase is active.

## Stack (Locked)

| Concern | Choice |
|---------|--------|
| Framework | Astro v5 static (`output: 'static'`, `@astrojs/vercel`) |
| UI runtime | React 19 islands, `@astrojs/react` v4 |
| 3D | `three@^0.176`, `@react-three/fiber@^9`, `@react-three/drei@^10` |
| Scroll | `gsap@^3.12` + `@gsap/react` `useGSAP()` hook only |
| Animation | `motion@^12` (import `motion/react`) |
| Styling | Tailwind v4 (`@tailwindcss/vite`, CSS-first `@theme {}`) |
| Components | Shadcn/ui with `@/*` tsconfig alias |
| State | `nanostores` + `@nanostores/react` for cross-island state |
| Font | `@fontsource/press-start-2p` (self-hosted) |
| Device tier | `detect-gpu` `getGPUTier()` |

## Hard Rules

- **No arbitrary Tailwind values.** No `pt-[50px]`, no `bg-[#ff00ff]`. Default scale only.
- **Dark mode only.** No light/dark toggle.
- **R3F islands use `client:only="react"`** — never `client:load` or `client:visible` for Canvas.
- **GSAP via `useGSAP()` only.** No raw `useEffect` for ScrollTrigger (Strict Mode double-init).
- **One scroll driver: GSAP ScrollTrigger.** No Drei `<ScrollControls>`.
- **Single fixed canvas** with Drei `<View>` + `<View.Port>`. Never multiple canvases.
- **GSAP writes refs, `useFrame` writes Three.js objects.** Single-writer to scene graph.
- **`frameloop="demand"`** on `<Canvas>`. Call `invalidate()` from GSAP ticker during scroll.
- **No orbit controls** on hero scene — camera is curated.
- **`.glb` must be < 2 MB** after gltf-transform (Draco + WebP).
- **`100dvh` not `100vh`**; `ScrollTrigger.config({ ignoreMobileResize: true })`.
- **All scroll/typing/fade animations respect `prefers-reduced-motion`.**
- **Mobile / low-GPU tier renders static PNG fallback** — skips camera fly-in.
- **Responsive targets: 375 / 768 / 1024 / 1920** using Tailwind min-width breakpoints.

## Color Palette (Default Tailwind)

- Bg: `zinc-950` / `black`
- Surface: `zinc-900`, `zinc-800`
- Primary text: `zinc-100`
- Border: `zinc-700`
- Muted: `zinc-500`
- CRT accent: `purple-400` / `violet-400` (D-28 — retro dark+purple theme)
- Highlight: `yellow-400`

## Responsive Breakpoints (min-width)

- `sm:` 375px+ (mobile)
- `md:` 768px+ (tablet portrait)
- `lg:` 1024px+ (tablet landscape / small desktop)
- `2xl:` 1920px+ (large desktop)

## Setup

_Commands populated once Phase 1 scaffold lands. Expected:_

```bash
npm install
npm run dev      # Astro dev server
npm run build    # Static build to dist/
npm run preview  # Serve dist/ locally
```

## Workflow

GSD-managed project. Do not skip phases or change scope without using the corresponding slash commands:

- `/gsd-discuss-phase <n>` — refine a phase before planning
- `/gsd-plan-phase <n>` — produce executable plan
- `/gsd-execute-phase <n>` — run the plan
- `/gsd-transition` — phase boundary update
- `/gsd-complete-milestone` — milestone wrap-up

## UI/UX

All design decisions run through the `ui-ux-pro-max` skill.
