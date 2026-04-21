# Roadmap: Frontend Portfolio

## Overview

Deliver a dark pixel/8-bit retro portfolio for Ronald Cheng, built on Astro v5 + React 19 islands with an R3F gaming-setup 3D scene driven by GSAP ScrollTrigger, and an interactive OS-style screen that houses 11 project dialogs plus an animated About Me timeline. Ship as static Vercel deploy. Phases progress from scaffold → static content → 3D asset pipeline → R3F infra → scene + scroll narrative → OS shell + dialogs → mobile/accessibility tiers → production deploy.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold & Design System** - Astro v5 + Tailwind v4 + Shadcn + Press Start 2P on a blank pixel-themed shell. ✓ 2026-04-22
- [ ] **Phase 2: Layout, Nav, Footer, Hero** - Static skeleton with typing hero, nav anchors, and footer contact links.
- [ ] **Phase 3: Asset Optimization Pipeline** - Produce the < 2 MB optimized gaming_setup_v12.glb with self-hosted Draco decoder.
- [ ] **Phase 4: R3F Canvas Infrastructure** - Fixed full-viewport R3F canvas with View.Port, demand frameloop, and nanostores plumbing.
- [ ] **Phase 5: 3D Scene + Fixed Camera** - Model loads with Suspense UX at the reference camera angle; no orbit controls.
- [ ] **Phase 6: Scroll Narrative + Camera Fly-In** - GSAP-driven camera fly-in, tagline fades, and hard cut to OS screen.
- [ ] **Phase 7: OS Screen Shell** - Retro OS desktop with retro-grid + scanline background and responsive folder icons.
- [ ] **Phase 8: Project Dialogs + Image Slider** - 11 project dialogs with sliders, tech badges, and mobile bottom-sheet variant.
- [ ] **Phase 9: About Me Timeline** - Scroll-animated vertical timeline dialog with grouped Hypthon titles.
- [ ] **Phase 10: Mobile & Reduced-Motion Fallback Tiers** - detect-gpu tiering, static fallback, and reduced-motion gates.
- [ ] **Phase 11: Performance Pass + Deploy** - Lighthouse tune-up and production Vercel deployment.

## Phase Details

### Phase 1: Scaffold & Design System
**Goal**: A running Astro site with the pixel/8-bit design system wired up — no content, no 3D, no animation — just a styled blank shell.
**Depends on**: Nothing (first phase)
**Requirements**: FND-001, FND-002, FND-003, FND-004, FND-005, FND-008, FND-009
**Canonical refs**: .planning/research/SUMMARY.md, .planning/research/STACK.md, .planning/research/PITFALLS.md §7, §8
**Success Criteria** (what must be TRUE):
  1. `npm run dev` serves a styled page with zinc-950 background and Press Start 2P font visible.
  2. A Shadcn Button renders with correct spacing, rounding, and focus ring using default Tailwind classes only.
  3. `npm run build` produces a static `dist/` directory with no Tailwind purge warnings or console errors.
  4. Responsive layout holds at 375 / 768 / 1024 / 1920 on an empty reference page.
**Plans**: 3 complete

Plans:
- [x] 01-01: Astro scaffold + bun + Biome/Prettier + tsconfig + build scripts (FND-001)
- [x] 01-02: Tailwind v4 @theme + BaseLayout.astro + cn helper + placeholder page (FND-002/004/005/008/009)
- [x] 01-03: Shadcn init + 9 components + smoke-test page + D-28 retro dark+purple palette (FND-003/005/008/009)

### Phase 2: Layout, Nav, Footer, Hero
**Goal**: Ship-able landing page skeleton — hero typing intro, nav, and footer — before any 3D work starts.
**Depends on**: Phase 1
**Requirements**: FND-006, FND-007, HERO-001, HERO-002, HERO-003, HERO-004
**Canonical refs**: .planning/PROJECT.md §Story flow, .planning/research/FEATURES.md
**Success Criteria** (what must be TRUE):
  1. Hero renders name, role, and tagline correctly at 375 / 768 / 1024 / 1920.
  2. Typing animation plays once per load and is disabled under `prefers-reduced-motion` with final text visible.
  3. Nav anchors Projects / About / Contact are present and scroll to their targets.
  4. Footer links open LinkedIn profile and a mail client prefilled with the user's email.
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Asset Optimization Pipeline
**Goal**: Produce a production-ready gaming_setup_v12.glb under 2 MB with self-hosted Draco decoder binaries.
**Depends on**: Nothing strictly; parallel with Phase 2. Must complete before Phase 5.
**Requirements**: SCENE-001, SCENE-002, PERF-004
**Canonical refs**: .planning/research/PITFALLS.md §5, .planning/research/ARCHITECTURE.md §.glb Asset Loading
**Success Criteria** (what must be TRUE):
  1. `/public/models/gaming_setup_v12.glb` is present and under 2 MB after gltf-transform optimization.
  2. `/public/draco/` contains the decoder binaries required by Drei `useGLTF.setDecoderPath('/draco/')`.
  3. Optimized model renders visually intact in any glTF viewer — no missing meshes or textures.
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: R3F Canvas Infrastructure
**Goal**: Fixed-position full-viewport R3F canvas mounted via `client:only="react"` with `<View.Port>` and nanostores wired for cross-island state.
**Depends on**: Phase 1. Phase 3 recommended.
**Requirements**: SCENE-003, SCENE-006, PERF-001
**Canonical refs**: .planning/research/ARCHITECTURE.md §Canvas Architecture, .planning/research/PITFALLS.md §3, §6
**Success Criteria** (what must be TRUE):
  1. Canvas mounts via `client:only="react"` with no hydration errors and zero CLS in DevTools.
  2. `frameloop="demand"` confirmed — GPU utilization is 0% when idle and no Three.js draw calls run on idle frames.
  3. `scrollProgress` and `activeSection` nanostores are readable from two separate React islands.
  4. Strict Mode does not produce duplicate GSAP registration warnings or ScrollTrigger double-init markers.
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: 3D Scene + Fixed Camera
**Goal**: Gaming setup model loads with Suspense UX and displays at the reference camera angle from `image.png`; no orbit controls.
**Depends on**: Phase 3, Phase 4
**Requirements**: SCENE-004, SCENE-005
**Canonical refs**: image.png, .planning/research/ARCHITECTURE.md §.glb Asset Loading, .planning/research/PITFALLS.md §4
**Success Criteria** (what must be TRUE):
  1. Model loads on page load with a visible loading indicator during fetch.
  2. At scroll position = scene section top, the view matches the `image.png` reference.
  3. No orbit, drag, or rotate interaction is available to the user on the hero scene.
  4. Time-to-interactive for the scene is under 3 seconds on fast 3G throttling.
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Scroll Narrative + Camera Fly-In
**Goal**: Scroll-driven camera fly-in from reference angle to the monitor, tagline fades, and hard cut to the OS screen placeholder.
**Depends on**: Phase 5
**Requirements**: SCROLL-001, SCROLL-002, SCROLL-003, SCROLL-004, SCROLL-005, SCROLL-006, SCROLL-007, SCROLL-008, HERO-003
**Canonical refs**: .planning/research/ARCHITECTURE.md §GSAP ScrollTrigger, .planning/research/PITFALLS.md §1, §2, §9, §10
**Success Criteria** (what must be TRUE):
  1. Scroll through the scene section smoothly advances the camera toward the monitor.
  2. Scroll performance holds at or above 60 FPS on a mid-tier laptop with no visible jank.
  3. A hard cut hides the 3D view and reveals the OS screen placeholder the instant the camera reaches the monitor.
  4. Under `prefers-reduced-motion`, no scroll scrub runs — the view is static and transitions directly to the OS screen.
  5. No ScrollTrigger double-init markers appear in Strict Mode dev.
  6. iOS Safari scroll animations do not jump when the address bar toggles.
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: OS Screen Shell
**Goal**: Retro OS desktop shell with Projects + About Me folder icons, retro-grid background, scanline overlay, and a responsive grid.
**Depends on**: Phase 6
**Requirements**: OS-001, OS-002, OS-003, OS-004, OS-005, OS-006
**Canonical refs**: os_screen.png, .planning/research/FEATURES.md §OS Simulator UI Patterns
**Success Criteria** (what must be TRUE):
  1. OS screen appears instantly at the end of the camera fly-in — no fade.
  2. Folder grid renders with the correct column count at 375 / 768 / 1024 / 1920.
  3. Keyboard Tab cycles through folder icons and Enter fires the (stubbed) open handler.
  4. Folder icons open on a single click or touch tap with no double-tap requirement.
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

### Phase 8: Project Dialogs + Image Slider
**Goal**: 11 project dialogs — each with name, live URL, description, image slider, and tech badges — using Shadcn Dialog (bottom sheet on mobile).
**Depends on**: Phase 7
**Requirements**: OS-007, OS-008, OS-009, PROJ-001, PROJ-002, PROJ-003, PROJ-004, PROJ-005, PROJ-006
**Canonical refs**: .planning/PROJECT.md §Projects to showcase, projects/ (image assets)
**Success Criteria** (what must be TRUE):
  1. All 11 project URLs open in a new tab and resolve to the correct production site.
  2. Image slider is keyboard-accessible with correct `aria-label` per image and labelled prev/next buttons.
  3. Dialog focus trap works, Escape closes the dialog, and the body behind does not scroll.
  4. At `sm:` breakpoints the dialog renders as a full-screen bottom sheet.
  5. Tech badges render with consistent styling on every project card.
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

### Phase 9: About Me Timeline
**Goal**: About Me dialog with a scroll-animated vertical timeline — 2 company blocks, Hypthon grouping 3 ordered titles.
**Depends on**: Phase 7 (parallel with Phase 8)
**Requirements**: ABOUT-001, ABOUT-002, ABOUT-003, ABOUT-004, ABOUT-005, ABOUT-006
**Canonical refs**: .planning/PROJECT.md §Employment timeline, Resume.docx
**Success Criteria** (what must be TRUE):
  1. Timeline renders 4 entries — 1 UDS entry and 3 Hypthon titles under one Hypthon company block.
  2. Entries animate in sequentially as the user scrolls within the dialog.
  3. Under `prefers-reduced-motion`, entries appear immediately without animation.
  4. Timeline is legible at 375 px width with no horizontal overflow.
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Mobile & Reduced-Motion Fallback Tiers
**Goal**: detect-gpu tier gating — low-end devices and mobile replace the 3D fly-in with a static PNG and stacked sections; reduced-motion respected everywhere.
**Depends on**: Phases 2–9
**Requirements**: MOBILE-001, MOBILE-002, MOBILE-003, MOBILE-004, MOBILE-005, HERO-004, ABOUT-006, SCROLL-008
**Canonical refs**: .planning/research/FEATURES.md §Mobile & Reduced Motion Strategy, .planning/research/PITFALLS.md §4
**Success Criteria** (what must be TRUE):
  1. A mid-tier mobile device maintains at least 50 FPS during scroll.
  2. Low-tier devices render the static PNG fallback with no WebGL context created.
  3. Enabling `prefers-reduced-motion` disables every scroll scrub, typing, fade, and timeline animation on the site.
  4. No layout breaks at 375 / 768 / 1024 / 1920 viewports.
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

### Phase 11: Performance Pass + Deploy
**Goal**: Production Vercel deploy with verified Lighthouse budgets and smoke-tested external links.
**Depends on**: Phase 10
**Requirements**: PERF-001, PERF-002, PERF-003, DEPLOY-001, DEPLOY-002, DEPLOY-003
**Canonical refs**: .planning/research/STACK.md §Vercel Static Deploy
**Success Criteria** (what must be TRUE):
  1. The public Vercel URL returns HTTP 200 and scrolling renders all sections without console errors.
  2. Lighthouse Performance score is at least 90 on desktop and at least 75 on mobile.
  3. All 11 project URLs plus the LinkedIn and email links are functional on production.
  4. `robots.txt` and Open Graph meta tags are present and allow crawlers (no noindex).
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold & Design System | 3/3 | ✓ Complete | 2026-04-22 |
| 2. Layout, Nav, Footer, Hero | 0/0 | Not started | - |
| 3. Asset Optimization Pipeline | 0/0 | Not started | - |
| 4. R3F Canvas Infrastructure | 0/0 | Not started | - |
| 5. 3D Scene + Fixed Camera | 0/0 | Not started | - |
| 6. Scroll Narrative + Camera Fly-In | 0/0 | Not started | - |
| 7. OS Screen Shell | 0/0 | Not started | - |
| 8. Project Dialogs + Image Slider | 0/0 | Not started | - |
| 9. About Me Timeline | 0/0 | Not started | - |
| 10. Mobile & Reduced-Motion Fallback Tiers | 0/0 | Not started | - |
| 11. Performance Pass + Deploy | 0/0 | Not started | - |
