# Architecture Research: Frontend Portfolio

**Domain:** Static single-page portfolio with Astro, R3F, GSAP ScrollTrigger
**Researched:** 2026-04-21
**Overall confidence:** HIGH (all major claims verified against official docs and authoritative sources)

---

## Astro + R3F Integration Pattern

**The correct setup is `client:only="react"` on any R3F component — never `client:load` or `client:visible`.**

R3F requires browser APIs (WebGL context, `window`, `document`) that are unavailable at build time. Astro's SSR renderer will crash or produce mismatched HTML if it tries to render R3F server-side. `client:only` skips the server-render entirely and boots the component purely in the browser, equivalent to a client-side `createRoot()` call.

Setup steps:

```bash
npx astro add react
npm install three @react-three/fiber @react-three/drei
npm install gsap
```

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
});
```

R3F island in an Astro page:
```astro
---
import ThreeScene from '../components/ThreeScene.tsx';
---
<ThreeScene client:only="react" />
```

Inside `ThreeScene.tsx`, the `<Canvas>` from `@react-three/fiber` is a normal React component. No special Astro wrappers needed.

**Gotcha:** Passing complex props (functions, class instances) across the Astro→React boundary is unreliable. Keep all 3D state inside the React island and use nanostores for anything that must cross island boundaries.

---

## GSAP ScrollTrigger in React Islands

**Recommended pattern: `useEffect` + `ref` + `gsap.context()` for cleanup, with `scrub: true` for camera animation.**

Register the plugin once at module level, not inside the component:

```tsx
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
```

Inside the component, animate Three.js object refs — not DOM class selectors (those don't exist in canvas):

```tsx
const cameraRef = useRef();

useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(cameraRef.current.position, {
      z: 2,
      y: 0.5,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: '#scene-section',   // DOM element outside canvas
        start: 'top center',
        end: 'bottom center',
        scrub: true,                 // ties tween to scroll position
        onToggle: (self) => {
          // use to pause/resume frame loop when section leaves viewport
        },
      },
    });
  });
  return () => ctx.revert();        // essential cleanup on unmount
}, []);
```

**Use `scrub: true` not `scrub: 1` for camera fly-in.** Numeric scrub adds a lag which causes camera "catching up" artifacts when the user stops scrolling mid-animation.

**Alternative: `useScroll` from Drei + GSAP timeline seek.** `useScroll` returns an `offset` (0–1) representing scroll progress. Inside `useFrame`, seek a GSAP timeline: `tl.seek(offset * tl.duration())`. This keeps all scroll logic inside R3F's own loop and avoids any ScrollTrigger DOM dependency for the 3D portion. Choose GSAP ScrollTrigger when you need to coordinate DOM animations (text fade, section transitions) with 3D. Choose Drei `useScroll` when the animation is purely 3D.

For this portfolio — Hero typing text is DOM, scene camera is 3D, and they need to coordinate — **use GSAP ScrollTrigger as the single source of truth for both DOM and 3D timelines.**

---

## Island Hydration Strategy

| Section | Component | Directive | Rationale |
|---------|-----------|-----------|-----------|
| Hero (typing text) | React or Astro native | `client:load` or Astro `.astro` | Above fold, must be interactive immediately |
| 3D Scene (R3F Canvas) | React (R3F) | `client:only="react"` | WebGL requires browser, cannot SSR |
| OS Screen (dialog) | React | `client:visible` | Below fold, no interaction until scrolled to |
| Footer | Astro `.astro` | Static — no directive | No JS needed |

**Do not use `client:visible` on the R3F canvas.** `client:visible` triggers hydration on IntersectionObserver, which fires when the element enters the viewport. If the user scrolls fast, the canvas will not be initialized when the scroll animation starts, causing a flash or missing animation. Use `client:only="react"` so the canvas boots at page load.

**Performance trade-off:** `client:only` loads the Three.js bundle immediately. This is acceptable for a portfolio (single page, intentional experience) but would be wrong for a content-heavy site. Mitigate with a loading state inside the React component rather than relying on Astro's hydration deferral.

---

## Canvas Architecture (Single vs Scoped)

**Use a single `<Canvas>` component that spans the full viewport height. Do not create multiple canvases.**

Browsers limit the number of simultaneous WebGL contexts (typically 8–16). Multiple canvases hit this limit and degrade performance or fail silently on older hardware.

**Two valid single-canvas approaches:**

### Option A: Full-page fixed canvas with R3F View (recommended for this project)

`@react-three/drei` provides a `<View>` component that uses WebGL's scissor/viewport API to render different scenes into different portions of one canvas. The canvas is `position: fixed; top: 0; left: 0; width: 100%; height: 100%` and sits behind all DOM content.

```tsx
// Layout.tsx
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';

export function Layout({ children }) {
  return (
    <>
      {children}  {/* DOM content: hero, OS screen, footer */}
      <Canvas style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}>
        <View.Port />  {/* renders all registered Views here */}
      </Canvas>
    </>
  );
}
```

Each section that needs 3D registers a `<View>`:
```tsx
// SceneSection.tsx
import { View } from '@react-three/drei';

export function SceneSection() {
  return (
    <section id="scene-section" style={{ height: '200vh' }}>
      <View style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <GamingSetupScene />
      </View>
    </section>
  );
}
```

The canvas frame loop should only run when a 3D section is visible. Use GSAP ScrollTrigger's `onToggle` callback to set a visibility flag, and pass it to R3F's `frameloop` prop (`"demand"` vs `"always"`).

### Option B: r3f-scroll-rig (14islands)

`@14islands/r3f-scroll-rig` provides a higher-level `<GlobalCanvas>` + `<ScrollScene>` API that automates the proxy-element tracking and DOM synchronization. Better if you need tight DOM↔WebGL positional sync (e.g., a 3D card that follows a DOM card during scroll). For this portfolio (full-screen camera animation, not DOM-matched positioning), it adds unnecessary complexity.

**Verdict for this project: Option A — fixed canvas with `<View>` and `<View.Port>`.**

---

## Cross-Island State

**Use nanostores for any state that must be shared between the R3F island and other React islands or Astro components.**

Install:
```bash
npm install nanostores @nanostores/react
```

Create `src/stores/portfolio.ts`:
```ts
import { atom, map } from 'nanostores';

export const scrollProgress = atom<number>(0);   // 0–1, updated by R3F island
export const activeSection = atom<string>('hero'); // 'hero' | 'scene' | 'os' | 'footer'
```

Read in any React island:
```tsx
import { useStore } from '@nanostores/react';
import { activeSection } from '../stores/portfolio';

function OSScreen() {
  const section = useStore(activeSection);
  // ...
}
```

Write from GSAP ScrollTrigger callbacks:
```ts
import { activeSection } from '../stores/portfolio';

ScrollTrigger.create({
  trigger: '#scene-section',
  onEnter: () => activeSection.set('scene'),
  onLeaveBack: () => activeSection.set('hero'),
});
```

**Do not use React Context or prop-drilling across Astro island boundaries.** Each `client:*` island is an isolated React root; Context does not cross island boundaries. Nanostores is the official Astro-recommended solution.

For state that is purely internal to the R3F island (camera refs, animation progress), use React `useRef` and `useStore` inside the single island. Do not lift purely-internal R3F state into nanostores — that causes unnecessary re-renders.

---

## .glb Asset Loading

**Use `useGLTF` from Drei with `useGLTF.preload()` called at module level, and optimize the asset before shipping.**

### Optimization pipeline (run before committing `gaming_setup_v12.glb`)

```bash
# Install gltf-transform CLI
npm install -g @gltf-transform/cli

# Full optimization: Draco compression + KTX2 textures + dedup + prune
npx gltf-transform optimize gaming_setup_v12.glb gaming_setup_v12.optimized.glb \
  --compress draco \
  --texture-compress webp \
  --dedupe --prune

# Alternative: use gltfjsx --transform for a one-shot optimize + React component generation
npx gltfjsx gaming_setup_v12.glb --transform --output GamingSetup.tsx
```

Target: keep the `.glb` under 2 MB after compression. Draco reduces geometry by 90%+ but adds a WASM decoder (~150 KB). The decoder is only loaded when the model is compressed, so it is worth it for any mesh above ~200 KB.

### Loading pattern

```tsx
import { useGLTF } from '@react-three/drei';

// Call at module level — starts fetching before component mounts
useGLTF.preload('/models/gaming_setup_v12.glb');

function GamingSetupScene() {
  const { scene, nodes, materials } = useGLTF('/models/gaming_setup_v12.glb');
  return <primitive object={scene} />;
}
```

Place the `.glb` in `/public/models/` so Astro copies it to the build output as-is. Do not import it via ESM — the file is too large for bundler inlining and will cause build memory issues.

**Draco decoder path:** By default `useGLTF` fetches Draco binaries from Google's CDN (`https://www.gstatic.com/draco/...`). To avoid the CDN dependency in production, copy the decoder to `/public/draco/` and set:

```tsx
useGLTF.setDecoderPath('/draco/');
```

Call this once at app initialization, before any `useGLTF` call.

### Loading UX

R3F's `<Suspense>` + Drei's `<Html>` work well for a loading fallback inside the canvas:

```tsx
<Suspense fallback={<Html center><p>Loading...</p></Html>}>
  <GamingSetupScene />
</Suspense>
```

---

## Build Order (What Depends on What)

The dependency chain for the 3D scene section determines implementation order:

```
1. Astro page scaffold (layout, sections, static HTML)
        ↓
2. GSAP ScrollTrigger on DOM sections (section transitions, typing text)
        ↓
3. R3F Canvas island (client:only="react", fixed canvas, View.Port)
        ↓
4. .glb optimization pipeline (gaming_setup_v12.glb → compressed)
        ↓
5. useGLTF loading + GamingSetup component (Suspense fallback)
        ↓
6. GSAP camera animation tied to ScrollTrigger (requires canvas + model ready)
        ↓
7. Nanostores for cross-island state (activeSection, scrollProgress)
        ↓
8. OS Screen React dialogs (client:visible, reads nanostores)
```

**Critical path:** Steps 3–6 are sequential and cannot be parallelized. The model must exist and be optimized before the ScrollTrigger animation can be tuned. Do not finalize camera keyframes until the real asset is loaded — placeholder geometry changes scale/position expectations significantly.

**Decouple early:** The Hero typing animation (step 2) has no R3F dependency and can be built and shipped independently. The Footer is fully static. Build those first to have a working page skeleton before touching WebGL.

---

## Sources

- [Astro React Integration Docs](https://docs.astro.build/en/guides/integrations-guide/react/)
- [Astro Islands Architecture Docs](https://docs.astro.build/en/concepts/islands/)
- [Share State Between Islands — Astro Docs](https://docs.astro.build/en/recipes/sharing-state-islands/)
- [Drei useGLTF API Docs](https://drei.docs.pmnd.rs/loaders/gltf-use-gltf)
- [GSAP ScrollTrigger + R3F — GSAP Community Forums](https://gsap.com/community/forums/topic/35688-how-to-use-gsap-with-react-three-fiber/)
- [Scroll Animations with R3F and GSAP — wawasensei](https://wawasensei.hashnode.dev/scroll-animations-with-react-three-fiber-and-gsap)
- [One Canvas to Rule Them All — Codrops (INK Games case study)](https://tympanus.net/codrops/2025/11/21/one-canvas-to-rule-them-all-how-ink-games-new-site-handles-complex-3d/)
- [r3f-scroll-rig — 14islands GitHub](https://github.com/14islands/r3f-scroll-rig)
- [gltfjsx — pmndrs GitHub](https://github.com/pmndrs/gltfjsx)
- [client:load vs client:visible — Leyaa.ai](https://leyaa.ai/codefly/learn/astro/qna/client-load-vs-client-visible-in-astro)
- [Nanostores in Astro: A Deep Dive — meirjc](https://meirjc.hashnode.dev/state-management-in-astro-a-deep-dive-into-nanostores)
