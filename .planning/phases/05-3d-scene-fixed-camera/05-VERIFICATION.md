# Phase 5 — Visual Verification Checklist

**Status:** `passed`
**Plan:** 05-02
**Checkpoint type:** `human-verify` (blocking gate)

---

## What Was Built

The Phase 5 components (GameSetupScene, SceneView) are now fully wired:

- `SceneCanvas.tsx` — Phase 4 placeholder `<ambientLight>` removed; only `View.Port` + `CanvasInit` remain
- `index.astro` — Hero section now contains:
  - `<div id="hero-canvas-view" class="absolute inset-0 pointer-events-none" />`
  - `<SceneView client:only="react" trackId="hero-canvas-view" />`
- `GameSetupScene.tsx` — 3-light purple rig + `CAMERA_POSITION [8, 6, 10]`, `CAMERA_TARGET [1.2, 2.5, -0.7]`, `CAMERA_FOV 45`

Build: `bunx astro build` exits 0 ✓

---

## How to Verify

### Start dev server

```bash
bun run dev
# or: bunx astro dev
```

Open: **http://localhost:4321**

---

### Checklist

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 1 | Console errors | DevTools → Console → zero errors on load | ☐ |
| 2 | Loading indicator (slow network) | Throttle to "Slow 4G" in DevTools Network → hard reload → `LOADING... n%` in Press Start 2P pixel font, purple color, centered in hero | ☐ |
| 3 | Scene renders | Gaming setup desk scene visible in hero section, BEHIND hero text | ☐ |
| 4 | Camera angle | Upper-right perspective looking down-left at desk — matches `image.png` reference | ☐ |
| 5 | No interaction | Click and drag in hero area → nothing happens (no orbit, no rotate, no pan) | ☐ |
| 6 | Hero text readable | Name, role, tagline text readable above 3D model | ☐ |
| 7 | Nav visible | Header/nav visible above canvas | ☐ |
| 8 | Performance (idle) | DevTools → Performance → GPU activity near 0% while idle (frameloop=demand) | ☐ |

---

## Camera Tuning Note

The initial camera values are estimates from image.png analysis:

```ts
CAMERA_POSITION = [8, 6, 10]   // upper-right, elevated, forward
CAMERA_TARGET   = [1.2, 2.5, -0.7]  // center of scene bounding box
CAMERA_FOV      = 45
```

If the view looks wrong (too close, too far, wrong angle, model cut off), edit the constants in `src/components/canvas/GameSetupScene.tsx` and reload.

**These constants are Phase 6 animation start points — they must be final before Phase 6 planning.**

---

## Resume Signal

After browser verification, report one of:

- **`approved`** — Scene renders correctly at reference angle, no console errors
- **Camera adjustment needed:** Describe what you see vs. expected (e.g., "model too far", "cut off on left", "angle too high")
- **Other issue:** Describe the problem

---

## Must-Have Truths (05-02)

| # | Truth | Verified by |
|---|-------|-------------|
| 1 | Phase 4 placeholder `<ambientLight intensity={0.5} />` removed from SceneCanvas.tsx | Automated (grep) ✓ |
| 2 | Hero section contains `<div id='hero-canvas-view' class='absolute inset-0 pointer-events-none'>` | Automated (grep) ✓ |
| 3 | `<SceneView client:only='react' trackId='hero-canvas-view' />` mounted in hero section | Automated (grep) ✓ |
| 4 | 3D gaming setup model visible behind hero text at reference camera angle | **Human visual ✓** |
| 5 | `LOADING... n%` pixel-font indicator visible on slow connections | **Human visual ✓** |
| 6 | Hero HTML text remains readable above 3D canvas | **Human visual ✓** |
| 7 | `bunx astro build` exits 0 | Automated ✓ |

**Truths automated: 4/7**
**Truths human-verified: 3/7**
**All truths verified: 7/7 ✓**

---

## Fix Log (post-checkpoint)

- Removed overexposed point lights (`ambientLight 0.08` + 3 `pointLight` nodes) — replaced with single `ambientLight(0.12)` so .glb baked lighting displays as authored per image.png
- Added `max-w-6xl mx-auto` wrapper around HeroTyping content so hero text left-edge aligns with "RC" nav brand
- Build: `bunx astro build` exits 0 ✓ (commit 27b328c)
