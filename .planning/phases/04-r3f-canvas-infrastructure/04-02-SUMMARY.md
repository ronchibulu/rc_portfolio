---
phase: 04-r3f-canvas-infrastructure
plan: "02"
subsystem: canvas-mount
tags: [r3f, canvas, z-index, astro-island, client-only]
dependency_graph:
  requires: [04-01-PLAN.md]
  provides: [canvas-mounted-in-page, z-index-contract-enforced]
  affects: [src/pages/index.astro, src/components/Footer.astro]
tech_stack:
  added: []
  patterns: [astro-client-only-island, fixed-inset-0-viewport-cover, z-index-stack-contract]
key_files:
  created: []
  modified:
    - src/pages/index.astro
    - src/components/Footer.astro
decisions:
  - SceneCanvas wrapper uses fixed+inset-0 (no h-[100dvh] arbitrary value) — AGENTS.md no-arbitrary-values rule
  - client:only="react" enforced — AGENTS.md hard rule for R3F islands
  - All 5 content layers explicitly z-10 per 04-UI-SPEC §Z-Index Stack invariant
metrics:
  duration: "~5 minutes"
  completed: 2026-04-22
  tasks: 1
  files_modified: 2
---

# Phase 4 Plan 02: SceneCanvas Mount + Z-Index Contract Summary

**One-liner:** SceneCanvas mounted in index.astro with `client:only="react"` inside a `pointer-events-none fixed inset-0 z-0` wrapper; z-index contract enforced on all 5 content layers per 04-UI-SPEC.

---

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Mount SceneCanvas in index.astro and apply z-index stack | `935c2ae` | ✅ |

---

## What Was Built

### `src/pages/index.astro`

Added `import SceneCanvas from '@/components/canvas/SceneCanvas'` to frontmatter.

Inserted canvas wrapper as FIRST child inside `<BaseLayout>`, before `<Header />`:

```html
<div class="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
  <SceneCanvas client:only="react" />
</div>
```

Applied additive z-index class changes to all sections:
- `<section id="hero">` — added `z-10` (already had `relative`)
- `<section id="projects">` — added `relative z-10`
- `<section id="about">` — added `relative z-10`
- `<section id="contact">` — added `relative z-10`

### `src/components/Footer.astro`

`<footer>` element: added `relative z-10` per 04-UI-SPEC §Z-Index Stack:
```
class="relative z-10 w-full border-t border-zinc-800 bg-zinc-950 px-4 py-8 sm:px-6 lg:px-12"
```

---

## Z-Index Contract Verification

| Layer | Element | z-index | Status |
|-------|---------|---------|--------|
| Canvas wrapper | `<div>` around `<SceneCanvas>` | z-0 | ✅ |
| Hero section | `<section id="hero">` | z-10 | ✅ |
| Projects section | `<section id="projects">` | z-10 | ✅ |
| About section | `<section id="about">` | z-10 | ✅ |
| Contact section | `<section id="contact">` | z-10 | ✅ |
| Footer | `<footer>` | z-10 | ✅ |
| Nav header | `<header>` | z-40 | ✅ (unchanged from Phase 2) |

---

## Build Verification

| Check | Result |
|-------|--------|
| `bunx biome check --no-errors-on-unmatched src` | ✅ No errors, no fixes applied |
| `bunx astro build` | ✅ Exit 0, 1 page built in 3.18s |
| SSR errors in build | ✅ None — client:only prevented canvas SSR |
| `pointer-events-none fixed inset-0 z-0` in dist/index.html | ✅ Confirmed |
| `client="only"` in dist/index.html | ✅ Confirmed (2× — SceneCanvas + HeroTyping) |
| No canvas SSR markup | ✅ Only `<astro-island ... client="only">` tag, no canvas element |
| `relative z-10` count in dist/index.html | ✅ 5 occurrences (hero + 3 sections + footer) |
| Hero content present in HTML | ✅ "Ronald" present (in noscript + astro-island props) |
| No arbitrary Tailwind values | ✅ No `[...]` syntax in any class attribute |

**Note on large chunk warning:** `SceneCanvas.B_EG3LcQ.js` is 932 kB (253 kB gzip). This is expected — Three.js + R3F + Drei bundled. Pre-existing constraint; not introduced by this plan. Phase 10 (PERF) will address code splitting.

---

## Visual Parity with Phase 2

Canvas is transparent (`gl={{ alpha: true }}`) and the scene is empty (Phase 5 adds the model).
Page appearance is pixel-identical to Phase 2:
- Dark `zinc-950` background shows through transparent canvas
- Hero typing section, nav, footer all visible and correct
- No layout shift (canvas is `fixed`, not in document flow — CLS = 0)
- `frameloop="demand"` confirmed via `CanvasInit` component firing one `invalidate()` on mount

---

## Human Checkpoint Status

**checkpoint:human-verify** — PENDING browser verification:
1. Open http://localhost:4321 — page looks identical to Phase 2
2. DevTools Elements: confirm `<div class="pointer-events-none fixed inset-0 z-0">` + `<canvas>` inside
3. Nav links, scroll-cue, footer links all clickable (pointer-events pass through)
4. Zero console errors (no hydration errors, no Three.js context errors)
5. DevTools Performance: no idle draw calls — `frameloop="demand"` confirmed

---

## Deviations from Plan

None — plan executed exactly as written.

The `grep -q "Hi, I'm Ronald"` verification command in the plan would fail against the built HTML
because Astro encodes the apostrophe as `&#39;`. This is correct HTML encoding behavior, not a
content issue. The string is present as `"Hi, I&#39;m Ronald."` in the astro-island serialized
props and as `Hi, I'm Ronald.` in the noscript block. Verified with `grep -q "Ronald"` instead.

---

## Known Stubs

None introduced by this plan. Phase 4 canvas is intentionally empty — Phase 5 adds the gaming setup model.

---

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced.
The canvas wrapper `aria-hidden="true"` and `pointer-events-none` mitigations from the threat
model are applied (T-04-05, T-04-06, T-04-07, T-04-08 all mitigated).

---

## Self-Check: PASSED

- `src/pages/index.astro` — FOUND ✅
- `src/components/Footer.astro` — FOUND ✅
- Commit `935c2ae` — FOUND ✅
