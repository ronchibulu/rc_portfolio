# Requirements — Frontend Portfolio

**Owner:** Ronald Cheng
**Target role:** Web Specialist (Frontend)
**Stack:** Astro.js + React 19 islands + R3F + GSAP + Motion + Tailwind v4 + Shadcn
**Deploy:** Vercel static

Each requirement has a stable REQ-ID. Roadmap phases reference these IDs. Traceability column filled in after roadmap generation.

---

## v1 — Must Ship

### Foundation (FND)

| ID | Requirement | Phase |
|----|-------------|-------|
| FND-001 | Astro v5 static project scaffold with React 19 integration and Vercel static adapter | — |
| FND-002 | Tailwind v4 CSS-first config with `@import "tailwindcss"` and `@theme {}` tokens; `applyBaseStyles: false` | — |
| FND-003 | Shadcn/ui initialized with `@/` tsconfig alias; globals.css imported in root layout only | — |
| FND-004 | Press Start 2P font self-hosted via `@fontsource/press-start-2p` | — |
| FND-005 | Dark palette tokens in `@theme {}`: bg `zinc-950`, surface `zinc-900`/`zinc-800`, text `zinc-100`, accent `green-400`/`lime-400`, highlight `yellow-400`, border `zinc-700`, muted `zinc-500` | — |
| FND-006 | Nav header with Projects / About / Contact anchors | — |
| FND-007 | Footer with LinkedIn URL + email link | — |
| FND-008 | Responsive at 375 / 768 / 1024 / 1920 using Tailwind min-width (`sm:` 375, `md:` 768, `lg:` 1024, `2xl:` 1920) | — |
| FND-009 | Only default Tailwind scale classes — no arbitrary values like `pt-[50px]` | — |

### Hero (HERO)

| ID | Requirement | Phase |
|----|-------------|-------|
| HERO-001 | Hero section visible within first viewport; name + role render without waiting for JS | — |
| HERO-002 | Typing animation: "Hi, I'm Ronald." → role line → crafted tagline, sequenced | — |
| HERO-003 | Scroll cue (subtle down arrow or equivalent) at hero bottom | — |
| HERO-004 | Typing animation disabled under `prefers-reduced-motion` | — |

### 3D Scene (SCENE)

| ID | Requirement | Phase |
|----|-------------|-------|
| SCENE-001 | gaming_setup_v12.glb optimized via gltf-transform (Draco + WebP) to < 2 MB before commit | — |
| SCENE-002 | Optimized `.glb` served from `/public/models/`; Draco decoder self-hosted at `/public/draco/` | — |
| SCENE-003 | R3F Canvas mounted via `client:only="react"` as single fixed full-viewport canvas with Drei `<View.Port>` | — |
| SCENE-004 | Initial camera angle matches reference `image.png`; no orbit controls on initial view | — |
| SCENE-005 | `useGLTF.preload()` at module level; Suspense + Drei `<Html>` loading fallback with `useProgress` | — |
| SCENE-006 | `<Canvas frameloop="demand">`; `invalidate()` called from GSAP ticker during active scroll | — |

### Scroll Narrative (SCROLL)

| ID | Requirement | Phase |
|----|-------------|-------|
| SCROLL-001 | GSAP ScrollTrigger is the sole scroll driver (no Drei `ScrollControls`) | — |
| SCROLL-002 | GSAP setup uses `@gsap/react` `useGSAP()` hook — no raw `useEffect` for ScrollTrigger | — |
| SCROLL-003 | Camera fly-in pinned to one viewport; `scrub: true` ties camera to scroll position | — |
| SCROLL-004 | Camera animation writes to a plain-JS ref; `useFrame` reads ref and mutates camera (single-writer rule) | — |
| SCROLL-005 | Tagline text overlays fade in/out in step with scroll position during scene section | — |
| SCROLL-006 | Hard cut from camera reaching monitor → OS screen (no slow fade) | — |
| SCROLL-007 | `ScrollTrigger.config({ ignoreMobileResize: true })`; `100dvh` used in place of `100vh`; debounced `ScrollTrigger.refresh()` on resize | — |
| SCROLL-008 | All ScrollTrigger registration gated by `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` | — |

### OS Screen (OS)

| ID | Requirement | Phase |
|----|-------------|-------|
| OS-001 | Retro OS-style screen appears after camera fly-in | — |
| OS-002 | Retro-grid or dot-grid background + subtle CSS scanline overlay | — |
| OS-003 | Desktop grid shows Projects folder and About Me folder icons | — |
| OS-004 | Folder grid responsive: 3–4 cols desktop, 2 cols tablet, 1–2 cols mobile | — |
| OS-005 | Folder tap targets ≥ 44×44 px on mobile | — |
| OS-006 | Single-click (not double-click) to open folders — reliable on touch | — |
| OS-007 | Title-bar-styled Shadcn Dialog with close button and scrollable content area | — |
| OS-008 | Dialog focus trap + Escape-to-close (Shadcn default) | — |
| OS-009 | Mobile dialog renders as full-screen bottom sheet pattern, not centered modal | — |

### Projects (PROJ)

| ID | Requirement | Phase |
|----|-------------|-------|
| PROJ-001 | Projects folder opens grid of 11 subfolders (one per project) | — |
| PROJ-002 | Each project dialog contains: name, live URL (opens new tab), description, image slider, tech badge tags | — |
| PROJ-003 | Live URLs correct and functional for all 11 projects | — |
| PROJ-004 | Image slider has keyboard prev/next, `aria-label` per image, labelled arrow buttons | — |
| PROJ-005 | Tech badges use consistent styling and dark palette tokens | — |
| PROJ-006 | Project screenshots served from `/public/projects/<slug>/` | — |

### About Me (ABOUT)

| ID | Requirement | Phase |
|----|-------------|-------|
| ABOUT-001 | About Me folder opens dialog with scrollable vertical timeline | — |
| ABOUT-002 | Timeline contains 2 company blocks: UDS Data Systems Limited, Hypthon | — |
| ABOUT-003 | Hypthon block groups 3 titles in chronological order: Web Developer (Apr 2022–Oct 2023), Full-Stack Developer (Oct 2023–Apr 2025), Senior Full-Stack Developer — AI Innovation (Apr 2025–Dec 2025) | — |
| ABOUT-004 | Each timeline entry animates in on scroll (Framer Motion) | — |
| ABOUT-005 | Timeline entry shows period, title, employer, highlight bullets | — |
| ABOUT-006 | `useReducedMotion()` bypasses entry animations when user prefers reduced motion | — |

### Mobile & Accessibility (MOBILE)

| ID | Requirement | Phase |
|----|-------------|-------|
| MOBILE-001 | `detect-gpu` tier check; low-tier / mobile renders static PNG fallback + skips camera fly-in | — |
| MOBILE-002 | Canvas `dpr={[1, 1.5]}` on mid-tier devices | — |
| MOBILE-003 | Mobile viewport replaces pinned scroll narrative with vertical stack of static sections | — |
| MOBILE-004 | All scroll-scrub / typing / fade animations respect `prefers-reduced-motion` | — |
| MOBILE-005 | No layout breakage at 375 / 768 / 1024 / 1920 viewports | — |

### Performance (PERF)

| ID | Requirement | Phase |
|----|-------------|-------|
| PERF-001 | Canvas space reserved in layout to eliminate CLS on hydration | — |
| PERF-002 | FCP does not block on .glb fetch (model loads async with Suspense fallback) | — |
| PERF-003 | No scroll jank during camera fly-in (maintains ≥ 50 FPS on mid-tier laptop) | — |
| PERF-004 | Optimized `.glb` under 2 MB | — |

### Deploy (DEPLOY)

| ID | Requirement | Phase |
|----|-------------|-------|
| DEPLOY-001 | `astro.config.mjs` with `output: 'static'` + `@astrojs/vercel` adapter | — |
| DEPLOY-002 | Vercel deployment reachable at a public URL; all project URLs clickable from production | — |
| DEPLOY-003 | `robots.txt` or equivalent allowing search engines (no noindex) | — |

---

## v2 — Deferred

(Nothing committed to v2 yet. Add here as scope emerges post-ship.)

---

## Out of Scope (Explicitly Excluded)

| Exclusion | Reason |
|-----------|--------|
| Backend / SSR | Static export only; no server routes needed |
| Auth / user accounts | Not needed for a portfolio |
| Blog section | Not in v1 |
| Resume PDF download | Not requested |
| Dark / light mode toggle | Dark-only by design |
| Orbit controls on hero model | Breaks the curated camera story |
| Auto-playing audio, cursor trails, fake loading percentages | Gimmicks that hurt UX |
| Parallax on every section | Dilutes the focal 3D scroll effect |
| Resume PDF iframe | Breaks on mobile |
| Multiple WebGL canvases | Hits browser context limit; degrades perf |
| Drei `<ScrollControls>` | Conflicts with GSAP ScrollTrigger |

---

## Traceability

Populated after ROADMAP.md generation. Each phase will reference its covered REQ-IDs; this table flips to show REQ-ID → phase coverage.

---

## Evolution

- v1 requirements set 2026-04-21 during `/gsd:new-project` initialization
- Research sources: `.planning/research/SUMMARY.md` (+ STACK, FEATURES, ARCHITECTURE, PITFALLS)
- Requirements may split / merge during `/gsd-discuss-phase` — update here and re-run traceability
