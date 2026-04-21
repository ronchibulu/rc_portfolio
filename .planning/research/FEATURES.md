# Features Research: Frontend Portfolio

## Table Stakes
(must have — hiring manager expects these)

- **Name + role visible within first viewport** — recruiter must know who this is immediately
- **Project showcase with live URLs** — clickable links to real shipped work; broken links = instant credibility loss
- **Tech stack per project** — frontend roles specifically look for stack recognition
- **Contact method** — LinkedIn and email minimum; absence signals poor attention to detail
- **Responsive on mobile** — recruiters often review on phone; 3D fallback required
- **Fast first contentful paint** — heavy assets must not block initial render; use loading screen
- **No broken layout at common viewports** — 375px, 768px, 1280px, 1920px

## Differentiators
(what makes this portfolio stand out)

- **Scroll-driven 3D scene** — gaming setup model with GSAP camera fly-in directly demonstrates Three.js and GSAP expertise; rare in frontend portfolios
- **OS simulator UI** — desktop metaphor is interactive and memorable; shows creative UI thinking beyond standard CRUD layouts
- **Storytelling scroll flow** — recruiter reads a narrative arc rather than a static resume dump; emotional engagement = memory retention
- **Typing text animation** — reinforces pixel/retro identity; shows animation craft at the text level
- **Animated job timeline** — scroll-triggered timeline inside About Me dialog demonstrates Framer Motion competency
- **Project image sliders with tech badges** — visual proof of shipped work + at-a-glance stack reading
- **Dark pixel/8-bit cohesive aesthetic** — strong visual identity signals design sensibility, not just dev chops
- **Retro Grid background** (magicui.design) — immediately sets OS screen apart from generic portfolio sections

## Anti-Features
(deliberately exclude — these hurt)

- **Auto-playing audio** — instant tab close
- **Orbit controls on hero model** — breaks the curated camera story; user should not freely rotate
- **Cursor trail / sparkle effects** — overused gimmick, costs GPU, adds no information
- **Parallax on every section** — dilutes the focal 3D scroll effect; use sparingly
- **Fake loading percentage** — avoid fake progress bars; use a real loading state tied to asset load events
- **Excessive pinned scroll sections** — more than 2-3 pins feels trapped; reserve pinning for the 3D camera fly-in only
- **Resume PDF embedded as iframe** — breaks on mobile; link to download PDF instead if needed
- **Light mode** — dark-only by design; toggle adds complexity with no benefit for this aesthetic

## Scroll Storytelling Patterns

### What works
- **One scroll gesture = one beat** — each distinct scroll gesture advances exactly one narrative moment
- **GSAP `scrub: true`** — ties animation frame-perfectly to scroll position; feels physical, not timed
- **Pinned section for camera fly-in** — pin the 3D scene section so scroll drives the camera without the page jumping away
- **Text overlays that fade in and out** — taglines appear as user enters a scroll zone, dissolve as they leave
- **Hard cut at transition** — camera reaching the monitor → immediate cut to OS screen feels like "entering" the monitor; slow fades here break the illusion
- **Clear scroll progress indication** — subtle down-arrow or scroll cue at hero prevents "nothing is happening" confusion
- **Mobile: replace scroll narrative with stacked sections** — vertical stack of static key moments instead of pinned scroll scenes

### What fails
- **Camera animation longer than ~2 scroll heights** — user loses patience; complete fly-in within one viewport pin
- **No visual feedback during pin** — user must see the camera moving; if the model is static during scroll pin the UX feels broken
- **Too many concurrent animations** — multiple elements animating simultaneously during scroll = jank and cognitive overload

## OS Simulator UI Patterns

### What works
- **Retro title bar** — fake OS name, pixel clock, minimize/close buttons; reinforces metaphor
- **Folder icons on CSS grid** — 3-4 columns desktop, 2 columns tablet, 1-2 columns mobile
- **Single-click to open** (not double-click on mobile — double-tap is unreliable on touch)
- **Dialog as OS window** — title bar with close button, inner scrollable content area
- **Retro Grid / dot-grid background** on OS screen — establishes "virtual desktop" spatial context
- **Scanline CSS overlay** — subtle `repeating-linear-gradient` scanline on OS screen reinforces CRT aesthetic without GPU cost
- **Focus trap in dialog** — keyboard users tab within the dialog; Escape closes; Shadcn Dialog handles this

### UX gotchas
- **Dialog scroll must be independent** — content inside dialog scrolls; body behind does not move
- **Mobile folder tap targets** — minimum 44×44px; pixel font labels need adequate spacing
- **Dialog width on mobile** — full-screen bottom sheet pattern on mobile beats a small centered modal
- **Project slider accessibility** — arrow button labels, `aria-label` per image, keyboard prev/next

## Mobile & Reduced Motion Strategy

### 3D fallback tiers
```
High-end (hardwareConcurrency ≥ 8, GPU tier ≥ 2):
  → Full R3F scene, dpr=[1, 2]

Mid-range (hardwareConcurrency 4-7, GPU tier 1):
  → R3F scene, dpr=[1, 1.5], reduced texture quality

Low-end (hardwareConcurrency < 4, GPU tier 0) OR mobile:
  → Static PNG screenshot of gaming setup + CSS parallax
  → Skip camera fly-in; fade directly to OS screen
```

Detect with `detect-gpu` package (`getGPUTier()`).

### Reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable: typing animation, scroll scrub camera, text fade-ins */
  /* Keep: static 3D scene render, static layout */
}
```

Framer Motion: `const prefersReduced = useReducedMotion()` — conditionally skip `animate` props.

GSAP: check before registering ScrollTrigger:
```js
const mm = gsap.matchMedia()
mm.add('(prefers-reduced-motion: no-preference)', () => { /* register triggers */ })
```

## Sources

- GSAP ScrollTrigger + R3F patterns: gsap.com/docs, pmnd.rs/react-three-fiber docs
- Drei View/Port pattern: github.com/pmndrs/drei
- OS simulator portfolio inspiration: linusrogge.com, bruno-simon.com
- Retro Grid component: magicui.design/docs/retro-grid
- Mobile GPU detection: github.com/pmndrs/detect-gpu
- Scroll storytelling reference: awwwards.com (top sites 2024-2025)
