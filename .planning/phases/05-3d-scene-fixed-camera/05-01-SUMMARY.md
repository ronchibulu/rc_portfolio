---
phase: 05-3d-scene-fixed-camera
plan: "01"
subsystem: canvas
tags:
  - r3f
  - three
  - drei
  - gltf
  - scene
dependency_graph:
  requires:
    - "04-canvas-infrastructure (SceneCanvas.tsx, $sceneReady atom, sub-path import pattern)"
    - "03-asset-pipeline (gaming_setup_v12.glb, /draco/ decoder binaries)"
  provides:
    - "CAMERA_POSITION, CAMERA_TARGET, CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR — Phase 6 animation start points"
    - "GameSetupScene — R3F scene with model + camera + lights + sceneReady signal"
    - "SceneView — Drei View wrapper for hero section DOM tracking"
    - "SceneLoader — exported Suspense fallback for .glb fetch progress"
  affects:
    - "Phase 6 (imports camera constants as animation start points)"
    - "Phase 5 Plan 02 (wires SceneView into index.astro)"
tech_stack:
  added: []
  patterns:
    - "Drei sub-path imports (@react-three/drei/core/*, /web/*, /misc/*) — avoids barrel 504"
    - "useGLTF.preload at module level — fires before first render (SCENE-005/PERF-002)"
    - "Suspense + SceneLoader (Html center + useProgress) — demand-mode loading UX"
    - "frameloop=demand + single invalidate() after model load — static scene pattern"
key_files:
  created:
    - path: "src/components/canvas/GameSetupScene.tsx"
      lines: 93
      description: "R3F scene: model + PerspectiveCamera + 3-light rig + SceneLoader Suspense fallback + $sceneReady side effect"
    - path: "src/components/canvas/SceneView.tsx"
      lines: 45
      description: "Drei <View> wrapper tracking a DOM element by ID; wraps children in Suspense with SceneLoader fallback"
  modified: []
decisions:
  - "SceneLoader exported as named export from GameSetupScene.tsx (not a separate file) to avoid circular dependency with SceneView importing it"
  - "SceneView ref initialized synchronously via document.getElementById(trackId) with typeof guard — safe because component mounts client:only='react'"
  - "Biome auto-fix applied to both files for import ordering and spacing — no logic changes"
metrics:
  duration: "~2 minutes"
  completed: "2026-04-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 5 Plan 01: GameSetupScene + SceneView Components Summary

**One-liner:** Fixed-camera R3F scene with Draco GLTF model, 3-light purple rig, Suspense loading UX, and exported camera constants for Phase 6 animation.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create GameSetupScene.tsx | `a4123a8` | `src/components/canvas/GameSetupScene.tsx` (93 lines) |
| 2 | Create SceneView.tsx | `4f5fb77` | `src/components/canvas/SceneView.tsx` (45 lines) |

---

## Verification Results

### Biome lint
- `bunx biome check --no-errors-on-unmatched src/components/canvas/GameSetupScene.tsx` → **0 errors**
- `bunx biome check --no-errors-on-unmatched src/components/canvas/SceneView.tsx src/components/canvas/GameSetupScene.tsx` → **0 errors**

### Build
- `bunx astro build` → **exits 0** — 339 modules transformed, 1 page built, no TypeScript errors
- Chunk size warning (`SceneCanvas.BabLamXM.js 932 kB`) — pre-existing three.js/R3F bundle, not a build error

### Verification grep checks
1. `useGLTF.preload('/models/gaming_setup_v12.glb')` — present at module level (line 38) ✓
2. `setDecoderPath` — appears only in JSDoc comment ("Do NOT call..."), no functional call ✓
3. `orbit` — appears only in JSDoc comment ("Do NOT add orbit controls..."), no functional code ✓
4. No barrel `@react-three/drei` imports anywhere in either file ✓
5. All 5 camera constants exported before component declaration ✓
6. `$sceneReady.set(true)` pattern present in GameSetupScene useEffect ✓
7. `document.getElementById(trackId)` pattern present in SceneView ✓
8. `invalidate()` called in useEffect after model load ✓

---

## Must-Have Truths Status

| Truth | Status |
|-------|--------|
| CAMERA_POSITION, CAMERA_TARGET, CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR exported | ✓ |
| Pixel-font loading percentage in LOADING... {N}% format | ✓ |
| 3-light rig: ambient #1a0a2e + directional #b8a0ff + directional #6040ff exact values | ✓ |
| SceneView wraps Drei `<View track={ref}>` where ref = document.getElementById(trackId) | ✓ |
| $sceneReady.set(true) + invalidate() after model resolves | ✓ |
| useGLTF.preload at module level before component | ✓ |

**Truths: 6/6**

---

## Deviations from Plan

### Auto-fixes (Rule 1)

**1. [Rule 1 - Style] Biome import ordering auto-fix applied to both files**
- **Found during:** Task 1 and Task 2 lint checks
- **Issue:** Biome requires imports sorted alphabetically by module specifier; initial write had manual alignment spacing that also failed formatter
- **Fix:** `bunx biome check --fix` applied automatically — reordered imports and removed manual alignment spaces
- **Files modified:** `src/components/canvas/GameSetupScene.tsx`, `src/components/canvas/SceneView.tsx`
- **Impact:** Zero logic changes; JSDoc block comment position shifted (cosmetic); all contract requirements preserved

No other deviations. Plan executed as written.

---

## Known Stubs

None. Both components are complete with wired data:
- `useGLTF` loads from real model path `/models/gaming_setup_v12.glb`
- `useProgress` reads real Draco decode progress
- `$sceneReady` writes to real nanostores atom

These components are not yet integrated into `index.astro` — that is Plan 02's scope, intentionally deferred.

---

## Threat Flags

No new security-relevant surface beyond plan's threat model. `trackId` remains a static string literal authored in Astro template.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/components/canvas/GameSetupScene.tsx` exists | ✓ FOUND |
| `src/components/canvas/SceneView.tsx` exists | ✓ FOUND |
| Commit `a4123a8` exists | ✓ FOUND |
| Commit `4f5fb77` exists | ✓ FOUND |
