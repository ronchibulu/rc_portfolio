# Roadmap — Frontend Portfolio

**Owner:** Ronald Cheng
**Target:** Production-ready dark pixel/8-bit portfolio deployed to Vercel
**Source requirements:** `.planning/REQUIREMENTS.md`
**Source research:** `.planning/research/SUMMARY.md`

Phases are sequenced by dependency order. Strict gating: a phase cannot start until its predecessor's success criteria are met. Parallelizable work within a phase is called out.

---

## Phase 1 — Scaffold & Design System

**Goal:** A running Astro site with the pixel/8-bit design system wired up. No content, no 3D, no animation — just a styled blank shell.

**Covers REQs:** FND-001, FND-002, FND-003, FND-004, FND-005, FND-008, FND-009

**Work:**
- Astro v5 project init with React 19 integration + Vercel static adapter
- Tailwind v4 CSS-first config; theme tokens in `@theme {}` (zinc-950/900/800, zinc-100, green-400, yellow-400, zinc-700, zinc-500)
- `tsconfig.json` `@/*` path alias FIRST → restart dev server → Shadcn init
- Import globals.css once in root `Layout.astro`; `tailwind({ applyBaseStyles: false })`
- `@fontsource/press-start-2p` installed and wired to `--font-pixel`
- Tailwind v3→v4 audit of generated Shadcn classes (`shadow`→`shadow-sm`, `rounded`→`rounded-sm`, `outline-none`→`outline-hidden`, `ring`→`ring-3`)
- Responsive breakpoint sanity check at 375 / 768 / 1024 / 1920 on an empty page

**Success criteria:**
- `npm run dev` serves a styled page at zinc-950 background
- Shadcn `<Button>` renders with correct spacing, rounding, focus ring
- Press Start 2P visible on a test heading
- No console errors; no Tailwind purge warnings
- Build (`npm run build`) produces a static `dist/` directory

---

## Phase 2 — Layout, Nav, Footer, Hero (Static + Typing)

**Goal:** Ship-able landing page skeleton — hero with typing animation, nav, footer — before touching any 3D.

**Covers REQs:** FND-006, FND-007, HERO-001, HERO-002, HERO-003, HERO-004

**Work:**
- Nav header: Projects / About / Contact, retro styled
- Footer: LinkedIn URL (https://www.linkedin.com/in/ronald-cheng-833038257) + email (ronald1122323@gmail.com)
- Hero section with typing animation ("Hi, I'm Ronald." → role → tagline)
- SmoothUI or custom typing component — picks during discuss-phase
- Scroll cue at hero bottom (subtle down arrow)
- `prefers-reduced-motion` gate disables typing sequence

**Dependencies:** Phase 1 complete.

**Success criteria:**
- Hero renders correctly at 375 / 768 / 1024 / 1920
- Typing animation plays once per load (no loop)
- Reduced-motion: typing disabled, final text visible immediately
- Nav anchors in place (targets stubbed; real sections land in later phases)
- Footer links open LinkedIn / mail client

---

## Phase 3 — Asset Optimization Pipeline

**Goal:** The `gaming_setup_v12.glb` file is production-ready: compressed, textures optimized, served from `/public/models/`, Draco decoder self-hosted.

**Covers REQs:** SCENE-001, SCENE-002, PERF-004

**Work:**
- Run `gltf-transform optimize gaming_setup_v12.glb ... --compress draco --texture-compress webp --dedupe --prune`
- Measure: input size, output size, polygon count
- If output > 2 MB: open in Blender, merge static meshes, re-export, retry
- Copy Draco decoder binaries to `/public/draco/`
- Commit optimized `.glb` to `/public/models/gaming_setup_v12.glb`
- Document optimization steps in README or a `scripts/optimize-model.sh`

**Dependencies:** None strictly; can run in parallel with Phase 2. Must complete before Phase 5.

**Success criteria:**
- `/public/models/gaming_setup_v12.glb` < 2 MB
- `/public/draco/` contains decoder binaries (`draco_decoder.wasm`, `draco_wasm_wrapper.js`, etc.)
- Model visually intact — no missing meshes or textures (sanity-check in any glTF viewer)

---

## Phase 4 — R3F Canvas Infrastructure

**Goal:** A fixed-position full-viewport R3F canvas mounted via `client:only="react"` with `<View.Port>` ready to host scenes. Nanostores wired for cross-island state.

**Covers REQs:** SCENE-003, SCENE-006, FND (cross-island plumbing)

**Work:**
- Install `three @react-three/fiber @react-three/drei @gsap/react gsap nanostores @nanostores/react detect-gpu`
- Root layout renders `<Canvas client:only="react" frameloop="demand" style="position:fixed;inset:0;pointer-events:none">` with `<View.Port />`
- `src/stores/portfolio.ts` with `scrollProgress` atom and `activeSection` atom
- Reserve canvas space via CSS so hydration does not cause CLS
- `gsap.registerPlugin(ScrollTrigger, useGSAP)` at module level in a shared init file
- `useGLTF.setDecoderPath('/draco/')` at app init

**Dependencies:** Phase 1 complete; Phase 3 not strictly required but recommended (faster local dev with optimized asset).

**Success criteria:**
- Canvas mounts without hydration errors; no CLS in DevTools
- `frameloop="demand"` confirmed (GPU at 0% when idle, no Three.js draw calls in idle frame)
- Nanostores readable from two separate React islands
- No Strict Mode double-init warnings

---

## Phase 5 — 3D Scene + Fixed Camera

**Goal:** Gaming setup model loads, displays at reference camera angle (per `image.png`), with Suspense loading UX. No animation yet — static render.

**Covers REQs:** SCENE-004, SCENE-005

**Work:**
- `GamingSetupScene` component using `useGLTF('/models/gaming_setup_v12.glb')`
- `useGLTF.preload(...)` at module level
- Suspense boundary + Drei `<Html>` fallback driven by `useProgress`
- Camera position/rotation tuned to match reference image — manually adjust until visual parity
- `<View>` in the scene section maps to a DOM box; scroll behavior not wired yet
- No `OrbitControls`

**Dependencies:** Phase 3 (optimized asset) + Phase 4 (canvas infra).

**Success criteria:**
- Model loads on page load with visible loading indicator during fetch
- At scroll position = scene section top, view matches `image.png` reference
- No orbit/drag/rotate available to user
- Time-to-interactive for scene < 3s on fast 3G throttling

---

## Phase 6 — Scroll Narrative + Camera Fly-In

**Goal:** The core differentiator — scroll-driven camera fly-in from reference angle to monitor screen, with taglines fading in on scroll, followed by hard cut to OS screen placeholder.

**Covers REQs:** SCROLL-001, SCROLL-002, SCROLL-003, SCROLL-004, SCROLL-005, SCROLL-006, SCROLL-007, SCROLL-008, HERO-003

**Work:**
- Scene section: `height: 200vh`, inner `<View>` with `position: sticky; top: 0; height: 100dvh`
- `useGSAP()` hook registers ScrollTrigger that writes progress to a ref
- `useFrame` reads progress ref → interpolates camera position + target
- Tagline overlay text fades in/out keyed to ScrollTrigger progress thresholds
- Hard cut at progress ≈ 1.0: hide 3D view, reveal OS screen placeholder instantly
- `gsap.matchMedia()` guard: skip all scroll scrub under `prefers-reduced-motion`
- `ScrollTrigger.config({ ignoreMobileResize: true })`; `100dvh` throughout; debounced resize `ScrollTrigger.refresh()`
- Tune camera keyframes against the actual optimized model (not placeholder)

**Dependencies:** Phase 5 complete.

**Success criteria:**
- Scroll through scene section → camera smoothly approaches monitor
- No scroll jank at 60 FPS on mid-tier laptop
- Hard cut feels like "entering the monitor" — no slow fade
- Reduced-motion: no scrub, static view, immediate transition to OS screen
- No double-init warnings in dev Strict Mode
- iOS Safari: no scroll jumps when address bar toggles

---

## Phase 7 — OS Screen Shell

**Goal:** Retro OS desktop shell with Projects + About Me folder icons, retro-grid background, scanline overlay, responsive grid.

**Covers REQs:** OS-001, OS-002, OS-003, OS-004, OS-005, OS-006, SCENE (hard-cut destination)

**Work:**
- OS screen section mounted `client:visible` React island
- Retro-grid background (magicui.design component or equivalent inline SVG/CSS)
- CSS scanline overlay via `repeating-linear-gradient`
- Fake OS title bar: name + pixel clock + fake minimize/close buttons (non-functional, decorative)
- Responsive folder grid: 3–4 cols at `lg:`+, 2 cols at `md:`, 1–2 cols at `sm:`
- Folder icon component with pixel-font label, single-click open, ≥ 44×44 px tap target
- Two folders wired: Projects, About Me — clicks stubbed to `console.log` for now

**Dependencies:** Phase 6 (hard-cut destination must render when scene ends).

**Success criteria:**
- OS screen appears instantly at end of camera fly-in
- Folder grid responsive at all four breakpoints
- Keyboard Tab cycles folder icons; Enter opens (stubbed handler)
- Single click opens on touch (no double-tap requirement)

---

## Phase 8 — Project Dialogs + Image Slider

**Goal:** 11 project dialogs, each with name / live URL / description / image slider / tech badges. Shadcn Dialog with focus trap; mobile renders as bottom sheet.

**Covers REQs:** OS-007, OS-008, OS-009, PROJ-001, PROJ-002, PROJ-003, PROJ-004, PROJ-005, PROJ-006

**Work:**
- Shadcn Dialog primitive styled as OS window (title bar, close button, scrollable content area)
- Project data module (`src/data/projects.ts`) — the 11 projects from PROJECT.md with name, URL, description, images[], tech[]
- Image slider component (embla-carousel or custom) with `aria-label` per image, keyboard prev/next, labelled arrow buttons
- Tech badge component with dark palette tokens
- Click Projects folder → subfolder grid of 11 project icons → click subfolder → open dialog
- Mobile: dialog renders as full-screen bottom sheet (Shadcn Drawer pattern)
- Project screenshots from `/public/projects/<slug>/` — verify all 11 slug dirs have images

**Dependencies:** Phase 7 complete.

**Success criteria:**
- All 11 project URLs clickable and correct
- Image slider keyboard-accessible; screen-reader labels correct
- Dialog focus trap works; Escape closes; background does not scroll
- Mobile bottom-sheet variant renders at `sm:`
- Tech badges visible at-a-glance on every card

---

## Phase 9 — About Me Timeline

**Goal:** About Me dialog with scroll-animated vertical timeline. 2 company blocks (UDS + Hypthon with 3 grouped titles).

**Covers REQs:** ABOUT-001, ABOUT-002, ABOUT-003, ABOUT-004, ABOUT-005, ABOUT-006

**Work:**
- About Me dialog opens from About Me folder
- Timeline data module with 2 companies; Hypthon contains ordered array of 3 titles
- Framer Motion `motion/react` scroll-triggered entry animations per timeline entry
- Each entry: period, title, employer (only on first of grouped titles), highlight bullets
- `useReducedMotion()` skips entry animations
- Dialog content scrolls independently of body

**Dependencies:** Phase 7 complete (dialog primitive available). Can run in parallel with Phase 8.

**Success criteria:**
- Timeline renders 4 entries (1 UDS + 3 Hypthon under one company block)
- Entries animate in as user scrolls within the dialog
- Reduced-motion: entries visible immediately without animation
- Mobile: timeline readable at 375 px

---

## Phase 10 — Mobile & Reduced-Motion Fallback Tiers

**Goal:** Device-tier gating — low-end devices and mobile replace 3D fly-in with a static PNG and stacked sections.

**Covers REQs:** MOBILE-001, MOBILE-002, MOBILE-003, MOBILE-004, MOBILE-005, HERO-004, ABOUT-006, SCROLL-008

**Work:**
- `detect-gpu` `getGPUTier()` at app init; store tier in nanostores
- Tier-gated render: tier ≥ 2 + non-mobile → full R3F; tier 1 → `dpr={[1, 1.5]}` reduced-texture mode; tier 0 / mobile → static PNG fallback + CSS parallax, skip camera fly-in
- Static PNG fallback: use reference `image.png` as the hero visual
- Mobile layout swap: pinned scroll narrative replaced by vertical stack of static sections (hero → static scene image → OS screen stacked inline)
- Audit every animation under reduced-motion: typing, scroll scrub, tagline fades, timeline entries, Motion enters
- Visual regression check at 375 / 768 / 1024 / 1920

**Dependencies:** All prior content phases complete.

**Success criteria:**
- Mid-tier mobile (e.g., iPhone 12 mini) maintains ≥ 50 FPS during scroll
- Low-tier / old mobile renders static PNG with no WebGL context
- Reduced-motion setting disables every animation
- No layout breakage at any of the four target viewports

---

## Phase 11 — Performance Pass + Deploy

**Goal:** Production Vercel deploy with verified Lighthouse budgets.

**Covers REQs:** PERF-001, PERF-002, PERF-003, DEPLOY-001, DEPLOY-002, DEPLOY-003

**Work:**
- Lighthouse audit on production build; target LCP < 2.5s, CLS < 0.1 on mid-tier mobile
- Verify no CLS from canvas hydration (reserved space working as intended)
- Confirm Suspense loading UX does not block FCP
- Verify scroll FPS ≥ 50 on mid-tier hardware
- `robots.txt` allowing crawlers; meta tags for social sharing (OG title/description/image)
- Deploy to Vercel via `@astrojs/vercel` adapter
- Smoke-test all 11 project URLs + LinkedIn + email link on production

**Dependencies:** Phase 10 complete.

**Success criteria:**
- Public Vercel URL returns 200 at all section anchors
- Lighthouse: Performance ≥ 90 on desktop, ≥ 75 on mobile (realistic for a 3D scene)
- No console errors in production
- All external links functional (11 projects + LinkedIn + email)

---

## Phase Dependency Graph

```
1 Scaffold
   └─ 2 Layout/Hero
   └─ 3 Asset Pipeline    (parallel with 2)
        └─ 4 R3F Canvas Infra
             └─ 5 Scene + Camera
                  └─ 6 Scroll Fly-in
                       └─ 7 OS Shell
                            ├─ 8 Project Dialogs
                            └─ 9 About Timeline   (parallel with 8)
                                 └─ 10 Mobile/A11y Tiers
                                      └─ 11 Perf + Deploy
```

---

## Requirement → Phase Traceability

| REQ-ID | Phase |
|--------|-------|
| FND-001 | 1 |
| FND-002 | 1 |
| FND-003 | 1 |
| FND-004 | 1 |
| FND-005 | 1 |
| FND-006 | 2 |
| FND-007 | 2 |
| FND-008 | 1 |
| FND-009 | 1 |
| HERO-001 | 2 |
| HERO-002 | 2 |
| HERO-003 | 2, 6 |
| HERO-004 | 2, 10 |
| SCENE-001 | 3 |
| SCENE-002 | 3 |
| SCENE-003 | 4 |
| SCENE-004 | 5 |
| SCENE-005 | 5 |
| SCENE-006 | 4 |
| SCROLL-001 | 6 |
| SCROLL-002 | 6 |
| SCROLL-003 | 6 |
| SCROLL-004 | 6 |
| SCROLL-005 | 6 |
| SCROLL-006 | 6 |
| SCROLL-007 | 6 |
| SCROLL-008 | 6, 10 |
| OS-001 | 7 |
| OS-002 | 7 |
| OS-003 | 7 |
| OS-004 | 7 |
| OS-005 | 7 |
| OS-006 | 7 |
| OS-007 | 8 |
| OS-008 | 8 |
| OS-009 | 8 |
| PROJ-001 | 8 |
| PROJ-002 | 8 |
| PROJ-003 | 8 |
| PROJ-004 | 8 |
| PROJ-005 | 8 |
| PROJ-006 | 8 |
| ABOUT-001 | 9 |
| ABOUT-002 | 9 |
| ABOUT-003 | 9 |
| ABOUT-004 | 9 |
| ABOUT-005 | 9 |
| ABOUT-006 | 9, 10 |
| MOBILE-001 | 10 |
| MOBILE-002 | 10 |
| MOBILE-003 | 10 |
| MOBILE-004 | 10 |
| MOBILE-005 | 10 |
| PERF-001 | 4, 11 |
| PERF-002 | 5, 11 |
| PERF-003 | 6, 11 |
| PERF-004 | 3 |
| DEPLOY-001 | 11 |
| DEPLOY-002 | 11 |
| DEPLOY-003 | 11 |
