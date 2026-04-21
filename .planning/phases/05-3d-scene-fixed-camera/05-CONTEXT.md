# Phase 5: 3D Scene + Fixed Camera - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Load `gaming_setup_v12.glb` into the R3F canvas with a Suspense loading UX. Display at the fixed camera angle matching `image.png`. No orbit controls. The model should appear behind the hero text layer (canvas z-0, hero z-10).

**In scope:**
- `src/components/canvas/GameSetupScene.tsx` — R3F scene component with model, lights, camera
- `src/components/canvas/SceneView.tsx` — Drei `<View>` wrapper that registers the scene viewport
- Wire `<SceneView>` into `index.astro` hero section (inside the hero div, tracking its bounds)
- `useGLTF.preload('/models/gaming_setup_v12.glb')` at module level
- Drei `<Suspense>` + `<Html>` loading progress indicator
- Camera: perspective, position/target matched to `image.png` reference
- Lighting: ambient + directional to match the dark purple atmosphere
- Add `<View>` region tracking to the hero section in `index.astro`

**Not in scope:**
- Camera animation (Phase 6), GSAP ScrollTrigger (Phase 6)
- OS screen (Phase 7+), orbit controls (forbidden)
- Model interaction

</domain>

<decisions>
## Implementation Decisions

### Camera angle from image.png analysis
The reference shows an **isometric perspective** looking from upper-right toward lower-left:
- Camera position: `[8, 6, 10]` (initial estimate — right of scene, elevated, forward)
- Camera target (lookAt): `[1.2, 2.5, -0.7]` (center of scene bounding box)
- Scene bounding box: min `(-4.83, 2, -6.69)`, max `(7.17, 3.92, 5.31)`
- FOV: 45 degrees (matches perspective compression in reference)
- The exact position will need visual tuning — planner/executor should expose the values as named constants at the top of the file for easy iteration

### Scene component architecture
- `GameSetupScene.tsx` — the actual R3F scene (model + lights + camera setup)
  - Uses `useGLTF` to load the model
  - Sets camera position + lookAt in a `useEffect` or via `<PerspectiveCamera>` from drei
  - Exports `useGLTF.preload('/models/gaming_setup_v12.glb')` at module level
- `SceneView.tsx` — wraps Drei `<View>` with a DOM-tracked div
  - The `<View>` element tracks the hero section's bounds
  - Used in `index.astro` hero section

### Loading UX
- Wrap model in React `<Suspense>`
- Drei `<Html>` inside Suspense fallback with `<useProgress>` percentage display
- Loading text: simple pixel-font "loading..." text in purple-400
- `useGLTF.preload()` at module level fires before any render

### Lighting matching reference image.png
The reference has:
- Very dark ambient (near-black background blends to dark purple)
- A single warm-cool point/directional light from upper-left illuminating desk surface
- Purple/violet ambient tint on shadows
- Emissive from monitor screen (already in model as vscode_ide_texture emissive map)

Lighting setup:
- `<ambientLight intensity={0.15} color="#1a0a2e" />` (very dark purple ambient)
- `<directionalLight position={[5, 8, 5]} intensity={1.2} color="#b8a0ff" />` (purple key light from upper right)
- `<directionalLight position={[-3, 4, -5]} intensity={0.4} color="#6040ff" />` (fill from upper left)
- No environment map (too heavy for demand frameloop)

### Drei View integration
- The `<View>` component from `@react-three/drei/web/View.js` (sub-path import per Phase 4 fix)
- In `index.astro` hero section: add a `<div id="hero-canvas-view">` that Drei tracks
- `SceneView` passes a ref to `<View track={ref}>` 
- `GameSetupScene` renders inside the View

### Camera component
Use Drei `<PerspectiveCamera makeDefault>` inside the View:
```tsx
<PerspectiveCamera
  makeDefault
  position={CAMERA_POSITION}
  fov={CAMERA_FOV}
  near={0.1}
  far={100}
/>
```
Then call `camera.lookAt(new THREE.Vector3(...CAMERA_TARGET))` in a `useEffect` or `useFrame`.

### Performance
- `useGLTF.preload()` at module level fires immediately
- `frameloop="demand"` — the scene renders once on load, then only on invalidate() calls
- `invalidate()` called from `CanvasInit` (Phase 4) already fires the initial frame
- No animation loop needed for Phase 5 (static camera, no scroll yet)

</decisions>

<code_context>
## Existing Code Insights

### Phase 4 canvas infrastructure
- `src/components/canvas/SceneCanvas.tsx` — Canvas is mounted, `<View.Port>` inside
  - Uses sub-path imports: `@react-three/drei/web/View.js`, `@react-three/drei/core/Gltf.js`
  - `useGLTF.setDecoderPath('/draco/')` already called at module level
  - Canvas wrapper: `pointer-events-none fixed inset-0 z-0`
  - `<CanvasInit>` fires `invalidate()` on mount

### Phase 4 stores  
- `src/stores/sceneStore.ts` — `$sceneReady: atom<boolean>(false)` — set true when model loaded

### Astro page
- `src/pages/index.astro` — hero section: `<section id="hero" class="relative z-10 flex min-h-dvh...">` 
- SceneCanvas mounted before Header with `client:only="react"`

### Key import paths (sub-path, avoids drei barrel 504)
- `@react-three/drei/web/View.js` — View component
- `@react-three/drei/core/Gltf.js` — useGLTF
- `@react-three/drei/web/Html.js` — Html for loading overlay
- `@react-three/drei/core/PerspectiveCamera.js` — PerspectiveCamera
- `@react-three/drei/misc/useProgress.js` — useProgress hook

### Model path
- `/models/gaming_setup_v12.glb` (Draco-compressed, 1.89 MB)
- Root node: `desk_spot`
- Bounding box: min `(-4.83, 2, -6.69)`, max `(7.17, 3.92, 5.31)`

</code_context>

<specifics>
## Specific Ideas

- CAMERA_POSITION and CAMERA_TARGET should be named constants at file top — executor must tune these visually
- The scene is dark with purple accent — don't add too much ambient light or it loses the moody vibe
- The monitor has an emissive texture (vscode_ide_texture) — it should glow without extra lighting
- SceneView div should be `absolute inset-0` inside the hero section so it covers the hero exactly
- The `<View>` region approach means the scene only renders in the hero viewport area, not the full canvas

</specifics>

<deferred>
## Deferred Ideas

- Camera animation / scroll-driven fly-in (Phase 6)
- Orbit controls (forbidden by AGENTS.md hard rules)
- Scene LOD / GPU tier gating (Phase 10)
- Post-processing (bloom on monitor emissive) — nice-to-have, Phase 11

</deferred>

---

*Phase: 05-3d-scene-fixed-camera*
*Context gathered: 2026-04-22 (auto, discuss skipped)*
