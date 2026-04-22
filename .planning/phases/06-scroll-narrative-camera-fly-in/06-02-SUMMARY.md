# Plan 06-02 Summary — DOM Pin + Taglines + ScrollNarrative

**Status:** Complete  
**Commit:** 94ef154

## What Was Done

- `src/pages/index.astro`: Added `#scene-scroll-pin` outer div (`min-h-[200dvh]`, `z-10`), changed `section#hero` to `sticky top-0 h-dvh overflow-hidden`, added `#fly-tagline-1`/`#fly-tagline-2` overlays with `opacity-0` start and `aria-hidden="true"`. Mounted `<ScrollNarrative client:only="react" />`.
- `src/components/canvas/ScrollNarrative.tsx` (new): `useGSAP` tagline scrub timeline (fade in 20-50%, fade out 70-85%); `ScrollTrigger.create` for hard-cut `$activeSection` update.
- `src/stores/sceneStore.ts`: Added `$activeSection = atom<string>('hero')`.
- `src/styles/globals.css`: Added `@media (prefers-reduced-motion: reduce)` rule hiding both tagline divs.

## Acceptance Criteria Status

- [x] `#scene-scroll-pin` outer div `min-h-[200dvh]`
- [x] `section#hero` is `sticky top-0 h-dvh` (100dvh not 100vh)
- [x] Tagline divs `opacity-0` initial, `aria-hidden="true"`
- [x] `ScrollNarrative.tsx` uses `useGSAP`, `$sceneReady` dependency gate
- [x] `$activeSection` set to `'os'` on pin exit, `'hero'` on leave-back
- [x] Reduced-motion: no ScrollTrigger, taglines `display:none`
- [x] No Drei `<ScrollControls>` anywhere
- [x] `bunx astro build` exits 0
