---
status: human_needed
---

# Phase 6 — Scroll Narrative + Camera Fly-In Verification

**Status:** `human_needed`
**Plans:** 06-01, 06-02

---

## What Was Built

- `GameSetupScene.tsx` — GSAP ScrollTrigger camera fly-in hook (`useGSAP`, `scrub:true`). Camera lerps from `[6,6,8]` → `[1.8,3.6,3.2]` as scroll advances. GSAP writes `cameraProgress.current.value`; `useFrame` reads it (Pitfall §9). `$scrollProgress` nanostore updated; `invalidate()` called each frame during scroll.
- `ScrollNarrative.tsx` — Tagline fade-in/out scrub timeline. `$activeSection` set to `'os'` on hard cut (when pin exits forward).
- `index.astro` — `#scene-scroll-pin` outer div (`min-h-[200dvh]`), sticky `section#hero` (`h-dvh`), tagline overlays (`#fly-tagline-1`, `#fly-tagline-2`).
- `sceneStore.ts` — `$activeSection` atom added.
- `globals.css` — Reduced-motion: taglines hidden via `display:none`.
- Build: `bunx astro build` exits 0 ✓

---

## How to Verify

```bash
bun run dev
```

Open: **http://localhost:4321**

---

## Checklist

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 1 | Scroll pin: hero stays fixed | Scroll down slowly — hero text + 3D scene stays at top while page scrolls | ☐ |
| 2 | Camera fly-in | As scroll advances, camera moves toward the monitor face | ☐ |
| 3 | Taglines appear | "Full-Stack · Frontend · AI" and second line fade in during scroll, fade out before end | ☐ |
| 4 | Hard cut | At end of scroll pin, #projects section snaps into view instantly (no fade) | ☐ |
| 5 | No console errors | DevTools → Console → zero errors | ☐ |
| 6 | Reduced-motion | Enable prefers-reduced-motion in OS — scroll scrolls normally, no camera animation, taglines hidden | ☐ |
| 7 | Performance | DevTools → Performance → 60fps during scroll, GPU active only during scroll (frameloop demand) | ☐ |

---

## Must-Have Truths (automated)

| # | Truth | Verified |
|---|-------|---------|
| 1 | `useGSAP` used (not raw useEffect) for ScrollTrigger | Automated ✓ (source review) |
| 2 | `scrub: true` (not numeric) on camera tween | Automated ✓ |
| 3 | `ScrollTrigger.config({ ignoreMobileResize: true })` at module level | Automated ✓ |
| 4 | GSAP writes ref, useFrame reads ref (Pitfall §9) | Automated ✓ |
| 5 | `invalidate()` called from onUpdate | Automated ✓ |
| 6 | `#scene-scroll-pin` uses `min-h-[200dvh]` not `min-h-[200vh]` | Automated ✓ |
| 7 | `section#hero` uses `h-dvh` not `h-screen` | Automated ✓ |
| 8 | `bunx astro build` exits 0 | Automated ✓ |
| 9 | Human visual verification — camera fly-in + hard cut | **Human ☐** |

---

## human_verification

Items requiring manual browser verification:

1. Camera actually moves toward monitor face as user scrolls (not stationary)
2. Hard cut transition — instant reveal of projects section at scroll end
3. Taglines visible during mid-scroll, hidden at scroll start/end
4. 60fps scroll performance (no jank)

---

## Resume Signal

- **`approved`** — Camera fly-in works, hard cut works, no console errors
- **Issues found** — Describe: e.g. "camera doesn't move", "taglines don't appear", "jank at 30fps"
