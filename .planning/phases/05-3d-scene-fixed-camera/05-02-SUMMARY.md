---
phase: 05-3d-scene-fixed-camera
plan: "02"
subsystem: canvas
tags:
  - r3f
  - astro
  - integration
  - scene
  - drei
  - view

dependency_graph:
  requires:
    - "05-01 (GameSetupScene.tsx + SceneView.tsx components created)"
    - "04-canvas-infrastructure (SceneCanvas.tsx with View.Port, frameloop=demand)"
  provides:
    - "SceneView wired into index.astro hero section with tracking div"
    - "Phase 4 placeholder ambientLight removed from SceneCanvas.tsx"
    - "Full hero section with hero-canvas-view DOM tracking element"
    - "bunx astro build exits 0 with all Phase 5 components integrated"
  affects:
    - "Phase 6 (scroll animation reads CAMERA_POSITION/TARGET from GameSetupScene)"
    - "Human visual verification of camera angle before Phase 6 planning"

tech_stack:
  added: []
  patterns:
    - "SceneView mounted as client:only='react' island outside Canvas in index.astro"
    - "DOM tracking div (absolute inset-0 pointer-events-none) in hero section for Drei View scissor"
    - "Phase 4 placeholder light removal pattern — lighting rig migrated to scene component"

key_files:
  created: []
  modified:
    - path: "src/components/canvas/SceneCanvas.tsx"
      description: "Removed Phase 4 placeholder <ambientLight intensity={0.5} /> — real lighting rig now in GameSetupScene"
    - path: "src/pages/index.astro"
      description: "Added SceneView import, hero-canvas-view tracking div, and SceneView island with client:only='react'"
    - path: "src/components/canvas/GameSetupScene.tsx"
      description: "Fixed useProgress sub-path import from nonexistent misc/ to correct core/Progress.js (Rule 3 auto-fix)"

decisions:
  - "SceneView mounted as Astro island (client:only='react') inside the hero section — NOT inside SceneCanvas.tsx — because it renders outside the Canvas DOM but communicates via Drei View/ViewPort scissor mechanism"
  - "useProgress import corrected from @react-three/drei/misc/useProgress.js to @react-three/drei/core/Progress.js — the misc/ subdirectory does not exist in this version of drei"
  - "Tracking div placed before content div in DOM order to ensure hero text renders above the canvas region without z-index changes"

requirements-completed:
  - SCENE-004
  - SCENE-005
  - PERF-002

metrics:
  duration: "~5 minutes"
  completed: "2026-04-22"
  tasks_completed: 1
  tasks_total: 2
  files_created: 0
  files_modified: 3
---

# Phase 5 Plan 02: SceneView Integration into index.astro Summary

**SceneView island wired into hero section with tracking div, Phase 4 placeholder light removed, useProgress sub-path import corrected — `bunx astro build` exits 0 with full Phase 5 integration.**

---

## Performance

- **Duration:** ~5 minutes
- **Started:** 2026-04-22T06:32:00Z
- **Completed:** 2026-04-22T06:33:30Z
- **Tasks completed:** 1/2 (Task 2 is checkpoint:human-verify — awaiting visual verification)
- **Files modified:** 3

---

## Accomplishments

- Phase 4 placeholder `<ambientLight intensity={0.5} />` removed from `SceneCanvas.tsx` — real 3-light rig now active in `GameSetupScene.tsx`
- Hero section in `index.astro` now has `<div id="hero-canvas-view" class="absolute inset-0 pointer-events-none" />` tracking element and `<SceneView client:only="react" trackId="hero-canvas-view" />` island
- Auto-fixed broken `useProgress` import path in `GameSetupScene.tsx` (`misc/useProgress.js` → `core/Progress.js`) — production build was failing
- `bunx astro build` exits 0: 363 modules transformed, 1 page built, no TypeScript errors

---

## Task Commits

1. **Task 1: Wire SceneView into index.astro and SceneCanvas** - `bdfc0e9` (feat)

**Plan metadata:** (pending — see final commit after checkpoint approval)

---

## Files Created/Modified

- `src/components/canvas/SceneCanvas.tsx` — Removed `<ambientLight intensity={0.5} />` placeholder and its comment block; `View.Port` + `CanvasInit` unchanged
- `src/pages/index.astro` — Added `SceneView` import in frontmatter; added `hero-canvas-view` div and `<SceneView>` island at top of hero section
- `src/components/canvas/GameSetupScene.tsx` — Fixed `useProgress` import path from `@react-three/drei/misc/useProgress.js` to `@react-three/drei/core/Progress.js`

---

## Decisions Made

- SceneView is mounted as an Astro island (`client:only="react"`) directly in the hero section, outside the Canvas DOM. It communicates with the `<View.Port>` inside `SceneCanvas` via Drei's scissor mechanism — no second Canvas created.
- The tracking div (`absolute inset-0 pointer-events-none`) is placed before the content div in DOM order so hero text naturally renders above the 3D region without z-index changes.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed useProgress sub-path import path in GameSetupScene.tsx**
- **Found during:** Task 1 (build verification — `bunx astro build`)
- **Issue:** `@react-three/drei/misc/useProgress.js` was used in `GameSetupScene.tsx` (Plan 01 output), but `node_modules/@react-three/drei/misc/` does not exist. Rollup failed to resolve the import, blocking the client bundle build.
- **Fix:** Changed import to `@react-three/drei/core/Progress.js` — the correct sub-path where `useProgress` is exported in this version of drei
- **Files modified:** `src/components/canvas/GameSetupScene.tsx`
- **Verification:** `bunx astro build` exits 0 after fix (363 modules, no errors)
- **Committed in:** `bdfc0e9` (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking import)
**Impact on plan:** Necessary correctness fix. The drei sub-path layout (`core/`, `web/`) was established in Phase 4, but `misc/` was used incorrectly in Plan 01's `GameSetupScene.tsx`. Fixed in this plan.

---

## Issues Encountered

- `@react-three/drei/misc/` does not exist: drei organizes exports into `core/` (shared), `web/` (browser-specific), `native/` (React Native). `useProgress` lives in `core/Progress.js`. The `misc/` path was a planner assumption that was incorrect.

---

## Build Verification

```
bunx biome check --no-errors-on-unmatched src → 0 errors (8 files checked)
bunx astro build → exits 0 (363 modules, 1 page, no TypeScript errors)
```

Build warnings present but not errors:
- CSS `[file:lines]` esbuild minify warning — pre-existing, not caused by Phase 5
- Rollup chunk size warning (View.YT7JK9YX.js 927 kB) — pre-existing Three.js/R3F bundle, not a build error

---

## Final Camera Constants

Values are unchanged from Plan 01 (pending human visual verification at checkpoint):

```ts
export const CAMERA_POSITION: [number, number, number] = [8, 6, 10];
export const CAMERA_TARGET: [number, number, number] = [1.2, 2.5, -0.7];
export const CAMERA_FOV = 45;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR  = 100;
```

These constants are Phase 6 animation start points. They must be confirmed at the human checkpoint before Phase 6 planning begins. If camera tuning is needed, constants will be updated in `GameSetupScene.tsx`.

---

## Human Checkpoint Status

**Task 2 is a `checkpoint:human-verify` gate.** Visual verification is required in the browser:
- Model visible behind hero text at reference camera angle (image.png)
- `LOADING... n%` pixel-font indicator appears on slow networks
- No orbit/interaction (static scene)
- Hero text readable above 3D canvas
- Zero console errors

See `05-VERIFICATION.md` for the complete verification checklist.

---

## User Setup Required

None — no external service configuration required.

---

## Next Phase Readiness

- Phase 6 can proceed once the human checkpoint is approved and camera constants are confirmed
- `CAMERA_POSITION`, `CAMERA_TARGET`, `CAMERA_FOV` are exported from `GameSetupScene.tsx` and ready for Phase 6 imports
- Any camera constant adjustments made during visual verification must be committed before Phase 6 planning

---

## Known Stubs

None. All components are wired with real data sources:
- `useGLTF` loads from real model path `/models/gaming_setup_v12.glb`
- `useProgress` reads real Draco decode progress from drei
- `$sceneReady` writes to real nanostores atom
- `SceneView` tracks real DOM element via `document.getElementById('hero-canvas-view')`

---

## Threat Flags

No new security-relevant surface beyond plan's threat model. No new network endpoints, auth paths, or user-controlled input introduced.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/components/canvas/SceneCanvas.tsx` no longer contains `ambientLight intensity={0.5}` | ✓ VERIFIED |
| `src/pages/index.astro` contains `hero-canvas-view` div | ✓ VERIFIED |
| `src/pages/index.astro` contains `SceneView client:only="react"` | ✓ VERIFIED |
| `src/components/canvas/GameSetupScene.tsx` uses `@react-three/drei/core/Progress.js` | ✓ VERIFIED |
| Commit `bdfc0e9` exists | ✓ FOUND |
| `bunx astro build` exits 0 | ✓ VERIFIED |

---
*Phase: 05-3d-scene-fixed-camera*
*Completed: 2026-04-22 (checkpoint pending)*
