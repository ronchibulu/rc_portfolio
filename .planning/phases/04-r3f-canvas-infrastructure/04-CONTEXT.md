# Phase 4: R3F Canvas Infrastructure - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Mount a single fixed full-viewport R3F `<Canvas>` via `client:only="react"` in `src/pages/index.astro`. The canvas sits behind the hero content (CSS `z-index` layering). Wire `frameloop="demand"` with `invalidate()` for scroll-driven rendering. Set up Drei `<View>` + `<View.Port>` for multi-scene rendering without multiple canvases. Wire nanostores for cross-island state (`gpuTier`, `scrollProgress`). Set `useGLTF.setDecoderPath('/draco/')` at app init.

**In scope:**
- `src/components/canvas/SceneCanvas.tsx` — R3F `<Canvas>` island (`client:only="react"`)
- `src/stores/sceneStore.ts` — nanostores atoms: `$gpuTier`, `$scrollProgress`, `$sceneReady`
- `src/components/canvas/ViewPort.tsx` — `<View.Port>` wrapper component
- Mount `<SceneCanvas>` in `index.astro` behind hero (fixed, full-viewport, `z-index: 0`)
- Hero section gets `z-index: 10` relative positioning so it renders above the canvas
- `useGLTF.setDecoderPath('/draco/')` call at module level in SceneCanvas
- `frameloop="demand"` + invalidate wiring
- PERF-001: canvas space reserved (fixed position prevents CLS)

**Not in scope:**
- Actual 3D model loading (Phase 5)
- Camera fly-in / GSAP scroll animation (Phase 6)
- Lights, environment, scene content — just the empty canvas infrastructure

</domain>

<decisions>
## Implementation Decisions

### Canvas mounting strategy
- `<SceneCanvas client:only="react">` island in `index.astro`
- CSS: `position: fixed; top: 0; left: 0; width: 100%; height: 100dvh; z-index: 0`
- Hero section: `position: relative; z-index: 10` (already has `relative` from Phase 2)
- Nav header: `z-index: 40` (already sticky z-40 from Phase 2 — above canvas)

### View system
- Use Drei `<View>` + `<View.Port>` for future multi-scene support (Phase 5 model scene, Phase 6 scroll scene)
- `<View.Port>` lives inside the `<Canvas>` — renders into DOM-tracked view regions
- For Phase 4: one default `<View>` wrapping an empty group (placeholder for Phase 5)

### frameloop + invalidate
- `frameloop="demand"` on `<Canvas>` — only renders when `invalidate()` is called
- Phase 4: call `invalidate()` once after mount so initial frame renders
- Phase 6: GSAP ticker calls `invalidate()` during scroll — no changes needed here

### nanostores
- `src/stores/sceneStore.ts` with three atoms:
  - `$gpuTier` — atom<number>(0) — set in Phase 10 by detect-gpu, read in Phase 5 for LOD
  - `$scrollProgress` — atom<number>(0) — set in Phase 6 by GSAP, read by R3F useFrame
  - `$sceneReady` — atom<boolean>(false) — set true when model loaded (Phase 5)
- Export from `src/stores/index.ts` barrel

### DRACOLoader setup
- `useGLTF.setDecoderPath('/draco/')` at module top of SceneCanvas.tsx (or a dedicated setup file)
- Must run before any `useGLTF()` call — module-level side effect is correct

### TypeScript
- `@types/three` already installed (v0.184.0 per package.json)
- R3F Canvas props typed via `@react-three/fiber` exports — no extra types needed

### Performance
- `dpr={[1, 2]}` on Canvas (full quality by default; Phase 10 will gate to `[1, 1.5]` for mid-tier)
- `gl={{ antialias: true }}` default
- `performance={{ min: 0.5 }}` for adaptive DPR — R3F built-in

</decisions>

<code_context>
## Existing Code Insights

### From Phase 1-2
- `src/pages/index.astro` — `<Header>` (z-40) + `<main>` (hero/sections) + `<Footer>`
- `src/layouts/BaseLayout.astro` — sets `body` class `min-h-dvh bg-zinc-950`
- `@nanostores/react` installed, `nanostores` installed
- `@react-three/fiber@^9` installed (v9.6.0)
- `@react-three/drei@^10` installed (v10.7.7)
- `three@^0.176` installed, `@types/three` installed

### From Phase 3
- `public/models/gaming_setup_v12.glb` — 1.89 MB Draco-compressed
- `public/draco/` — decoder binaries at `/draco/`

### Canvas placement
- `index.astro` `<main>` has `relative` positioning on hero section — needs `z-index: 10`
- Canvas island goes BEFORE `<Header>` in DOM order (or use absolute/fixed separately)
- Simpler: mount SceneCanvas as a `<div class="fixed inset-0 z-0">` sibling outside `<main>` in BaseLayout

### Import paths
- `@/*` alias resolves to `src/*` — use `@/stores/sceneStore` etc.

</code_context>

<specifics>
## Specific Ideas

- Create `src/stores/` directory with `sceneStore.ts` and barrel `index.ts`
- Canvas wrapper div: `<div class="pointer-events-none fixed inset-0 z-0">` — `pointer-events-none` so mouse events pass through to the hero/nav
- In Phase 6 the scroll cue and nav should still receive pointer events — canvas must not capture them
- `<View track={heroRef}>` pattern from Drei docs — Phase 5 will add the actual view tracking; Phase 4 just mounts the empty infrastructure

</specifics>

<deferred>
## Deferred Ideas

- Actual scene content (Phase 5)
- detect-gpu integration (Phase 10)
- Scroll-based invalidate from GSAP ticker (Phase 6)
- OrbitControls (explicitly forbidden by hard rules)
- Multiple canvases (forbidden — single canvas + View)

</deferred>

---

*Phase: 04-r3f-canvas-infrastructure*
*Context gathered: 2026-04-22 (auto, discuss skipped)*
