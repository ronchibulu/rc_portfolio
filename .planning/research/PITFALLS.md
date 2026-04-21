# Pitfalls Research: Frontend Portfolio

**Stack:** Astro.js + React islands, R3F v9 + Three.js, GSAP ScrollTrigger, Framer Motion (motion/react), Tailwind v4, Shadcn
**Researched:** 2026-04-21
**Confidence:** HIGH (all findings verified via official docs + community sources)

---

## 1. GSAP ScrollTrigger + Drei ScrollControls Mutual Exclusion

**What goes wrong:** Drei's `<ScrollControls>` applies its own damping/easing to scroll events. GSAP's ScrollTrigger does precise timing math against the raw scroll position. When both run simultaneously, pinned elements jitter, animation markers misfire, and scroll progress values are corrupted by the easing offset.

**Why it happens:** Two competing systems each own the scroll state. ScrollControls virtualizes the scroll inside a canvas overlay; ScrollTrigger reads `window.scrollY`. They refer to different values.

**Warning signs:**
- Pinned sections drift up/down instead of staying fixed
- ScrollTrigger `start`/`end` markers appear in wrong positions
- Smooth scroll feels choppy when 3D scene is present

**Prevention:** Pick one scroll driver and commit to it. For this project — one long scroll page driven by GSAP ScrollTrigger — do not use Drei's `<ScrollControls>` at all. Drive camera animation with ScrollTrigger reading `window.scrollY` and mutating Three.js object properties directly inside a `useFrame` listener or via a GSAP ticker.

**Phase to address:** Phase 1 (architecture decision before any scroll code is written)

---

## 2. GSAP React Strict Mode Double Initialization

**What goes wrong:** React 18 Strict Mode intentionally mounts → unmounts → remounts every component in development. A raw `useEffect` running `gsap.to(...)` or `ScrollTrigger.create(...)` fires twice, creating duplicate animations, doubled scroll triggers, and stacked markers that never clean up.

**Why it happens:** `useEffect` cleanup only runs once per effect lifecycle. GSAP registers ScrollTriggers globally; the second mount adds a second trigger pointing to the same element without removing the first.

**Warning signs:**
- Two sets of ScrollTrigger debug markers visible in dev
- Animations play twice on page load in development
- Scroll positions off by a factor of 2

**Prevention:** Use the `@gsap/react` package and its `useGSAP()` hook exclusively. Never use `useEffect` for GSAP setup. The hook wraps everything in `gsap.context()` which reverts all animations and ScrollTriggers on cleanup, making it Strict Mode safe.

```js
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(useGSAP, ScrollTrigger);

// Inside component:
useGSAP(() => {
  gsap.to(meshRef.current.position, { y: 2, scrollTrigger: { ... } });
}, { scope: containerRef });
```

For animations triggered by events (click, hover), wrap the callback with the `contextSafe()` function returned by `useGSAP`, or they will leak on unmount.

**Phase to address:** Phase 1 (establish the pattern before any animation code is written)

---

## 3. R3F Canvas Rendering Every Frame by Default

**What goes wrong:** R3F's `<Canvas>` defaults to a 60 FPS game loop regardless of whether anything in the scene is moving. On a scroll-driven portfolio where the 3D model is only animating during scroll, this burns CPU/GPU continuously, drains mobile battery, and spins up cooling fans. On low-end devices this will manifest as site-wide jank even on sections with no 3D.

**Why it happens:** The default `frameloop="always"` is optimized for games, not scroll sites.

**Warning signs:**
- Chrome DevTools shows GPU utilization at 100% while page is idle
- Battery drain reported on mobile
- Fan noise on laptop while idle on the page

**Prevention:** Set `frameloop="demand"` on `<Canvas>`. Call R3F's `invalidate()` function whenever external state changes require a render (e.g., from a GSAP ticker or a scroll event). Drei controls call `invalidate()` automatically. For scroll-driven animation use a GSAP ticker that calls `invalidate()` each frame during active scroll and stops when scroll stops.

```jsx
<Canvas frameloop="demand">
  ...
</Canvas>
```

**Phase to address:** Phase 2 (set on initial Canvas setup, not retrofit later)

---

## 4. Three.js / R3F Mobile GPU Overload

**What goes wrong:** A complex `.glb` scene renders fine on desktop but drops to sub-30 FPS on mid-range Android and sub-20 FPS on older iPhones. iOS Safari is the worst case — it has the most restrictive GPU memory limits and no hardware-accelerated WebGL fallbacks.

**Root causes:**
- Too many draw calls (each mesh = 1 draw call; 3D scene files exported from Blender often have 50-200 separate objects)
- Uncompressed textures (a single 4K texture = 64 MB in GPU memory after decompression)
- Pixel ratio set to `window.devicePixelRatio` on a 3x display = 9x the pixels to render
- No LOD — same high-poly model at all distances/zoom levels

**Warning signs:**
- FPS profiler in Chrome shows GPU-bound frames (long green bars)
- iOS Safari console shows "WebGL context lost"
- Scene pauses/stutters when scrolling starts

**Prevention:**
1. Cap pixel ratio: `<Canvas dpr={[1, 1.5]}>` — never let it go to 2 or 3 on mobile
2. Merge static geometry in Blender before export — reduce the `gaming_setup_v12.glb` to the minimum number of mesh objects
3. Apply Draco compression to geometry (see Pitfall 5)
4. Convert all textures to WebP or KTX2 (KTX2 with Basis Universal stays compressed on the GPU)
5. Implement a device-tier check: detect low-end devices and reduce scene complexity or show a static render fallback
6. Use `<Detailed />` from Drei to swap lower-poly versions at distance

**Phase to address:** Phase 2 (model optimization) and Phase 3 (device-tier check)

---

## 5. Unoptimized .glb File Destroying Load Time

**What goes wrong:** `gaming_setup_v12.glb` exported directly from Blender will typically be 20-80 MB. Loaded over a typical mobile connection (5-20 Mbps) this causes a 4-16 second blank canvas before anything appears. No user will wait. The file also blocks the main thread during parse.

**Why it happens:** Raw glTF exports include uncompressed vertex buffers and full-resolution PNG/JPEG textures embedded in the binary.

**Breakdown of file size (typical scene):**
- Geometry (vertex positions, normals, UVs): 5-20 MB raw
- Textures: 60-80% of total file size

**Warning signs:**
- `glb` file is over 5 MB
- Network waterfall shows the model loading after 3+ seconds
- Lighthouse TTI penalized by 3D asset load

**Prevention:**
1. Run through `gltf-transform` pipeline:
   ```bash
   npx gltf-transform optimize gaming_setup_v12.glb gaming_setup_optimized.glb \
     --compress draco \
     --texture-compress webp
   ```
2. Draco compresses geometry 80-95%. For a 10 MB geometry payload, expect 500 KB-2 MB output.
3. WebP textures reduce texture payload 50-70% vs PNG/JPEG.
4. For geometry under 1 MB, skip Draco — the WASM decoder (~150 KB) costs more than it saves.
5. Use `useGLTF.preload('/model.glb')` to begin loading before the component mounts.
6. Show a loading progress indicator (Drei's `<Html>` + `useProgress`) so users know something is happening.
7. Keep final optimized file under 3 MB targeting mobile; under 8 MB for desktop.

**Note:** Draco is lossy. Apply it as the last step in the art pipeline. Repeated compress/decompress cycles degrade precision.

**Phase to address:** Phase 2 (asset preparation, before any R3F work)

---

## 6. Astro Hydration Flash (FOUC / CLS)

**What goes wrong:** Astro renders components as static HTML on the server. React islands hydrate client-side after the JS bundle loads. In the gap (100-800 ms on slow connections), interactive components render with broken styles, wrong dimensions, or missing content — causing a visible flash and layout shift (CLS penalty in Core Web Vitals).

**Specific manifestations for this project:**
- The R3F canvas is a `client:load` island. Before hydration, Astro renders nothing (or a blank div). The canvas snaps in after hydration, causing a layout shift.
- Shadcn components using CSS variables may flash unstyled if global CSS loads after the island hydrates.
- Framer Motion elements will be unanimated static HTML until hydration.

**Prevention:**
1. For the 3D canvas: reserve its exact space with a CSS-sized placeholder div (same height/width) so layout does not shift when the canvas appears.
2. Use `client:visible` with a generous `rootMargin` for below-fold islands — they hydrate just before they enter view, eliminating the flash for most users.
3. Use `client:only="react"` for components that have no meaningful static HTML representation (the canvas is one; it has no useful SSR output).
4. Import global CSS (`@/styles/global.css`) in your root layout, not inside island components — CSS must be available before any island hydrates.
5. Avoid `client:load` on heavy React islands unless they are above the fold and interactive immediately.

**Phase to address:** Phase 2 (layout architecture) and Phase 4 (performance pass)

---

## 7. Tailwind v4 Breaking Changes That Will Break Shadcn Components

**What goes wrong:** Shadcn's component classes were authored for Tailwind v3. Starting a new Astro project with Tailwind v4 (now the default) and running `shadcn init` creates a mismatch: component files use v3 class names and configuration assumptions that do not exist in v4.

**Specific breaking changes affecting Shadcn:**

| v3 class | v4 class | Affected Shadcn components |
|----------|----------|---------------------------|
| `shadow` | `shadow-sm` | Button, Card, Dialog, Popover |
| `shadow-sm` | `shadow-xs` | Input, Badge |
| `rounded` | `rounded-sm` | Nearly all components |
| `rounded-sm` | `rounded-xs` | Input |
| `outline-none` | `outline-hidden` | Button focus states |
| `ring` | `ring-3` | Focus rings on all interactive components |
| `border` (gray default) | `border border-gray-200` (must be explicit) | All bordered components |
| `bg-[--var]` | `bg-(--var)` | Any component using CSS variable colors |

**Config system change:** v4 removes `tailwind.config.js` as the primary config. Theme customization moves to CSS `@theme {}` blocks. Shadcn's `components.json` and init script may generate a `tailwind.config.js` that is silently ignored.

**Import change:** The `@tailwind base/components/utilities` directives are gone. Use `@import "tailwindcss";` instead.

**Prevention:**
1. After `shadcn init`, audit every generated component file against the v3→v4 rename table.
2. Move all theme tokens (colors, radii, fonts) into the CSS `@theme {}` block, not `tailwind.config.js`.
3. Set `applyBaseStyles: false` in `astro.config.mjs` for the Tailwind plugin to prevent duplicate base styles.
4. Run `npx @tailwindcss/upgrade` on any copied v3 components.
5. Check that `globals.css` uses `@import "tailwindcss"` not the old `@tailwind` directives.

**Phase to address:** Phase 1 (project scaffolding — get this right from day one)

---

## 8. Shadcn + Astro Path Alias and CSS Variable Failures

**What goes wrong:** Shadcn imports all components using the `@/` alias (e.g., `@/components/ui/button`). If the TypeScript path alias is not configured before running `shadcn init`, the CLI either fails silently or generates broken import paths. Components also rely on CSS custom properties defined in `globals.css`; if that file is not imported into the Astro layout, every component renders unstyled.

**Warning signs:**
- Components render as plain HTML with no styling
- TypeScript errors: "Cannot find module '@/components/ui/button'"
- Buttons look like browser-default `<button>` elements
- Colors/spacing are completely wrong

**Prevention — exact setup order:**
1. Add path alias to `tsconfig.json` FIRST, before any other step:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": { "@/*": ["./src/*"] }
     }
   }
   ```
2. Restart the dev server after editing `tsconfig.json` (Astro picks up tsconfig on restart, not hot reload).
3. Add React and Tailwind integrations to `astro.config.mjs`.
4. Run `shadcn init` after the above two steps are confirmed working.
5. Import `@/styles/globals.css` in your root Astro layout (`src/layouts/Layout.astro`), not inside individual page components.
6. In `astro.config.mjs`, set `tailwind({ applyBaseStyles: false })` to prevent Tailwind's base styles loading twice.
7. Confirm Tailwind is scanning `.tsx` files — if the content glob misses `.tsx`, Shadcn classes are purged from the build.

**Phase to address:** Phase 1 (scaffolding)

---

## 9. GSAP Ticker vs R3F useFrame Loop Conflict

**What goes wrong:** GSAP runs its own `requestAnimationFrame` ticker. R3F runs its own `requestAnimationFrame` loop. When both drive mutations on the same Three.js object (e.g., a camera position animated by GSAP ScrollTrigger while `useFrame` also reads/writes camera state), the two loops can fire in different orders each frame, causing visible one-frame stutters and inconsistent animation state.

**Why it happens:** Neither GSAP nor R3F knows about the other's tick timing. Browser scheduling does not guarantee the order of two separate `rAF` callbacks.

**Prevention:**
1. Do not let GSAP directly mutate Three.js objects that `useFrame` also writes to.
2. Use GSAP to write to plain JavaScript values (a `progress` ref), then read those values inside `useFrame` and apply them to Three.js objects. This makes R3F the single writer to the scene graph:
   ```js
   const progress = { value: 0 };
   gsap.to(progress, { value: 1, scrollTrigger: { ... } });

   useFrame(() => {
     mesh.current.rotation.y = progress.value * Math.PI * 2;
   });
   ```
3. Alternatively, use GSAP's `gsap.ticker.add()` instead of a separate `useFrame` — but only for one object, not mixing both approaches.

**Phase to address:** Phase 2 (camera fly-in animation implementation)

---

## 10. Scroll Jank from GSAP ScrollTrigger Recalculation on Resize

**What goes wrong:** ScrollTrigger caches the scroll positions of triggers at init time. When the browser is resized (common on mobile when the address bar shows/hides), the cached start/end values become stale. Animations fire at wrong scroll positions. On iOS, the address bar appearing and disappearing on scroll constantly triggers this.

**Warning signs:**
- Animation fires too early or too late after resizing the browser
- On iOS, scroll animations "jump" as the Safari address bar toggles

**Prevention:**
1. Call `ScrollTrigger.refresh()` inside a debounced resize handler.
2. For the iOS address bar problem specifically, avoid using `100vh` as a trigger measurement unit — use `window.innerHeight` dynamically or the CSS `dvh` unit (dynamic viewport height):
   ```css
   height: 100dvh; /* tracks the actual visible viewport, including address bar changes */
   ```
3. Set `ScrollTrigger.config({ ignoreMobileResize: true })` to suppress the constant iOS micro-resize events from the address bar.

**Phase to address:** Phase 3 (scroll integration testing)

---

## Phase-Specific Warning Summary

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | Scaffolding | Tailwind v4 / Shadcn class mismatch | Run upgrade tool; audit all component classes |
| Phase 1 | Scaffolding | Missing `@/` alias breaks shadcn | Set `tsconfig.json` paths before `shadcn init` |
| Phase 1 | Architecture | ScrollControls vs ScrollTrigger war | Commit to ScrollTrigger only, no Drei ScrollControls |
| Phase 2 | 3D Model | Raw `.glb` destroying load time | gltf-transform + Draco + WebP textures before R3F work |
| Phase 2 | Canvas | Burning GPU at idle | `frameloop="demand"` + `invalidate()` on scroll |
| Phase 2 | Animation | Strict mode double triggers | `@gsap/react` `useGSAP()` hook only, no raw `useEffect` |
| Phase 2 | Animation | GSAP + useFrame write conflict | Use GSAP → plain JS ref → useFrame → Three.js pattern |
| Phase 3 | Scroll | iOS address bar resize jank | `ignoreMobileResize` + `dvh` units |
| Phase 3 | Mobile | GPU overload on phones | `dpr={[1, 1.5]}`, merge meshes, texture compression |
| Phase 4 | Hydration | Canvas layout shift on load | Reserve space with placeholder div, `client:only` |

---

## Sources

- [GSAP + React Official Docs (useGSAP, contextSafe, Strict Mode)](https://gsap.com/resources/React/)
- [ScrollTrigger pin and Drei ScrollControls incompatibility — GSAP forum](https://gsap.com/community/forums/topic/40114-scrolltrigger-pin-and-dreis-scrollcontrols-dont-play-well-together/)
- [Performance Issues with GSAP + R3F — GSAP forum](https://gsap.com/community/forums/topic/43299-performance-issues-on-desktop-and-mobile-devices-using-gsap-with-react-three-fiber/)
- [ScrollTrigger resize recalculation bug — GSAP forum](https://gsap.com/community/forums/topic/38874-scrolltrigger-doesnt-recalculate-startend-positions-and-values-when-window-is-resized-with-react-three-fiber-model-animation/)
- [R3F Scaling Performance — Official Docs](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Three.js mobile 60fps thread — Three.js Forum](https://discourse.threejs.org/t/how-to-achieve-three-js-55-60-fps-on-mobile-with-great-smooth-experience/78206)
- [GLB Draco Compression — Cesium Blog](https://cesium.com/blog/2018/04/09/draco-compression/)
- [gltf-transform KHR Draco Extension Docs](https://gltf-transform.dev/modules/extensions/classes/KHRDracoMeshCompression)
- [Tailwind CSS v4 Upgrade Guide — Official](https://tailwindcss.com/docs/upgrade-guide)
- [shadcn/ui Astro Installation — Official](https://ui.shadcn.com/docs/installation/astro)
- [Astro Client Directives Reference — Official](https://docs.astro.build/en/reference/directives-reference/)
- [Eliminating CLS with SSR — Medium](https://medium.com/@craigmorten/eliminating-cls-when-using-ssr-for-viewport-specific-responsive-designs-2d5ab0d05bfa)
