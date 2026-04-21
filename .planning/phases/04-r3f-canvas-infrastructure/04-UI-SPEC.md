---
phase: 4
slug: r3f-canvas-infrastructure
status: draft
shadcn_initialized: true
preset: nova (radix) — inherited from Phase 1 (unchanged)
created: 2026-04-22
---

# Phase 4 — UI Design Contract (Layering Contract)

> This is an **infrastructure spec**, not a visual design spec. Phase 4 adds no new typography,
> color tokens, spacing decisions, or copywriting. All visual design is inherited unchanged from
> the Phase 2 UI-SPEC. This document locks **how layers stack** so that Phases 5–7 build on a
> consistent z-index contract.

---

## Scope

Phase 4 delivers one DOM change: a `<SceneCanvas>` React island mounted in `index.astro` as a
fixed full-viewport div behind the existing hero/nav/footer. The contract below defines exactly
how that canvas layer integrates without breaking the Phase 2 UI.

---

## Z-Index Stack (Locked)

Every layer in the page gets a permanent z-index assignment. Future phases MUST NOT deviate from
these values without updating this table first.

| Layer | Element | z-index | Tailwind class | Position | Notes |
|-------|---------|---------|----------------|----------|-------|
| Canvas wrapper | `<div>` around `<SceneCanvas>` | 0 | `z-0` | `fixed` | Behind all HTML content. `pointer-events-none`. |
| Hero section | `<section id="hero">` | 10 | `z-10` | `relative` | Already `relative` from Phase 2; add `z-10`. |
| Placeholder sections | `<section id="projects/about/contact">` | 10 | `z-10` | `relative` | Same stacking as hero; add `z-10` to each. |
| Footer | `<footer>` | 10 | `z-10` | normal flow | Normal flow sits above fixed canvas automatically, but explicit `z-10` makes intent clear. |
| Nav header | `<header>` | 40 | `z-40` | `sticky top-0` | Already `z-40` from Phase 2 — **no change needed**. |
| Future: OS screen | Phase 7 element | 20 | `z-20` | TBD | Reserved slot between hero and nav. Phase 7 owns this. |
| Future: Dialogs / modals | Shadcn Dialog overlay | 50 | `z-50` | `fixed` | Shadcn default — above everything. No change. |

**Invariant:** Canvas is always z-0. Nothing in the content layer may drop below z-10. Nav stays at z-40. Dialogs stay at z-50.

---

## Canvas CSS Contract

The wrapper div around `<SceneCanvas>` uses these exact classes:

```html
<div
  class="pointer-events-none fixed inset-0 z-0"
  aria-hidden="true"
>
  <SceneCanvas client:only="react" />
</div>
```

| CSS property | Value | Rationale |
|---|---|---|
| `position` | `fixed` | Removes from document flow; stays anchored to viewport during scroll. |
| `inset-0` | `top:0; right:0; bottom:0; left:0` | Covers the full viewport at all breakpoints automatically. No responsive overrides needed. |
| `z-index` | `0` (`z-0`) | Behind all content layers. |
| `pointer-events` | `none` (`pointer-events-none`) | Mouse and touch events pass through to the HTML content above. |
| `aria-hidden` | `"true"` | Decorative 3D background — excluded from accessibility tree. |
| `width` | `100%` (from `inset-0`) | Full viewport width. |
| `height` | `100dvh` | **MUST use `100dvh` not `100vh`** (AGENTS.md hard rule, SCROLL-007). Prevents address-bar resize jank on mobile. |

The `<Canvas>` element rendered by R3F inside this wrapper inherits `width: 100%; height: 100%`
from R3F's default behaviour — no additional CSS override needed on the canvas element itself.

---

## R3F Canvas Props Contract

These props are locked for Phase 4. Phases 5–6 may augment but MUST NOT remove them.

```tsx
<Canvas
  frameloop="demand"          // SCENE-006 + AGENTS.md hard rule — renders only on invalidate()
  dpr={[1, 2]}                // Full quality default; Phase 10 gates to [1, 1.5] for mid-tier
  gl={{ antialias: true }}    // Default quality
  performance={{ min: 0.5 }}  // R3F adaptive DPR built-in
>
  <View.Port />               // Drei multi-scene port — required for Phase 5+ View regions
</Canvas>
```

**`frameloop="demand"` rule:** Phase 4 calls `invalidate()` once after mount (initial frame).
Phase 6 wires `invalidate()` to the GSAP ticker during active scroll. No other callers.

---

## Pointer Events Contract

The canvas layer MUST NOT intercept any pointer events from the foreground HTML.

| Interactive element | Expected behaviour | Mechanism |
|---|---|---|
| Nav anchors (Projects / About / Contact) | Clickable — scroll to section | `pointer-events-none` on canvas wrapper passes through |
| Nav brand "RC" | Clickable — returns to top | Same |
| Hero scroll-cue `▼` | Clickable — scrolls to `#projects` | Same |
| Footer LinkedIn link | Clickable — opens LinkedIn | Same |
| Footer email link | Clickable — opens mail client | Same |
| `<HeroTyping>` island | Mouse/keyboard events normal | Same |

**Verification:** After Phase 4 ships, manually tab through the page and click each interactive
element. All must respond normally. If any element is blocked, the canvas `pointer-events-none`
class has been removed or overridden — fix by restoring it.

---

## Phase 2 Compatibility — Required Changes

Phase 2 shipped without z-index on the hero and placeholder sections because there was no canvas
to stack against. Phase 4 requires these **minimal additions** to `index.astro`:

| Element | Phase 2 state | Phase 4 change |
|---|---|---|
| `<section id="hero">` | `class="relative flex min-h-dvh ..."` | Add `z-10`: `class="relative z-10 flex min-h-dvh ..."` |
| `<section id="projects">` | No `relative` or `z-10` | Add `relative z-10` |
| `<section id="about">` | No `relative` or `z-10` | Add `relative z-10` |
| `<section id="contact">` | No `relative` or `z-10` | Add `relative z-10` |
| `<footer>` | No `z-10` | Add `relative z-10` (or confirm normal-flow stacking is sufficient; explicit is safer) |
| `<header>` (nav) | `sticky top-0 z-40` | **No change** — already correct. |

**Verdict:** Phase 2 code requires only additive class changes — no structural rewrites, no style
deletions, no layout shifts. Phase 2 visual output is pixel-identical before and after canvas mount
(canvas is transparent until Phase 5 adds scene content).

---

## Loading State / Hydration Appearance

`<SceneCanvas client:only="react">` emits no server-side HTML. Before hydration, the canvas
wrapper div is in the DOM but the `<canvas>` element does not yet exist.

| State | Appearance |
|---|---|
| Pre-hydration (SSR) | `<div class="pointer-events-none fixed inset-0 z-0">` is an empty div. `body` `bg-zinc-950` shows through — identical to Phase 2. |
| During hydration | React renders `<Canvas>`. R3F creates the `<canvas>` element. One `invalidate()` fires → first frame renders (empty scene — black/transparent). |
| After hydration | Canvas is live. Scene is empty (Phase 5 adds model). `bg-zinc-950` body still visible through the transparent canvas. |

**No flash of wrong background.** The body `bg-zinc-950` provides the baseline dark fill at all
times. The canvas background must remain `transparent` (R3F default `alpha: true` or explicit
`gl={{ alpha: true }}`). Never set a canvas background color — the body is the background.

**PERF-001 (CLS prevention):** Because the canvas is `position: fixed`, it does not occupy
document flow space. No layout shift occurs on hydration. CLS score is 0 for this element.

---

## Responsive Coverage

`inset-0` (`top:0; right:0; bottom:0; left:0`) on a `fixed` element covers the exact viewport
at every breakpoint with zero additional media queries.

| Breakpoint | Canvas coverage | Mechanism |
|---|---|---|
| 375px (sm) | Full viewport | `fixed inset-0` |
| 768px (md) | Full viewport | `fixed inset-0` |
| 1024px (lg) | Full viewport | `fixed inset-0` |
| 1920px (2xl) | Full viewport | `fixed inset-0` |

No responsive overrides are needed for the canvas wrapper.

---

## Dark Mode / Background Color

- Canvas background: **`transparent`** (R3F default when `alpha: true`).
- Body `bg-zinc-950` (set in `BaseLayout.astro`) is the visible background color through the
  canvas at all times.
- Never apply a background color to the canvas wrapper div or the `<canvas>` element directly.
- Phase 5 may add a scene `<color>` primitive (e.g. `<color attach="background" args={['#09090b']} />`) to match `zinc-950` for the 3D viewport — that is a Three.js scene property, not a CSS concern.

---

## Accessibility

| Element | ARIA attribute | Value | Reason |
|---|---|---|---|
| Canvas wrapper `<div>` | `aria-hidden` | `"true"` | Decorative 3D background; no meaningful content for screen readers. |
| `<canvas>` element (R3F) | inherits `aria-hidden` from parent | — | Excluded from accessibility tree via parent. |

All meaningful content (nav, hero text, footer links) remains in foreground HTML layers with
full keyboard accessibility as specified in Phase 2 UI-SPEC §A11y Contract. Phase 4 adds no new
interactive elements and does not alter any existing ARIA roles, landmarks, or tab order.

---

## Registry Safety

| Registry | Blocks / Components | Safety Gate |
|---|---|---|
| shadcn official | None added in Phase 4 | not required |
| Third-party | None | not applicable |

Phase 4 uses `@react-three/fiber`, `@react-three/drei`, and `nanostores` — all already installed
in Phase 1–3. No new npm packages or shadcn registry fetches.

---

## Inherited Phase 2 Contract (Unchanged)

All of the following are inherited from `02-UI-SPEC.md` with **zero modifications**:

- Typography scale (pixel + sans, 4 sizes, 1 weight)
- Color tokens (zinc-950 / zinc-100 / purple-400 / yellow-400 / zinc-500 / zinc-800)
- Spacing scale (Tailwind default, no arbitrary values)
- Copywriting (hero strings, nav labels, footer links)
- Interaction states (hover/focus/active on nav + footer)
- Responsive breakpoint layout (375 / 768 / 1024 / 1920)
- Scroll-cue animation (CSS-only `animate-scrollbob`)
- Focus ring spec (`focus-visible:ring-2 ring-purple-400 ring-offset-zinc-950 outline-hidden`)

---

## Checker Sign-Off

- [ ] Z-index stack: all 7 layers declared with exact values and Tailwind classes
- [ ] Canvas CSS: `fixed inset-0 z-0 pointer-events-none aria-hidden` — all 4 constraints present
- [ ] Pointer events: all 5 interactive elements confirmed passthrough
- [ ] Phase 2 compatibility: 5 element changes listed, all additive, none destructive
- [ ] Loading state: pre/during/post hydration appearance matches Phase 2 baseline
- [ ] Responsive: `inset-0` confirmed sufficient for all 4 breakpoints
- [ ] Background: canvas transparent, body zinc-950 is the fill
- [ ] Accessibility: `aria-hidden="true"` on wrapper, no tab-order changes
- [ ] Registry Safety: no new blocks, no third-party registries

**Approval:** pending
