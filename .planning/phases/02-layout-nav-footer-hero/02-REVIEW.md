---
phase: 02-layout-nav-footer-hero
status: fixed
reviewed_at: 2026-04-22T02:25:00Z
fixed_at: 2026-04-22T02:27:30Z
fix_report: .planning/phases/02-layout-nav-footer-hero/02-REVIEW-FIX.md
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/components/Header.astro
  - src/components/Footer.astro
  - src/components/HeroTyping.tsx
  - src/pages/index.astro
  - src/styles/globals.css
severity_counts:
  critical: 0
  high: 1
  medium: 2
  low: 3
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
resolution:
  fixed: 4
  skipped: 2
  fixed_ids: [HI-01, ME-01, ME-02, LO-01]
  skipped_ids: [LO-02, LO-03]
  skipped_rationale: reviewer's own Phase 2 recommendation was "no change" on both; LO-03's suggested fix additionally violates FND-009 (no arbitrary Tailwind values).
---

# Phase 2: Code Review Report

**Reviewed:** 2026-04-22T02:25:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** findings

## Summary

Phase 2 delivers a tight, well-structured landing page. Hard rules are respected: zero arbitrary Tailwind values, `outline-hidden` everywhere, `min-h-dvh` not `100vh`, `target="_blank"` pairs with `rel="noopener noreferrer"`, reduced-motion respected across CSS + JS paths, focus-visible rings are consistent and accessible, and copy matches §Copywriting exactly.

Six findings, one of which is blocking. The blocking issue is a **HERO-001 regression** introduced by the Plan 03 SSR seam: because the `HeroTyping` island now renders its full final-text markup during SSR (via the `typeof window === 'undefined'` branch), the `<noscript>` belt-and-braces block in `index.astro` is no longer redundant — it's **additive**. JS-disabled users see the hero copy rendered twice. The Plan 03 summary even documents "`Senior Full-Stack Developer` appears 2× (island SSR + noscript)" in `dist/index.html` but treats this as correctness proof rather than flagging the duplicate.

Two medium findings track known caveats: the hydration text-content mismatch the Plan 03 summary explicitly calls out as pending the human checkpoint, and the screen-reader re-announcement behavior of the typing animation (no `aria-hidden` / `aria-live` treatment on the text-bearing elements). Remaining items are low-severity cleanups.

## High

### HI-01: Duplicate hero copy rendered for JS-disabled users (HERO-001 UX regression)

**File:** `src/pages/index.astro:51-77`
**Category:** bug / HERO-001
**Issue:** The Plan 03 SSR seam (`typeof window === 'undefined'` branch in `HeroTyping.tsx:105-110`) now emits the three hero strings as part of the `<astro-island ssr>` server-rendered output. The `<noscript>` fallback at lines 58-77 renders the same three strings a second time. Browsers render `<noscript>` contents when JavaScript is disabled in the browser — which is exactly the HERO-001 audience. Verified via `bun run build`: `dist/index.html` contains `Senior Full-Stack Developer` and `pixel-sharp` in both the island block and the noscript block. With JS off, the user sees two stacked hero blocks (duplicate `<h1>Hi, I'm Ronald.</h1>`, duplicate role, duplicate tagline). This does not technically violate HERO-001's letter ("copy is visible"), but it ships broken UX to the exact segment that requirement exists to protect.

The `<noscript>` was correct when HeroTyping's SSR output was empty (pre-Plan 03). The Plan 03 seam patch made the island self-sufficient for HERO-001 and the noscript block should have been retired at the same time.

The belt-and-braces justification in the source comment ("covers the edge case where JS fails to execute after HTML parse, e.g. blocked by a CSP extension") does not hold: in CSP-blocked / extension-blocked scenarios the browser still considers JS enabled, so `<noscript>` does not render. The only scenario where `<noscript>` renders is pure JS-off, which is already handled by the island's SSR output.

**Fix:** Remove the `<noscript>` block. The SSR seam is the single source of truth for HERO-001.

```astro
  <section id="hero" class="relative flex min-h-dvh scroll-mt-16 items-center">
    <div
      class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-12 lg:py-32"
    >
      <HeroTyping
        client:load
        name={hero.name}
        role={hero.role}
        tagline={hero.tagline}
      />
-
-      <noscript>
-        <div class="flex flex-col gap-4 md:gap-6">
-          <h1 class="font-pixel text-3xl leading-tight text-zinc-100 sm:text-4xl md:text-5xl lg:text-6xl">
-            {hero.name}
-          </h1>
-          {/* ...rest of duplicate block... */}
-        </div>
-      </noscript>
    </div>
```

Alternative (not recommended): remove the SSR seam from `HeroTyping.tsx` instead, which would restore noscript as the sole HERO-001 path. This would re-introduce a flash of empty hero on JS-enabled clients and regress the Plan 03 design.

Update the `index.astro` header comment to remove the `<noscript>` rationale at the same time.

## Medium

### ME-01: React 19 hydration mismatch warning on non-reduced-motion clients

**File:** `src/components/HeroTyping.tsx:105-110, 209-223`
**Category:** hydration
**Issue:** The Plan 03 SSR seam renders final-state text lengths on the server (`shown = [name.length, role.length, prefix+tagline.length]`). On the first client render of a non-reduced-motion user, the `useState` lazy init re-runs and returns `[0, 0, 0]` (empty). This produces a text-content mismatch inside `<h1>` and two `<p>` elements, which React 19 flags as a hydration warning to the console. The warning is non-fatal and the animation recovers correctly via `setShown([0, 0, 0])` in the effect, but it pollutes the console in both dev and prod and is an explicit outstanding item from the Plan 03 summary:

> "Pragma: if the hydration-mismatch console warning surfaces during the Task 2 human checkpoint, the mitigation is to also add `suppressHydrationWarning` to the three text-bearing elements. This has NOT been applied preemptively…"

The checkpoint is pending, but the warning is deterministic — any non-reduced-motion client hits it. Apply the mitigation now rather than waiting for the checkpoint to surface it.

**Fix:** Add `suppressHydrationWarning` to the three text-bearing elements. The caret `<span>`s don't need it (they're `null` during SSR and line-0/1/2 renders — the mismatch is scoped to the text children).

```tsx
    <div className="flex flex-col gap-4 md:gap-6">
      <h1
        suppressHydrationWarning
        className="font-pixel text-3xl leading-tight text-zinc-100 sm:text-4xl md:text-5xl lg:text-6xl"
      >
        {visibleName}
        {currentLine === 0 ? caretNode(false) : null}
      </h1>

      <p
        suppressHydrationWarning
        className="font-pixel text-base leading-snug text-purple-400 sm:text-lg md:text-xl lg:text-2xl"
      >
        {visibleRole}
        {currentLine === 1 ? caretNode(false) : null}
      </p>

      <p suppressHydrationWarning className="text-sm leading-relaxed sm:text-base md:text-lg">
        {renderTagline(tagline, shown2)}
        {currentLine === 2 ? caretNode(false) : null}
        {isDone ? caretNode(true) : null}
      </p>
    </div>
```

### ME-02: Typing animation triggers screen-reader re-announcement on every character

**File:** `src/components/HeroTyping.tsx:207-224`
**Category:** a11y
**Issue:** The three text-bearing elements (`<h1>`, role `<p>`, tagline `<p>`) re-render on every character during typing (~49 renders for the tagline over ~1090ms). Screen readers treat text content changes inside non-`aria-hidden`, non-`aria-live="off"` regions as potential announcements. Different SR/browser combinations handle this differently (VoiceOver and NVDA both have been observed to announce partial text updates or the final text repeatedly), producing at best noisy and at worst unintelligible audio for AT users. The caret itself is correctly marked `aria-hidden="true"` (line 200), but the text-bearing elements around it are not.

HERO-004 handles the reduced-motion path (no animation at all), which is the correct visual treatment for users with motion preferences — but screen-reader users do not necessarily set `prefers-reduced-motion`. The a11y concern is orthogonal to the motion concern.

**Fix:** Apply `aria-hidden="true"` to the three animated elements while the animation is running, and render the final strings once in a visually-hidden live region so screen readers get exactly one announcement. When the animation completes (`isDone`), remove `aria-hidden` from the real elements and hide the SR-only mirror (or simply leave both — the SR mirror is never rendered to sighted users).

```tsx
    <div className="flex flex-col gap-4 md:gap-6">
      {/* SR-only: announce the final hero copy exactly once */}
      <div className="sr-only">
        <p>{name}</p>
        <p>{role}</p>
        <p>{TAGLINE_PREFIX}{tagline}</p>
      </div>

      <h1
        aria-hidden="true"
        suppressHydrationWarning
        className="font-pixel text-3xl leading-tight text-zinc-100 sm:text-4xl md:text-5xl lg:text-6xl"
      >
        {visibleName}
        {currentLine === 0 ? caretNode(false) : null}
      </h1>

      <p
        aria-hidden="true"
        suppressHydrationWarning
        className="font-pixel text-base leading-snug text-purple-400 sm:text-lg md:text-xl lg:text-2xl"
      >
        {visibleRole}
        {currentLine === 1 ? caretNode(false) : null}
      </p>

      <p
        aria-hidden="true"
        suppressHydrationWarning
        className="text-sm leading-relaxed sm:text-base md:text-lg"
      >
        {renderTagline(tagline, shown2)}
        {currentLine === 2 ? caretNode(false) : null}
        {isDone ? caretNode(true) : null}
      </p>
    </div>
```

Note: `sr-only` is a Tailwind v4 default utility, not an arbitrary value — FND-009 clean.

## Low

### LO-01: `prefersReducedMotion()` invoked twice at component mount

**File:** `src/components/HeroTyping.tsx:92-98`
**Category:** code quality
**Issue:** Both `useState` lazy initializers call `prefersReducedMotion()` on the same tick (line 93 and line 97). The second call re-runs `window.matchMedia(...)`. Same tick, same result, so no bug — just a redundant media query evaluation and slightly noisy code.

**Fix:** Read once into a local variable before the state hooks.

```tsx
export default function HeroTyping({ name, role, tagline }: HeroTypingProps) {
  const prefersReduced = prefersReducedMotion();

  const [reduced] = useState<boolean>(() => prefersReduced);

  const [phase, setPhase] = useState<Phase>(() =>
    prefersReduced ? { kind: 'done' } : { kind: 'idle' },
  );

  const [shown, setShown] = useState<[number, number, number]>(() => {
    if (typeof window === 'undefined' || prefersReduced) {
      return [name.length, role.length, TAGLINE_PREFIX.length + tagline.length];
    }
    return [0, 0, 0];
  });
```

### LO-02: `linesRef.current` reassigned on every render

**File:** `src/components/HeroTyping.tsx:113-114`
**Category:** code quality
**Issue:** `linesRef.current = [name, role, TAGLINE_PREFIX + tagline];` runs unconditionally on every render, allocating a new tuple each time. The three string props are static (set once from `index.astro` `const hero = {...}`), so the ref value never actually changes over the component's lifetime. Not a correctness bug — the ref always points to the latest props even under a hypothetical parent re-render — but it's unnecessary allocation for what is effectively immutable input.

**Fix:** Either accept as-is (negligible cost, documents intent), or initialize via `useRef` lazy init and drop the reassignment:

```tsx
  const linesRef = useRef<[string, string, string]>([name, role, TAGLINE_PREFIX + tagline]);
  // Keep in sync only when props actually change:
  useEffect(() => {
    linesRef.current = [name, role, TAGLINE_PREFIX + tagline];
  }, [name, role, tagline]);
```

Accepting as-is is fine given the props are compile-time constants; flagging for awareness only.

### LO-03: Header inline comment references scroll-padding-top kept in sync "manually"

**File:** `src/components/Header.astro:7`
**Category:** code quality / maintainability
**Issue:** The component header comment says:

> `Height: h-16 (64px) — MUST stay synced with globals.css scroll-padding-top: 4rem.`

There is no enforcement mechanism — if a future change moves the nav to `h-20` (80px), `globals.css:167` (`scroll-padding-top: 4rem`) will silently become wrong and anchor-scroll will land either too high or overlap the nav. The two magic numbers live in different files with only a code comment tying them together.

**Fix:** Define the nav height as a single `@theme` token in `globals.css` and consume it in both places. Tailwind v4 `@theme` variables are emitted as CSS custom properties, so both `h-16` (via a custom theme token) and `scroll-padding-top` can reference the same source.

```css
/* globals.css */
@theme {
  --spacing-nav: 4rem; /* 64px — nav height + scroll-padding-top */
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: var(--spacing-nav);
}
```

```astro
<!-- Header.astro -->
<header class="... h-[var(--spacing-nav)] ...">
```

Caveat: `h-[var(--spacing-nav)]` uses the arbitrary-value bracket syntax that FND-009 forbids. A cleaner v1 approach is to leave the two in sync manually (current state) and accept the comment as the coupling document, OR defer the refactor to a later phase that can adopt a Tailwind plugin / registered spacing token properly. **Recommended action for Phase 2: no change; ensure any future nav-height change updates both locations.**

---

_Reviewed: 2026-04-22T02:25:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
