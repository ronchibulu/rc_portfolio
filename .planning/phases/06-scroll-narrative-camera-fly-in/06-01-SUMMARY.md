# Plan 06-01 Summary — GSAP ScrollTrigger Camera Fly-In Hook

**Status:** Complete  
**Commit:** feb59c4

## What Was Done

Updated `src/components/canvas/GameSetupScene.tsx`:

- Registered `ScrollTrigger`, `useGSAP` at module level with `ScrollTrigger.config({ ignoreMobileResize: true })`
- Added `CAMERA_END_POSITION [1.8, 3.6, 3.2]` and `CAMERA_END_TARGET [0.5, 3.3, -0.5]` exported constants
- `useGSAP()` hook: `scrub:true` tween writes `cameraProgress.current.value` [0→1]; reduced-motion guard skips setup
- `onUpdate`: calls `$scrollProgress.set(self.progress)` and `invalidate()` each frame
- `useFrame`: reads `cameraProgress.current.value`, lerps `camera.position` and `camera.lookAt` between start/end vectors
- `THREE.Vector3` instances allocated at module level (no per-frame GC)

## Acceptance Criteria Status

- [x] `useGSAP` from `@gsap/react`, no raw `useEffect`
- [x] `ScrollTrigger.config({ ignoreMobileResize: true })` at module level
- [x] GSAP writes ref, `useFrame` reads ref (Pitfall §9)
- [x] `invalidate()` from `onUpdate`
- [x] `$scrollProgress.set()` from `onUpdate`
- [x] Reduced-motion guard
- [x] `CAMERA_END_POSITION` / `CAMERA_END_TARGET` exported
- [x] THREE.Vector3 outside `useFrame`
- [x] `bunx astro build` exits 0
