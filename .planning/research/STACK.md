# Stack Research: Frontend Portfolio

## Recommended Versions (2025)

| Package | Version | Notes |
|---------|---------|-------|
| astro | ^5.x | Latest stable; static adapter built-in |
| @astrojs/react | ^4.x | React 19 support |
| react / react-dom | ^19.x | Concurrent features, no StrictMode double-fire issue with GSAP if handled correctly |
| three | ^0.176.x | Latest stable |
| @react-three/fiber | ^9.x | R3F v9 targets React 19 + Three r176 |
| @react-three/drei | ^10.x | Utility helpers (OrbitControls, useGLTF, etc.) |
| gsap | ^3.12.x | ScrollTrigger included in core |
| framer-motion | ^12.x (motion) | Package renamed to `motion`; `motion/react` for React |
| tailwindcss | ^4.x | v4 uses CSS-first config (no tailwind.config.js by default) |
| @tailwindcss/vite | ^4.x | Astro uses Vite; use this integration |
| shadcn/ui | latest CLI | `npx shadcn@latest init` — works with Tailwind v4 |
| @astrojs/vercel | ^8.x | Vercel adapter; set `output: 'static'` |

**Confidence: HIGH** — verified against current npm registries and official docs.

---

## Astro + R3F Integration

### Setup

```bash
npx astro add react
npm install three @react-three/fiber @react-three/drei
```

**Key pattern:** R3F Canvas must live inside a React component with `client:load` directive in Astro:

```astro
<!-- src/pages/index.astro -->
<SceneIsland client:load />
```

```tsx
// src/components/SceneIsland.tsx
import { Canvas } from '@react-three/fiber'
export default function SceneIsland() {
  return <Canvas>...</Canvas>
}
```

### Known compatibility issues
- R3F v9 requires React 19. If using React 18, pin `@react-three/fiber@8.x`
- `client:load` causes canvas to render immediately — use `client:visible` if canvas is below fold to avoid wasting GPU on hidden content
- Astro's SSR mode breaks R3F (no `window`). Must use `output: 'static'` or wrap in `typeof window !== 'undefined'` guard

### .glb loading
```tsx
import { useGLTF } from '@react-three/drei'
useGLTF.preload('/models/gaming_setup_v12.glb') // call outside component
```
Place .glb in `/public/models/` — Astro copies public/ as-is to dist/.

---

## GSAP ScrollTrigger + Camera

### Best practice 2025

GSAP ScrollTrigger drives camera position by updating a ref, not React state (avoids re-renders):

```tsx
import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function CameraRig() {
  const { camera } = useThree()
  const progress = useRef(0)

  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#scene-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => { progress.current = self.progress }
      }
    })
    return () => tl.kill()
  }, [])

  useFrame(() => {
    // lerp camera toward target based on progress.current
    camera.position.lerp(targetPosition(progress.current), 0.05)
  })

  return null
}
```

**Key:** Never call `gsap.to(camera.position, ...)` directly — Three.js camera is not a DOM element. Use ScrollTrigger's `onUpdate` to write to a ref, then read in `useFrame`.

### React Strict Mode + GSAP
In development, React 19 Strict Mode double-fires effects. Always return cleanup:
```tsx
useEffect(() => {
  const ctx = gsap.context(() => { /* setup */ })
  return () => ctx.revert()
}, [])
```

---

## Animation Libraries Comparison

### SmoothUI vs Motion Primitives

| | SmoothUI | Motion Primitives |
|--|---------|------------------|
| Shadcn compatible | Yes | Yes |
| Maintained (2025) | Active | Active |
| Animation engine | Framer Motion | Framer Motion |
| Component count | ~40 | ~35 |
| Best for | Text effects, hover cards | Page transitions, reveals |
| License | MIT | MIT |

**Recommendation:** Use **both** — they complement each other. Motion Primitives for scroll-reveal entrance animations; SmoothUI for text effects (typing, blur-in) and interactive UI components.

### Framer Motion in Astro
Use `motion` package (v12+), import from `motion/react`:
```tsx
import { motion } from 'motion/react'
```
Works inside React islands. Do NOT use in `.astro` files directly. No special Astro config needed.

---

## Vercel Static Deploy

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'

export default defineConfig({
  output: 'static',
  adapter: vercel(),
})
```

**Asset handling:** All files in `/public/` are served at root. Large .glb files should be in `/public/models/`. Vercel serves from CDN automatically.

**100MB limit per file** — gaming_setup_v12.glb must be under 100MB. If larger, use Draco compression via `gltf-pipeline` or host on external CDN.

**Caching headers:** Vercel auto-sets `Cache-Control: public, max-age=31536000, immutable` for assets with content hashes. Static .glb files in /public get standard CDN caching.

---

## Font Strategy

**Press Start 2P** via Google Fonts, loaded in Astro layout head:

```astro
<!-- src/layouts/BaseLayout.astro -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
```

In Tailwind v4 CSS config:
```css
@theme {
  --font-pixel: 'Press Start 2P', monospace;
}
```

**Alternative:** Self-host via `fontsource` npm package for better performance:
```bash
npm install @fontsource/press-start-2p
```
```tsx
import '@fontsource/press-start-2p'
```

**Recommendation:** Use `@fontsource/press-start-2p` — no external request, better Lighthouse score.

---

## Tailwind v4 Key Changes

- No `tailwind.config.js` — config is CSS-first in `globals.css`
- Custom theme tokens via `@theme {}` block
- Use `@tailwindcss/vite` plugin (not PostCSS plugin) with Astro
- Arbitrary values still work but avoid per project constraint
- Default color palette is same as v3; `zinc-950` exists

---

## Confidence Levels

| Topic | Confidence |
|-------|-----------|
| Package versions | High — npm current |
| R3F + Astro setup | High — official docs pattern |
| GSAP + R3F camera via ref | High — established pattern |
| SmoothUI / Motion Primitives | Medium — smaller libs, verify on install |
| Vercel static limits | High — official Vercel docs |
| Tailwind v4 API | High — stable release |
