---
phase: 5
slug: 3d-scene-fixed-camera
status: draft
shadcn_initialized: true
preset: nova (radix) — inherited from Phase 1 (unchanged)
created: 2026-04-22
---

# Phase 5 — UI Design Contract (Scene Contract)

> Infrastructure + visual spec. No new typography/spacing decisions — all inherited from Phase 2.
> This document locks the **camera, lighting, loading UX, view integration, and performance
> contracts** that Phase 6 will build upon. Every named constant here is a Phase 6 dependency.

---

## Scope

Phase 5 delivers: `GameSetupScene.tsx` (R3F scene with model + lights + camera) and `SceneView.tsx`
(Drei `<View>` wrapper). Both are wired into `index.astro` hero section. No typography, spacing,
or color decisions beyond those already locked in Phase 2.

---

## 1. Camera Contract

These values are **locked starting positions for Phase 6 animation**. Phase 6 animates FROM these.
Expose as named constants at the top of `GameSetupScene.tsx`.

```ts
export const CAMERA_POSITION: [number, number, number] = [8, 6, 10];
export const CAMERA_TARGET:   [number, number, number] = [1.2, 2.5, -0.7];
export const CAMERA_FOV = 45;        // degrees — matches perspective compression in image.png
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR  = 100;
```

| Property | Value | Source |
|----------|-------|--------|
| Camera type | `PerspectiveCamera` (Drei `<PerspectiveCamera makeDefault>`) | CONTEXT.md decisions |
| Position | `[8, 6, 10]` — upper-right, elevated, forward | image.png isometric analysis |
| LookAt target | `[1.2, 2.5, -0.7]` — center of scene bounding box | bounding box `(-4.83,2,-6.69)` to `(7.17,3.92,5.31)` |
| FOV | 45° | image.png perspective compression |
| Near / Far | 0.1 / 100 | CONTEXT.md decisions |
| Orbit controls | **FORBIDDEN** — hard rule (AGENTS.md) | SCENE-004, REQUIREMENTS.md |
| lookAt call | `camera.lookAt(new THREE.Vector3(...CAMERA_TARGET))` in `useEffect` | CONTEXT.md decisions |

> **Visual tuning note:** Constants are named so executor can iterate quickly. Do NOT hardcode
> inline. Phase 6 reads `CAMERA_POSITION` as the animation start point.

---

## 2. Lighting Contract

Match the dark purple atmosphere in `image.png`. Monitor emissive (`vscode_ide_texture`) provides
screen glow without extra lighting. Do not over-light — the moody dark is intentional.

```tsx
<ambientLight intensity={0.15} color="#1a0a2e" />
<directionalLight position={[5, 8, 5]}   intensity={1.2} color="#b8a0ff" castShadow={false} />
<directionalLight position={[-3, 4, -5]} intensity={0.4} color="#6040ff" castShadow={false} />
```

| Light | Position | Intensity | Color | Purpose |
|-------|----------|-----------|-------|---------|
| Ambient | global | 0.15 | `#1a0a2e` (very dark purple) | Shadow fill, no environment map overhead |
| Key directional | `[5, 8, 5]` upper-right | 1.2 | `#b8a0ff` (purple-white) | Illuminates desk surface from upper-right |
| Fill directional | `[-3, 4, -5]` upper-left | 0.4 | `#6040ff` (blue-purple) | Counter-shadow, depth |

- **No environment map** — too heavy for `frameloop="demand"` + demand invalidation pattern.
- **No shadows** (`castShadow={false}`) — shadow maps cost GPU frames on a static demand-mode scene.
- Phase 4 placeholder `<ambientLight intensity={0.5} />` is **replaced** by this rig in Phase 5.

---

## 3. Loading UX Contract

The 1.89 MB model loads asynchronously. FCP must not block on the fetch (PERF-002).

| Decision | Value |
|----------|-------|
| Suspense boundary | React `<Suspense>` wrapping `<GameSetupScene>` inside `<SceneView>` |
| Progress component | Drei `<Html>` + `useProgress` hook, sub-path: `@react-three/drei/web/Html.js` + `@react-three/drei/misc/useProgress.js` |
| Loading copy | `LOADING... {progress}%` (e.g. `LOADING... 42%`) |
| Font | `font-['Press_Start_2P']` — pixel font (inherited from Phase 2 design system) |
| Color | `text-purple-400` — CRT accent color |
| Position | Centered in the hero viewport (`<Html center>` — Drei default centering) |
| Pointer events | None (parent view is `pointer-events-none`) |
| Disappearance | Suspense unmounts fallback when model resolves; no explicit fade |

```tsx
// Suspense fallback component — in GameSetupScene.tsx or collocated SceneLoader.tsx
function SceneLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <p className="font-['Press_Start_2P'] text-xs text-purple-400 whitespace-nowrap">
        LOADING... {Math.round(progress)}%
      </p>
    </Html>
  );
}
```

---

## 4. View Integration Contract

How `<SceneView>` registers with the hero section and the Phase 4 `<View.Port>`.

```tsx
// SceneView.tsx — DOM tracking div
// Used inside the hero section in index.astro:
//   <div id="hero-canvas-view" class="absolute inset-0 pointer-events-none" />
//   <SceneView client:only="react" trackId="hero-canvas-view" />
```

| Property | Value | Rationale |
|----------|-------|-----------|
| Tracking div classes | `absolute inset-0 pointer-events-none` | Covers hero section exactly; passes pointer events to HTML text above |
| Tracking div position | Inside `<section id="hero">` which is `relative z-10` (Phase 4) | Bounds the View to hero section dimensions, not full viewport |
| `<View>` import path | `@react-three/drei/web/View.js` | Sub-path import — avoids drei barrel 504 (Phase 4 established pattern) |
| `<View track={ref}>` | ref attached to the `absolute inset-0` div | Drei tracks DOM element bounds for the View scissor region |
| `client:only` | `"react"` on `<SceneView>` — **hard rule** (AGENTS.md) | R3F islands never SSR |
| View coverage | Hero section bounds only (not full viewport) | `<View.Port>` in SceneCanvas renders each View in its scissor region |

**Z-index compatibility** (do not deviate from Phase 4 contract):

| Layer | z-index | No change from Phase 4 |
|-------|---------|------------------------|
| Canvas wrapper | `z-0` (fixed) | ✓ unchanged |
| Hero section | `z-10` (relative) | ✓ hero text remains above canvas |
| SceneView tracking div | inside `z-10` hero, `pointer-events-none` | hero HTML text at `z-10` is readable above 3D scene |

---

## 5. Performance Contract

| Rule | Value | Source |
|------|-------|--------|
| `frameloop` | `"demand"` — **must not change** | AGENTS.md hard rule / SCENE-006 |
| `useGLTF.preload()` | Called at module level in `GameSetupScene.tsx`: `useGLTF.preload('/models/gaming_setup_v12.glb')` | SCENE-005 / CONTEXT.md |
| Draco decoder path | Already set: `useGLTF.setDecoderPath('/draco/')` in `SceneCanvas.tsx` — do not re-set | Phase 4 `SceneCanvas.tsx` |
| `invalidate()` on load | Call `invalidate()` once after model resolves (via `useEffect` or `onUpdate`) to render the first static frame | CONTEXT.md performance section |
| Animation loop | **None** in Phase 5 — static scene, no `useFrame` loop | CONTEXT.md / Phase 6 owns scroll animation |
| `useFrame` usage | Not needed in Phase 5; only `useEffect` for lookAt + post-load invalidate | CONTEXT.md decisions |
| Environment map | **Excluded** — too heavy for demand mode | CONTEXT.md lighting decisions |
| Shadows | `castShadow={false}` on all lights | Avoids shadow map cost on static demand scene |

---

## 6. Hard Rules Checklist

Carried forward from AGENTS.md — executor must verify before PR:

- [ ] No orbit controls anywhere in Phase 5 code
- [ ] No second `<Canvas>` created — scene lives inside Phase 4's `<View.Port>`
- [ ] `<SceneView>` mounted with `client:only="react"` — never `client:load` or `client:visible`
- [ ] `frameloop="demand"` prop on `<Canvas>` untouched (set in Phase 4 `SceneCanvas.tsx`)
- [ ] `CAMERA_POSITION`, `CAMERA_TARGET`, `CAMERA_FOV` exported as named constants
- [ ] `useGLTF.preload('/models/gaming_setup_v12.glb')` at module level (not inside component)
- [ ] All drei sub-path imports used (no barrel `@react-three/drei` direct import)
- [ ] Phase 4 placeholder `<ambientLight intensity={0.5} />` removed from `SceneCanvas.tsx`

---

## 7. Inherited Contracts (Unchanged)

All of the following are inherited from Phase 2/4 UI-SPECs with **zero modifications**:

- Typography scale, color tokens, spacing scale, copywriting
- Z-index stack: canvas `z-0`, hero `z-10`, nav `z-40`, dialogs `z-50`
- Canvas CSS: `pointer-events-none fixed inset-0 z-0 aria-hidden="true"`
- `100dvh` (not `100vh`) on all viewport-height references
- Body `bg-zinc-950` as the visible background through transparent canvas
- Focus ring spec, reduced-motion gating (no changes in Phase 5)

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | None added in Phase 5 | not required |
| Third-party | None | not applicable |

Phase 5 uses `@react-three/drei` sub-path imports already installed in Phase 1–4. No new npm
packages or shadcn registry fetches.

---

## Checker Sign-Off

- [ ] Camera contract: position, target, FOV, near/far, no-orbit-controls — all declared
- [ ] Lighting contract: 3 lights with exact position/intensity/color, no env map, no shadows
- [ ] Loading UX: Suspense + Drei Html + useProgress + pixel font + purple-400 + copy locked
- [ ] View integration: tracking div classes, z-index compatibility, client:only rule
- [ ] Performance: frameloop demand, preload at module level, no animation loop, invalidate once
- [ ] Hard rules: all 8 checklist items present
- [ ] Phase 4 z-index contract: not contradicted anywhere in this spec
- [ ] Registry Safety: no new blocks, no third-party registries

**Approval:** pending
