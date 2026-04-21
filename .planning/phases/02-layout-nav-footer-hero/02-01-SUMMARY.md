---
phase: 02-layout-nav-footer-hero
plan: 01
subsystem: layout
status: passed
tags: [layout, nav, footer, css, keyframes, reduced-motion]
requires: []
provides:
  - Header.astro (sticky top nav)
  - Footer.astro (contact footer)
  - .animate-caret utility (consumed by Plan 02)
  - .animate-scrollbob utility (consumed by Plan 03)
  - html scroll-behavior: smooth + reduced-motion override
affects: []
tech-stack:
  added: []
  patterns:
    - "CSS @keyframes hand-rolled for scrollbob + caret-blink"
    - "@media (prefers-reduced-motion: reduce|no-preference) gating"
    - "Tailwind v4 class-rename convention (outline-hidden not outline-none)"
key-files:
  created:
    - src/components/Header.astro
    - src/components/Footer.astro
  modified:
    - src/styles/globals.css (appended ~73 lines for Phase 2 additions)
decisions: []
metrics:
  duration: ~5 min
  completed: 2026-04-22
---

# Phase 02 Plan 01: Layout primitives Summary

Established the Phase 2 layout primitives: sticky `Header.astro` with RC brand + Projects/About/Contact anchors, `Footer.astro` with LinkedIn + email + copyright, and the three CSS foundations (smooth-scroll with reduced-motion override, `@keyframes scrollbob` / `.animate-scrollbob` utility, `@keyframes caret-blink` / `.animate-caret` utility) that Plans 02 and 03 build on.

## What Was Delivered

| File | Lines (before → after) | Purpose |
|------|------------------------|---------|
| `src/styles/globals.css` | 151 → 224 | Appended Phase 2 block: html scroll-behavior smooth + scroll-padding-top 4rem, reduced-motion auto override, @keyframes scrollbob (no-preference gated), @keyframes caret-blink + .animate-caret utility. All Phase 1 content preserved verbatim. |
| `src/components/Header.astro` | new file, 59 lines | Sticky top nav per 02-UI-SPEC §Nav Contract. |
| `src/components/Footer.astro` | new file, 37 lines | Footer per 02-UI-SPEC §Footer Contract. |

## Truth-by-Truth Verification

| # | Truth | Result |
|---|-------|--------|
| 1 | `globals.css` declares `html { scroll-behavior: smooth }` + `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto } }` override | PASS — both greps match (`scroll-behavior: smooth`, `scroll-behavior: auto`, `prefers-reduced-motion: reduce`) |
| 2 | `globals.css` defines `@keyframes scrollbob` (0,100 → translateY(0); 50 → translateY(4px)) exposed as `.animate-scrollbob` gated by `@media (prefers-reduced-motion: no-preference)` | PASS — `@keyframes scrollbob`, `.animate-scrollbob`, and `prefers-reduced-motion: no-preference` all grep-matched; keyframe values exact to spec |
| 3 | `globals.css` defines `@keyframes caret-blink` (opacity 1→0→1 over 1s) exposed as `.animate-caret` | PASS — `@keyframes caret-blink` + `.animate-caret` both grep-matched; 1s steps(1, end) infinite |
| 4 | `Header.astro` renders `<header>` with `<nav aria-label="Primary">`, `sticky top-0 z-40 h-16 border-b border-zinc-800`, `bg-zinc-950` + `md:bg-zinc-950/80 md:backdrop-blur-sm`, three anchors `Projects`/`About`/`Contact` → `#projects`/`#about`/`#contact` | PASS — all 9 greps (`aria-label="Primary"`, `sticky top-0 z-40`, `h-16`, `border-b border-zinc-800`, `backdrop-blur-sm`, `href="#projects"`, `href="#about"`, `href="#contact"`, `bg-zinc-950`) match |
| 5 | `Header.astro` anchors use `font-pixel text-xs sm:text-sm text-zinc-500 hover:text-purple-400 transition-colors` + focus-visible ring (purple-400, offset-2, offset-zinc-950, outline-hidden) + `min-h-11 inline-flex items-center` for ≥44px tap target | PASS — `font-pixel`, `text-zinc-500`, `hover:text-purple-400`, `focus-visible:outline-hidden`, `focus-visible:ring-purple-400`, `min-h-11` all grep-matched |
| 6 | `Header.astro` brand `RC` → `/` with `font-pixel text-sm md:text-base text-zinc-100 hover:text-purple-400` + same focus-ring | PASS — `href="/"` + `text-zinc-100` + `md:text-base` present; focus-visible ring classes identical to anchors |
| 7 | `Footer.astro` renders `<footer class="border-t border-zinc-800 py-8 px-4 sm:px-6 lg:px-12">` with flex container `flex flex-col gap-3 md:flex-row md:items-center md:justify-between` inside `mx-auto max-w-6xl` | PASS — `<footer`, `border-t border-zinc-800`, `py-8`, `max-w-6xl`, `flex-col gap-3 md:flex-row` all grep-matched |
| 8 | LinkedIn href = `https://www.linkedin.com/in/ronald-cheng-833038257` with `target="_blank" rel="noopener noreferrer"`; email href = `mailto:ronald1122323@gmail.com?subject=Portfolio` with visible text `ronald1122323@gmail.com` | PASS — all four greps (`linkedin.com/in/ronald-cheng-833038257`, `target="_blank"`, `rel="noopener noreferrer"`, `mailto:ronald1122323@gmail.com?subject=Portfolio`) match |
| 9 | Copyright `© 2026 Ronald Cheng` in `text-xs text-zinc-500` | PASS — literal string + class both present |
| 10 | NO arbitrary Tailwind values in either component (`grep -E '-\['` returns 0 matches) | PASS — `grep -nE '\-\['` on both files returns zero lines |
| 11 | `bun run check` exit 0 AND `bun run build` exit 0 | PARTIAL — `bun run build` exits 0 cleanly (static output generated). `astro check` exits 0 on 18 Astro files with 0 errors / 0 warnings / 0 hints. `bun run check`'s composite (`biome check src && astro check`) fails because Biome reports formatting errors in `src/components/HeroTyping.tsx`, an out-of-scope file owned by Plan 02-02 and already committed in commit `b345aaa`. Plan 02-01 is explicitly forbidden from modifying it. See Deviations below and `deferred-items.md`. |

**Truths verified: 10 / 11 fully PASS; 1 PARTIAL (composite `bun run check` blocked by scope-external file, but `astro check` and `bun run build` both exit 0 on their own).**

## No-Arbitrary-Values Audit

```bash
grep -nE '\-\[' src/components/Header.astro  # → 0 matches
grep -nE '\-\[' src/components/Footer.astro  # → 0 matches
```

Both components use only Tailwind default-scale utilities + the `@theme` breakpoint overrides (`sm:375`, `2xl:1920`) and the `--color-crt-accent` alias declared in `globals.css`. FND-009 and D-21 satisfied.

## Tailwind v4 Class-Rename Audit (D-17)

```bash
grep -q "outline-hidden" src/components/Header.astro  # → present
grep -q "outline-hidden" src/components/Footer.astro  # → present
grep -q "outline-none"   src/components/Header.astro  # → absent
grep -q "outline-none"   src/components/Footer.astro  # → absent
```

D-17 satisfied.

## Phase 1 globals.css Preservation

All Phase 1 tokens and blocks remain byte-for-byte intact. Spot-check greps:

- `@import "tailwindcss"` → 1 match
- `--font-pixel` → 1 match
- `--color-crt-accent` → 1 match
- `@custom-variant dark` → 1 match
- `@theme inline {` → 1 match (Shadcn mappings intact)
- `.dark,\n:root {` → intact (oklch palette untouched)
- `@layer base { * { @apply border-border outline-ring/50 } }` → intact
- `html,\nbody {\n  min-height: 100dvh;\n}` → intact (new content appended below)

## Deviations from Plan

### Scope-external issue discovered (not fixed)

**[Scope Boundary] Biome formatting errors in `src/components/HeroTyping.tsx`**

- **Found during:** Task 3 final `bun run check`.
- **Cause:** Plan 02-02 (ran in parallel, committed `b345aaa` before my verify ran) introduced `HeroTyping.tsx` using double-quoted string literals where the project's Biome config requires single quotes.
- **Why not fixed here:** The plan's `<hard_rules>` and AGENTS.md scope boundary forbid Plan 02-01 from modifying `HeroTyping.tsx`. The file is scope-external — Plan 02-02 owns it.
- **Logged to:** `.planning/phases/02-layout-nav-footer-hero/deferred-items.md` under entry `DEF-02-01-a`.
- **Impact:** `bun run check` (composite `biome check src && astro check`) cannot exit 0 until the biome formatting in HeroTyping.tsx is fixed. `astro check` alone exits 0. `bun run build` alone exits 0 and produces a clean static bundle — the typescript/astro compile + vite build pipeline does not run Biome. Plan 02-03 should begin by running `bunx biome format --write src/components/HeroTyping.tsx` (or the Plan 02-02 executor should be re-invoked to clean up).

### No plan-intrinsic deviations

Every class, attribute, and copy string in Header.astro and Footer.astro matches the UI-SPEC exactly. Every `<keyframes>`, media query, and utility class in the globals.css append matches the UI-SPEC and plan action block exactly.

## Threat Model Compliance

- **T-02-01 (Tampering — `target="_blank"` tabnabbing):** Mitigated. LinkedIn anchor has `rel="noopener noreferrer"`. Verified via grep.
- **T-02-02, T-02-03, T-02-04:** Accepted per plan threat model; no code change required.

No new threat surface introduced beyond what the `<threat_model>` declared.

## Commit Hashes

| Commit | Task | Files |
|--------|------|-------|
| `24631a3` | Task 1 — Extend globals.css | `src/styles/globals.css` |
| `c262d62` | Task 2 — Create Header.astro | `src/components/Header.astro` |
| `a7cee84` | Task 3 — Create Footer.astro | `src/components/Footer.astro` |

## Verification Commands Run

| Command | Result |
|---------|--------|
| `astro check` | exit 0 (18 Astro files, 0 errors, 0 warnings, 0 hints) |
| `bun run build` | exit 0 (dist generated, 1 page built in 1.50s) |
| `grep -nE '\-\['` (Header + Footer) | 0 matches (no arbitrary values) |
| All 11 truth greps | PASS |
| `bun run check` (composite) | exit 1 — blocked by scope-external `HeroTyping.tsx` biome format errors (see Deviations + `deferred-items.md`) |

## Visual Verification

Deferred to Plan 03's checkpoint task, per plan `<verification>` Manual/deferred note. Nothing consumes Header.astro or Footer.astro yet (index.astro is still the Phase 1 smoke page; Plan 03 composes them in).

## Self-Check: PASSED

- `src/styles/globals.css` exists, contains Phase 1 + Phase 2 content. ✓
- `src/components/Header.astro` exists. ✓
- `src/components/Footer.astro` exists. ✓
- Commit `24631a3` present in `git log --oneline --all`. ✓
- Commit `c262d62` present in `git log --oneline --all`. ✓
- Commit `a7cee84` present in `git log --oneline --all`. ✓
- All truth-table greps re-verified post-commit. ✓
