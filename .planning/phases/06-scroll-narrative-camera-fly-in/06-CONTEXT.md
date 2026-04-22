# Phase 6: Scroll Narrative + Camera Fly-In - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Scroll-driven camera fly-in from reference angle to the monitor face, GSAP ScrollTrigger driving tagline text fades, and a hard cut to the OS screen placeholder the instant the camera reaches the monitor. No Drei ScrollControls. GSAP ScrollTrigger is the single scroll authority.

Deliverables:
1. A pinned scroll section (≈ 1 viewport tall) where scrolling moves the camera from CAMERA_POSITION toward the monitor screen
2. Tagline overlays that fade in/out on scroll above the 3D scene
3. Hard-cut transition: at scroll completion, hide the 3D hero section and reveal the OS screen section instantly (no fade)
4. `prefers-reduced-motion` path: no scrub runs, view stays static, transitions directly to OS screen
5. `$scrollProgress` nanostore updated each frame; `invalidate()` called from GSAP ticker during active scroll

</domain>

<decisions>
## Implementation Decisions

### GSAP + R3F Integration
- Use `useGSAP()` from `@gsap/react` exclusively — no raw `useEffect` for ScrollTrigger (AGENTS.md hard rule, Pitfall §2)
- GSAP writes to a plain JS progress ref (`cameraProgress.current = value`); `useFrame` reads it and applies to camera (Pitfall §9 single-writer rule)
- `ScrollTrigger.config({ ignoreMobileResize: true })` set at init (AGENTS.md + Pitfall §10)
- `scrub: true` (not numeric) on the camera tween — no lag/catch-up artifacts (ARCHITECTURE.md)
- Pin the hero scene section for the fly-in duration; unpin after hard cut

### Camera Keyframes
- Start: `CAMERA_POSITION` = [6, 6, 8] (imported from GameSetupScene.tsx)
- End: camera zoomed toward monitor face — approximately [1.5, 3.5, 2.5] (close to monitor screen center)
- Target: interpolate `camera.lookAt` toward monitor face [0.5, 3.3, -0.5] at end
- Ease: `power2.inOut` for smooth deceleration into monitor

### Tagline Fades
- Two tagline lines above the scene: "Full-Stack Developer" fade-in at ~30% scroll, fade-out at ~80%
- Implemented as DOM overlays (z-10) with GSAP opacity tweens on the same timeline
- Font: `font-pixel text-purple-400` consistent with hero palette

### Hard Cut Transition
- At 100% scroll progress: add CSS class `hidden` / set `display:none` on hero section
- Reveal OS screen section (`#projects`) by removing `hidden` if present, or rely on natural scroll-into-view
- The "hard cut" is achieved by the camera reaching the monitor face — at that moment the 3D section unpins and the OS screen snaps into view
- No crossfade, no opacity transition — instant reveal (per PROJECT.md §Story flow)

### Reduced-Motion Path
- Gate entire `useGSAP` body with `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
- When reduced: skip ScrollTrigger setup, keep camera at CAMERA_POSITION, keep $scrollProgress at 0
- Taglines rendered statically without animation

### frameloop="demand" Integration
- Add `invalidate()` call inside the GSAP ticker / ScrollTrigger onUpdate callback
- Stop calling invalidate when scroll is idle (onLeave/onLeaveBack callbacks)

### agent's Discretion
- Exact monitor-face camera end position may need minor tuning after visual verification
- Tagline copy to match PROJECT.md story flow beats

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CAMERA_POSITION`, `CAMERA_TARGET`, `CAMERA_FOV`, `CAMERA_NEAR`, `CAMERA_FAR` — exported constants from `src/components/canvas/GameSetupScene.tsx` (Phase 6 imports these as animation start)
- `$sceneReady`, `$scrollProgress` atoms in `src/stores/sceneStore.ts` — ready for Phase 6 writes
- `useGSAP` from `@gsap/react@^2.1.2` already installed
- `gsap@^3.12` ScrollTrigger included in core — just needs `gsap.registerPlugin(ScrollTrigger)`
- `SceneCanvas.tsx` owns the Canvas + View; Phase 6 scroll logic attaches to the DOM trigger outside canvas

### Established Patterns
- Sub-path imports only: `@react-three/drei/core/...` and `@react-three/drei/web/...` (no barrel)
- `client:only="react"` for all R3F/React islands
- Nanostore pattern: `atom.set(value)` from GSAP callback, `useStore(atom)` in React
- Tailwind default classes only — no arbitrary values
- `100dvh` not `100vh` (AGENTS.md hard rule)

### Integration Points
- `GameSetupScene.tsx` — add `useGSAP` scroll hook here (camera ref lives here via `useThree`)
- `index.astro` — hero section is the ScrollTrigger DOM trigger; add `id="scene-scroll-pin"` wrapper div
- `sceneStore.ts` — write `$scrollProgress` from GSAP onUpdate
- `globals.css` — add tagline overlay keyframes if needed

</code_context>

<specifics>
## Specific Ideas

- Camera end position should frame the monitor screen face (CODE showing in glb) filling most of the canvas — the "entering the monitor" illusion
- Hard cut must be truly instant — no CSS transition, no opacity fade — the frame where camera arrives IS the frame the OS screen appears
- Tagline copy from PROJECT.md: story beat 3 is the camera fly-in; taglines can echo "Shipping pixel-sharp frontends" and a secondary line

</specifics>

<deferred>
## Deferred Ideas

- Scroll-spy to update nav active state (aria-current) — deferred to Phase 7+
- GSAP timeline seek via Drei useScroll — chose GSAP ScrollTrigger instead per ARCHITECTURE.md
- Parallax on non-hero sections — explicitly excluded per PROJECT.md anti-features

</deferred>
