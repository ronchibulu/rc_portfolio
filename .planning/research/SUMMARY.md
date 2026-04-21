# Research Summary: Frontend Portfolio

**Project:** Ronald Cheng — Dark pixel/8-bit retro portfolio
**Stack family:** Astro v5 + React 19 islands + R3F v9 + GSAP 3.12 + Motion v12 + Tailwind v4 + Shadcn
**Deploy target:** Vercel static
**Confidence:** HIGH across all four research dimensions

---

## Stack Lock-In

| Package | Version | Purpose |
|---------|---------|---------|
| astro | ^5.x | Static site + islands |
| @astrojs/react | ^4.x | React 19 integration |
| @astrojs/vercel | ^8.x | Static adapter (`output: 'static'`) |
| react / react-dom | ^19.x | Islands runtime |
| three | ^0.176.x | WebGL engine |
| @react-three/fiber | ^9.x | React renderer for Three |
| @react-three/drei | ^10.x | `View`, `useGLTF`, `Html`, `useProgress` |
| gsap | ^3.12.x | ScrollTrigger (included in core) |
| @gsap/react | latest | `useGSAP()` Strict-Mode-safe hook |
| motion | ^12.x | Framer Motion; import `motion/react` |
| tailwindcss | ^4.x | CSS-first `@theme {}` config |
| @tailwindcss/vite | ^4.x | Astro's Vite plugin integration |
| shadcn/ui | latest CLI | Dialog, Button, Card primitives |
| nanostores + @nanostores/react | latest | Cross-island state |
| @fontsource/press-start-2p | latest | Self-hosted pixel font |
| detect-gpu | latest | Device tier for 3D fallback |

---

## Architecture Decisions (Locked)

1. **R3F mount directive: `client:only="react"`** — not `client:load`, not `client:visible`. WebGL cannot SSR; IntersectionObserver is too late for scroll-driven animation.
2. **Single fixed full-viewport canvas** with Drei `<View>` + `<View.Port>` pattern. Canvas is `position: fixed; inset: 0; pointer-events: none`. Sections register `<View>` regions that map to on-page DOM boxes.
3. **GSAP ScrollTrigger = single scroll authority.** No Drei `<ScrollControls>`. Two scroll drivers fight and corrupt pin math (Pitfall 1).
4. **GSAP → ref → useFrame → Three.js object write path.** GSAP writes plain JS progress values; `useFrame` reads them and mutates the scene. Prevents ticker conflict (Pitfall 9).
5. **`useGSAP()` hook from `@gsap/react`** exclusively; no raw `useEffect` GSAP setup. Strict Mode safe (Pitfall 2).
6. **`frameloop="demand"` + `invalidate()` from GSAP ticker** during scroll; stop on idle. Saves mobile battery (Pitfall 3).
7. **Nanostores for cross-island state** (`scrollProgress`, `activeSection`). React Context does not cross Astro island boundaries.
8. **Tailwind v4 CSS-first config**: `@import "tailwindcss"`, theme tokens in `@theme {}`, `applyBaseStyles: false` in Astro integration. Audit every Shadcn component against v3→v4 class rename table (Pitfall 7).
9. **Self-host Press Start 2P via `@fontsource/press-start-2p`** — no Google Fonts request, better LCP.

---

## Asset Pipeline (Must Do Before Camera Work)

`gaming_setup_v12.glb` must ship **under 2 MB**. Raw Blender export will be 20–80 MB.

```bash
npx gltf-transform optimize gaming_setup_v12.glb gaming_setup_v12.optimized.glb \
  --compress draco --texture-compress webp --dedupe --prune
```

- Place at `/public/models/gaming_setup_v12.glb`
- Self-host Draco decoder at `/public/draco/`; `useGLTF.setDecoderPath('/draco/')` at app init
- `useGLTF.preload('/models/...')` at module level before component
- Wrap in `<Suspense fallback={<Html center>...}>` with Drei `useProgress` for loading UX
- Merge static meshes in Blender first to drop draw calls

---

## Feature Scope (v1)

### Table stakes (ship or fail)
- Name + role visible in first viewport
- 11 project cards with live URLs, tech badges, image slider, dialog detail
- Employment timeline with 4 entries (UDS + 3 Hypthon titles grouped under one company block)
- LinkedIn + email in footer
- Responsive at 375 / 768 / 1024 / 1920
- Fast FCP; heavy 3D assets do not block initial render

### Differentiators
- Scroll-driven camera fly-in toward monitor of gaming setup 3D scene
- Hard cut from camera reaching monitor → OS screen (no slow fade; "entering the monitor" illusion)
- OS simulator desktop metaphor with folder icons, window-style dialogs, scanline + retro-grid background
- Press Start 2P typing animation in hero
- Scroll-animated job timeline inside About Me dialog (Framer Motion)
- Dark pixel/8-bit palette: `zinc-950` bg, `zinc-900`/`zinc-800` surface, `zinc-100` text, `green-400`/`lime-400` CRT accent, `yellow-400` highlight, `zinc-700` border

### Anti-features (deliberately excluded)
- Orbit controls on hero model (breaks curated camera)
- Light mode toggle
- Auto-playing audio, cursor trails, fake progress bars
- Parallax on every section — pin only for the camera fly-in
- Resume PDF iframe (link-to-download only if added later)
- Embedded blog, auth, or server routes

---

## Mobile & Reduced-Motion Strategy

### GPU tier fallback (`detect-gpu` `getGPUTier()`)
| Tier | Behavior |
|------|----------|
| High (hwConcurrency ≥ 8, GPU tier ≥ 2) | Full R3F scene, `dpr={[1, 2]}` |
| Mid (hwConcurrency 4–7, GPU tier 1) | R3F scene, `dpr={[1, 1.5]}`, reduced textures |
| Low / mobile | Static PNG screenshot + CSS parallax; skip camera fly-in; fade directly to OS screen |

### `prefers-reduced-motion`
- `useReducedMotion()` from Motion → skip `animate` props
- `gsap.matchMedia()` gate around ScrollTrigger registration
- Disable typing text, scroll scrub camera, text fade-ins
- Keep static scene render + static layout

### iOS specifics
- `height: 100dvh` not `100vh` — tracks Safari address bar
- `ScrollTrigger.config({ ignoreMobileResize: true })` — suppresses address-bar micro-resize events
- Debounced `ScrollTrigger.refresh()` in resize handler (Pitfall 10)

---

## Scroll Storytelling Beats

1. **Hero** — typing: "Hi, I'm Ronald." → role → tagline; scroll cue
2. **3D scene enters** — fixed camera angle per `image.png`; tagline overlays fade in
3. **Camera fly-in (pinned, ~1 viewport, `scrub: true`)** — camera moves toward monitor screen
4. **Hard cut → OS screen** — retro-grid + scanline background, Projects + About Me folder icons
5. **Interaction layer** — click Projects → subfolder grid → dialog (slider + URL + tech badges); click About Me → timeline dialog

Rules:
- One scroll gesture = one narrative beat
- Camera fly-in completes in ≤ 1 viewport height of pin
- Pin only the camera fly-in section; no other pins
- Mobile: replace pinned scroll with vertical stack of static sections

---

## Build Order (Critical Path)

```
1. Astro scaffold + Tailwind v4 + Shadcn (tsconfig @/ alias FIRST, then shadcn init)
2. Static layout: Hero section, OS screen DOM, Footer — no 3D yet
3. Typing hero animation (SmoothUI) + footer contact — ships standalone
4. GSAP ScrollTrigger for DOM section transitions + taglines
5. .glb optimization pipeline → commit optimized asset
6. R3F Canvas island (client:only="react", fixed View.Port)
7. useGLTF + GamingSetup component with Suspense fallback
8. GSAP camera fly-in tied to ScrollTrigger (requires real asset — placeholder scale lies)
9. Nanostores: scrollProgress + activeSection
10. OS screen dialogs (Shadcn Dialog, client:visible) — Projects + About Me
11. Project detail dialogs with image sliders + tech badges
12. About Me timeline with scroll-animated job entries
13. Mobile fallback tier + reduced-motion gates
14. Vercel deploy + domain
```

**Parallelizable:** Steps 2–4 (DOM-only work) and step 5 (asset optimization) run in parallel with R3F setup (step 6).
**Strictly sequential:** Steps 6 → 7 → 8. Camera keyframes cannot be tuned against placeholder geometry.

---

## Pitfalls Mapped to Phases

| Phase | Pitfall | Mitigation |
|-------|---------|------------|
| Scaffold | Tailwind v4 ↔ Shadcn class mismatch | `npx @tailwindcss/upgrade`; audit generated components; `@import "tailwindcss"` |
| Scaffold | `@/` alias missing → shadcn init breaks | Set `tsconfig.json` paths + restart dev server BEFORE `shadcn init` |
| Scaffold | Import globals.css in wrong place | Import once in root `Layout.astro`; `tailwind({ applyBaseStyles: false })` |
| Architecture | Drei ScrollControls vs GSAP ScrollTrigger | ScrollTrigger only; zero ScrollControls |
| Architecture | Raw `useEffect` GSAP in Strict Mode | `@gsap/react` `useGSAP()` hook only |
| 3D | Raw .glb destroying load time | gltf-transform Draco + WebP before committing |
| 3D | `frameloop="always"` burning GPU | `frameloop="demand"` + `invalidate()` from GSAP ticker |
| 3D | GSAP + useFrame write conflict | GSAP → plain ref → useFrame → Three.js |
| 3D | Mobile GPU overload | `dpr={[1, 1.5]}`, merge meshes, WebP/KTX2 textures, tier-based fallback |
| Hydration | Canvas CLS on load | Reserve canvas space; `client:only="react"` |
| Scroll | iOS address bar resize jank | `100dvh` + `ignoreMobileResize` + debounced `refresh()` |

---

## Responsive Breakpoints (Tailwind min-width)

- `sm:` 375px+ (mobile)
- `md:` 768px+ (tablet portrait)
- `lg:` 1024px+ (tablet landscape / small desktop)
- `2xl:` 1920px+ (large desktop)

Default classes only. No arbitrary values (`pt-[50px]`, `bg-[#ff00ff]`). Enforced by linting or manual review.

---

## Open Decisions (Defer to Planning)

- SmoothUI vs Motion Primitives overlap — research says use both; defer exact component selection per-feature to planning phase
- Exact camera keyframes (position start, position end, ease curve) — depends on optimized model, defer until Step 8 of build order
- Draco vs KTX2 trade-off for textures — decide after seeing optimized file size
- Project image slider library vs custom (embla-carousel is a Shadcn-compatible option)

---

## Source Files

- `STACK.md` — package versions + setup commands
- `FEATURES.md` — table stakes / differentiators / anti-features / scroll + OS patterns
- `ARCHITECTURE.md` — R3F + Astro + GSAP integration specifics
- `PITFALLS.md` — 10 concrete failure modes with prevention + phase tags
