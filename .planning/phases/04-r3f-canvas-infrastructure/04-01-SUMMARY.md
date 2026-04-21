---
phase: 04-r3f-canvas-infrastructure
plan: "01"
subsystem: canvas-infrastructure
tags:
  - r3f
  - nanostores
  - canvas
  - drei
  - three
dependency_graph:
  requires:
    - "Phase 1 scaffold (packages installed)"
    - "Phase 3 (public/draco/ binaries)"
  provides:
    - "@/stores — $gpuTier, $scrollProgress, $sceneReady atoms"
    - "SceneCanvas R3F island — single WebGL surface"
    - "View.Port — multi-scene Drei port ready for Phase 5"
  affects:
    - "Phase 5 (mounts model into this Canvas)"
    - "Phase 6 (writes $scrollProgress, calls invalidate())"
    - "Phase 10 (writes $gpuTier)"
tech_stack:
  added: []
  patterns:
    - "nanostores atom<T> for typed cross-island state"
    - "R3F frameloop=demand + inner-component useThree() for invalidate()"
    - "Drei View.Port for multi-scene rendering without multiple canvases"
    - "Module-level side effect for useGLTF.setDecoderPath"
key_files:
  created:
    - src/stores/sceneStore.ts
    - src/stores/index.ts
    - src/components/canvas/SceneCanvas.tsx
  modified: []
decisions:
  - "Import order sorted alphabetically per Biome organizeImports rule (@react-three/drei before @react-three/fiber)"
  - "client:only comments in JSDoc retained as documentation — not a runtime directive"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-22"
  tasks_completed: 2
  files_created: 3
---

# Phase 4 Plan 01: nanostores Store Setup + SceneCanvas R3F Island Summary

**One-liner:** Typed nanostores atoms for cross-island state + R3F `<Canvas>` island with `frameloop="demand"`, `View.Port`, and module-level Draco decoder init.

---

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create nanostores atoms and barrel export | `3d5589f` | `src/stores/sceneStore.ts`, `src/stores/index.ts` |
| 2 | Create SceneCanvas R3F island | `dfb4e32` | `src/components/canvas/SceneCanvas.tsx` |

---

## Verification Results

### Task 1 — Store atoms
- ✅ `$gpuTier = atom<number>(0)` — GPU tier from detect-gpu (Phase 10)
- ✅ `$scrollProgress = atom<number>(0)` — normalised scroll [0,1] (Phase 6)
- ✅ `$sceneReady = atom<boolean>(false)` — model load gate (Phase 5)
- ✅ `src/stores/index.ts` barrel: `export * from './sceneStore'`
- ✅ No `atom<any>` usage — all atoms typed

### Task 2 — SceneCanvas
- ✅ `frameloop="demand"` — renders only on `invalidate()` calls (SCENE-006)
- ✅ `dpr={[1, 2]}` — full quality, Phase 10 will gate for mid-tier
- ✅ `gl={{ antialias: true, alpha: true }}` — transparent canvas, body zinc-950 shows through
- ✅ `performance={{ min: 0.5 }}` — R3F adaptive DPR built-in
- ✅ `<View.Port />` inside Canvas — Phase 5+ multi-scene Drei View regions ready
- ✅ `useGLTF.setDecoderPath('/draco/')` at module level (before any component function)
- ✅ `CanvasInit` inner component calls `useThree().invalidate()` in `useEffect`
- ✅ No `client:only` directive in `.tsx` (belongs in `index.astro` — Plan 02)
- ✅ No OrbitControls (forbidden by AGENTS.md)
- ✅ No background color on canvas

### bun run check
- ✅ **Biome check:** `Checked 6 files in 5ms. No fixes applied.` — passes cleanly
- ⚠️ **astro check:** OOM crash (heap exhausted) — **pre-existing issue**, confirmed present on baseline commit before this plan's files were added. Not caused by new files. TypeScript correctness verified via Biome + manual type review.

---

## Package Versions Used

| Package | Version |
|---------|---------|
| `@react-three/fiber` | 9.6.0 |
| `@react-three/drei` | 10.7.7 |
| `three` | 0.176.0 |
| `@types/three` | 0.184.0 |
| `nanostores` | 1.3.0 |
| `@nanostores/react` | 1.1.0 |

---

## TypeScript Issues Hit

None. Files are clean TypeScript with no type errors. The `useGLTF.setDecoderPath` call at module scope is a valid API (Drei v10 exposes it as a static method on the hook). `useThree()` used only in `CanvasInit` (inner component inside `<Canvas>`) — not in `SceneCanvas` itself.

---

## `useGLTF.setDecoderPath` Module Scope Confirmation

The call `useGLTF.setDecoderPath('/draco/')` is on **line 20** of `SceneCanvas.tsx`, after the import statements and before any function/component declaration. This is module-level execution — runs once when the module is first imported by the browser, guaranteed to fire before any `useGLTF()` call can execute.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Lint] Fixed Biome organizeImports violation**
- **Found during:** Task 2 (biome check)
- **Issue:** `@react-three/fiber` import appeared before `@react-three/drei` — Biome requires alphabetical import ordering.
- **Fix:** Swapped import order: `@react-three/drei` → `@react-three/fiber` → `react`
- **Files modified:** `src/components/canvas/SceneCanvas.tsx`
- **Impact:** Zero functional change — import order only.

---

## Known Stubs

None. This plan creates infrastructure-only files. No UI rendering, no data flows, no placeholder text. The `ambientLight` placeholder is intentional (documented in code comments) and expected to be replaced in Phase 5 — it is not a data stub, it's a dev-visibility aid.

---

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced. Trust boundaries match `<threat_model>` in plan: module-level `setDecoderPath` uses static `/draco/` path (no user input); atoms hold ephemeral UI state with no security boundary.

---

## Self-Check

### Files exist:

- `src/stores/sceneStore.ts` — FOUND
- `src/stores/index.ts` — FOUND
- `src/components/canvas/SceneCanvas.tsx` — FOUND

### Commits exist:

- `3d5589f` feat(04-01): add nanostores cross-island state atoms — FOUND
- `dfb4e32` feat(04-01): add SceneCanvas R3F island — FOUND

## Self-Check: PASSED
