---
phase: 02-layout-nav-footer-hero
fixed_at: 2026-04-22T02:27:30Z
review_path: .planning/phases/02-layout-nav-footer-hero/02-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 4
skipped: 2
status: partial
---

# Phase 2: Code Review Fix Report

**Fixed at:** 2026-04-22T02:27:30Z
**Source review:** `.planning/phases/02-layout-nav-footer-hero/02-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (1 High, 2 Medium, 3 Low)
- Fixed: 4
- Skipped: 2 (both deferred per reviewer's explicit Phase 2 recommendation)

Build status after every fix: `bun run check && bun run build` → exit 0. All three hero strings (`Hi, I'm Ronald.`, `Senior Full-Stack Developer`, `pixel-sharp`) still present in `dist/index.html` after each commit.

---

## Fixed Issues

### HI-01: Duplicate hero copy rendered for JS-disabled users

**Files modified:** `src/pages/index.astro`
**Commit:** `6caa96d`
**Applied fix:**

- Removed the `<noscript>` block (lines 58–77 in the pre-fix file) that duplicated the hero's name / role / tagline markup.
- Updated the top-of-file doc-comment so it no longer justifies the removed `<noscript>` rationale; explicitly states the SSR'd `HeroTyping` island is the single source of truth for HERO-001.

**Before:** `dist/index.html` contained two copies of each hero string (SSR island + noscript) for JS-disabled users — stacked duplicate `<h1>`, role, tagline.

**After:** Exactly one rendered hero copy (SSR island only). `grep -c noscript dist/index.html` → 0. `Senior Full-Stack Developer` occurrences drop from 5 to 4 (remaining 4 = `<title>` + serialized astro-island props + sr-only mirror + visual animated element — all legitimate post ME-02).

**HERO-001 compliance:** Unchanged — SSR seam in `HeroTyping.tsx` continues to emit final strings during static build, so JS-disabled users see the full hero copy without duplication.

---

### ME-01: React 19 hydration mismatch warning on non-reduced-motion clients

**Files modified:** `src/components/HeroTyping.tsx`
**Commit:** `deb9530`
**Applied fix:**

- Added `suppressHydrationWarning` to the three text-bearing elements (`<h1>` name, `<p>` role, `<p>` tagline) in the component JSX.
- Does NOT touch the caret `<span>`s — those are `null` during SSR and line-0/1/2 renders, so no mismatch to suppress.

**Rationale:** The Plan 03 SSR seam intentionally renders final-state text lengths on the server (`[name.length, role.length, prefix+tagline.length]`) while the first client render starts at `[0, 0, 0]` before the typewriter effect fires. That intentional mismatch is exactly what `suppressHydrationWarning` is designed for.

**Verification:** Build passes; hero strings present in `dist/index.html`. The `suppressHydrationWarning` attribute is stripped during SSR (it's a React-only hint), so no visible HTML change.

---

### ME-02: Typing animation triggers screen-reader re-announcement on every character

**Files modified:** `src/components/HeroTyping.tsx`
**Commit:** `d9c53a7`
**Applied fix:**

- Added a visually-hidden mirror (`<div className="sr-only">`) containing the final three strings (`<h1>{name}</h1>`, `<p>{role}</p>`, `<p>{TAGLINE_PREFIX}{tagline}</p>`) — screen readers announce this once, stable content.
- Added `aria-hidden="true"` to the three animated elements so screen readers ignore the per-character re-renders during the typing animation.
- Demoted the visual `<h1>` to a `<div>` with identical styling — this is necessary because a biome `lint/a11y/useHeadingContent` rule requires accessible content on headings, and `aria-hidden` removes that. Moving the `<h1>` tag to the sr-only mirror keeps the document's single accessible `<h1>` promise (UI-SPEC §A11y: "`<h1>` used exactly once") while the visual element loses only its tag name — styling/size/role are unaffected.

**Before:** VoiceOver / NVDA could re-announce partial text or the final text repeatedly as the typing animation tick re-rendered the three elements (~49 renders for the tagline alone).

**After:** Exactly one screen-reader announcement of the final hero copy (from the sr-only mirror). Visual output is pixel-identical — the sr-only utility is a Tailwind v4 default and renders nothing to sighted users.

**Visual QA (diff vs UI-SPEC):** Spec's §Hero Composition declares the name as H1 conceptually. With this change, the accessible heading remains an `<h1>` in the DOM (in the sr-only mirror), preserving document outline. The visual `<div>` keeps `font-pixel text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-zinc-100 leading-tight` — identical styling to the previous `<h1>`. No visual regression.

**Interaction with LO-01:** Both fixes applied sequentially and compose cleanly.

---

### LO-01: `prefersReducedMotion()` invoked twice at component mount

**Files modified:** `src/components/HeroTyping.tsx`
**Commit:** `9da73f3`
**Applied fix:**

- Hoisted `prefersReducedMotion()` into a single local `const prefersReduced` at the top of the component body.
- Fed the same value into all three consumers (`useState(reduced)`, `useState(phase)`, `useState(shown)` lazy init).

**Before:** `prefersReducedMotion()` called at lines 93 and 97 plus indirectly at line 106 — three `window.matchMedia(...)` evaluations on the same tick.
**After:** Single invocation.

**Semantics:** Identical. All three call sites are on the same tick with no `matchMedia` listener in between, so the return value could not have differed. This is purely a cleanup.

---

## Skipped Issues

### LO-02: `linesRef.current` reassigned on every render

**File:** `src/components/HeroTyping.tsx:113-114`
**Reason:** Deferred per reviewer's own Phase 2 recommendation. The REVIEW.md Fix section states: *"Accepting as-is is fine given the props are compile-time constants; flagging for awareness only."* The reassignment allocates a new tuple on every render, but the three props (`name`, `role`, `tagline`) are static compile-time strings from `index.astro`'s `const hero = {...}`, so the ref value never actually changes. Negligible cost, no correctness bug, and the current code documents intent (always-latest-props-in-ref). Changing it introduces a small useEffect churn without functional benefit.
**Original issue:** Unnecessary per-render tuple allocation for effectively-immutable inputs. Flagged for awareness only.

---

### LO-03: Header inline comment references scroll-padding-top kept in sync "manually"

**File:** `src/components/Header.astro:7`
**Reason:** Deferred per reviewer's own Phase 2 recommendation. The REVIEW.md Fix section states: *"**Recommended action for Phase 2: no change**; ensure any future nav-height change updates both locations."* The only structural fix suggested would use arbitrary-value bracket syntax (`h-[var(--spacing-nav)]`) which violates AGENTS.md §Hard Rules ("No arbitrary Tailwind values"). The proper fix belongs in a later phase that can register a spacing token via a Tailwind plugin without breaking FND-009.
**Original issue:** `h-16` in Header.astro and `scroll-padding-top: 4rem` in globals.css live in different files coupled only by a code comment — silent drift risk.

---

## Post-fix verification

- `bun run check` (biome + astro check): PASS (0 errors, 0 warnings, 0 hints)
- `bun run build`: PASS (static build → `dist/index.html`, 1 page built)
- Hero strings in `dist/index.html`:
  - `Hi, I'm Ronald.` → 2 occurrences (sr-only `<h1>`, visual `<div>`) ✓
  - `Senior Full-Stack Developer` → 4 occurrences (`<title>`, astro-island serialized props, sr-only `<p>`, visual `<p>`) ✓
  - `pixel-sharp` → 3 occurrences (astro-island serialized props, sr-only `<p>`, visual `<p>`) ✓
- `<noscript>` block count: 0 ✓
- `aria-hidden` on visual hero elements: 3 (name div, role p, tagline p) ✓
- `sr-only` wrapper present: 1 ✓

---

_Fixed: 2026-04-22T02:27:30Z_
_Fixer: gsd-code-fixer_
_Iteration: 1_
