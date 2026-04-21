---
phase: 02-layout-nav-footer-hero
plan: 02
subsystem: hero
status: complete
tags:
  - react-island
  - hero
  - typing-animation
  - reduced-motion
  - accessibility
requires: []
provides:
  - "src/components/HeroTyping.tsx (default export HeroTyping)"
affects:
  - "Plan 02-03 will import this as client:load island inside src/pages/index.astro"
tech_stack:
  added: []
  patterns:
    - "React 19 FSM with useState/useEffect + setTimeout"
    - "Single-flag effect cleanup (`cancelled` + `clearTimeout`)"
    - "matchMedia read once at mount (no live listener)"
key_files:
  created:
    - "src/components/HeroTyping.tsx (217 lines)"
  modified: []
decisions:
  - "Used lazy-init useState(() => prefersReducedMotion()) to capture the setting synchronously and short-circuit BOTH phase and shown counters on mount (prevents a render flash of '[0,0,0]' before the effect runs)."
  - "Caret logic: solid while typing (no .animate-caret class), blinking only at final rest on line 3. Idle + holding states render no caret — simpler than positioning a roaming solid caret at intermediate line breaks, and matches UI-SPEC 'during typing, caret is solid (no blink)'."
  - "Graceful fallback for missing 'pixel-sharp' substring: renders the entire tagline body in zinc-500 font-sans (no crash, no highlight). The locked Phase 2 tagline contains the word, so this is robustness only."
metrics:
  completed: 2026-04-22
  duration_minutes: ~12
  tasks: 1
  files_touched: 1
requirements_completed:
  - HERO-001
  - HERO-002
  - HERO-004
  - FND-009
---

# Phase 2 Plan 02: HeroTyping React Island Summary

React 19 typing-animation island with a finite state machine, reduced-motion short-circuit, and a blinking `.animate-caret` at rest. Single file, no other project files touched.

## One-liner

Delivered `src/components/HeroTyping.tsx` — a 217-line React 19 client component that progressively reveals `{name, role, tagline}` at 45 chars/sec with 400ms holds, blinks a purple-400 `█` caret at rest on line 3, and renders the final state immediately when `prefers-reduced-motion: reduce`.

## State Machine (confirmed implemented)

All five transitions wired with the exact spec delays:

| # | Transition                 | Trigger                                        | Delay                  |
| - | -------------------------- | ---------------------------------------------- | ---------------------- |
| 1 | `idle` → `typing(0, 0)`    | `setTimeout(... , 0)` on mount                 | 0 ms                   |
| 2 | `typing(0, n)` → `holding(1)` | charIndex ≥ name.length                     | `HOLD_MS = 400` ms     |
| 3 | `holding(1)` → `typing(1, 0)` | synchronous `advance()` call                 | 0 ms (inside tick)     |
| 4 | `typing(1, n)` → `holding(2)` | charIndex ≥ role.length                     | `HOLD_MS = 400` ms     |
| 5 | `holding(2)` → `typing(2, 0)` | synchronous `advance()` call                 | 0 ms (inside tick)     |
| 6 | `typing(2, n)` → `done`    | charIndex ≥ (TAGLINE_PREFIX + tagline).length  | synchronous            |

Per-char tick: `CHAR_MS = 22` ms via `setTimeout`, one active timer at a time. Cleanup sets a `cancelled` flag and calls `clearTimeout` — safe under React 19 Strict Mode double-invoke (T-02-05 mitigation).

## Truth-by-truth Verification (12/12 passed)

| # | Truth                                                                                                        | Result |
| - | ------------------------------------------------------------------------------------------------------------ | ------ |
| 1 | Default-export React 19 component accepting `{ name, role, tagline }` string props                            | ✅     |
| 2 | Non-reduced path: line 1 types → 400ms hold → line 2 → 400ms → line 3 (~22ms/char, 45 chars/sec), stacked     | ✅     |
| 3 | After line 3, resting purple-400 `█` caret blinks via `.animate-caret` indefinitely                           | ✅     |
| 4 | While typing a line, caret is solid (no `animate-caret`), positioned at end of that line                      | ✅     |
| 5 | Reduced-motion: all three lines render immediately, NO caret, NO holds, single paint                          | ✅     |
| 6 | `window.matchMedia('(prefers-reduced-motion: reduce)')` read ONCE at mount via `useState` lazy init           | ✅     |
| 7 | Line 1 in `<h1 class="font-pixel text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-zinc-100 leading-tight">`  | ✅     |
| 8 | Line 2 in `<p class="font-pixel text-base sm:text-lg md:text-xl lg:text-2xl text-purple-400 leading-snug">`   | ✅     |
| 9 | Line 3: `>_ ` purple-400 font-pixel + body zinc-500 font-sans + `pixel-sharp` yellow-400; `text-sm sm:text-base md:text-lg leading-relaxed` | ✅ |
| 10| Stable element IDs / keys (no hydration warnings — all elements are static JSX positions, no list keys needed)| ✅     |
| 11| NO arbitrary Tailwind values — `grep -E '-\['` returns zero matches                                           | ✅     |
| 12| `bun run check` exits 0 (0 errors, 0 warnings); `bun run build` exits 0                                       | ✅     |

## Automated Verification Output

```
ALL GREP CHECKS PASS          # all 23 grep assertions in the plan's <automated> block
bun run check: 0 errors, 0 warnings, 0 hints (18 Astro files)
bun run build: ✓ Completed in 1.68s (1 page, 139 modules transformed)
```

The single esbuild CSS minify warning about `file:lines` is pre-existing — it comes from Tailwind v4 scanning markdown content elsewhere in `src/`, not from `HeroTyping.tsx` (confirmed via `grep` of the file for `file:`). Out of scope per the executor scope-boundary rule; logged here for transparency, not as a deviation.

## Deviations from the Draft Code in Task 1

The plan's draft contained three typos, all flagged in the plan's own "NOTE — two obvious typos to fix while writing" block and fixed during write-up:

| # | Typo in draft                                                                                                      | Fix applied                                                                                         |
| - | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 1 | `<span class-name-placeholder="">{/* placeholder replaced below */}</span>` inside the `!taglineHasYellow` branch | Replaced the placeholder branch with the correct two-span fallback: `>_ ` in purple-400 font-pixel + tagline body in zinc-500 font-sans. |
| 2 | `<div class-name="" className="...">` on the outer wrapper                                                         | Removed the stray `class-name=""` attribute — kept only `className="flex flex-col gap-4 md:gap-6"`. |
| 3 | `JSX.Element` as an explicit return type on `renderTagline`                                                        | Dropped the explicit return type (per plan's own Astro/React 19 note) — tsconfig uses `jsx: "react-jsx"` with no `JSX` global namespace; inference handles it cleanly. `bun run check` confirms. |

Formatter pass: ran `bunx biome format --write` once to convert JS string literals to single quotes per `biome.json`'s `quoteStyle: "single"` rule. JSX attributes remain double-quoted per `jsxQuoteStyle: "double"`. No semantic change.

**No Rule 1–3 auto-fixes triggered.** No architectural changes (Rule 4 gate). No authentication gates. No threat-model additions.

## Arbitrary Tailwind Values Check

```
grep -nE '\-\[' src/components/HeroTyping.tsx
# (no matches)
```

Every spacing / size / color token resolves to Tailwind defaults (FND-009 / D-21 compliance).

## Runtime Verification Deferred

Visual and behavioral verification — actual typing cadence, caret blink, reduced-motion short-circuit in a browser — is deferred to Plan 03's human-verify checkpoint, which mounts this island inside `src/pages/index.astro` with `client:load`. This plan ships the component in isolation; it has no renderable entry point of its own.

## Self-Check: PASSED

- ✅ `src/components/HeroTyping.tsx` exists (217 lines).
- ✅ Commit `b345aaa` exists: `feat(02-02): hero typing island with reduced-motion path`.
- ✅ All 12 truths from `must_haves.truths` confirmed against the committed source.
- ✅ Both gates (`bun run check`, `bun run build`) exit 0.

## Commits

| Hash      | Message                                                     |
| --------- | ----------------------------------------------------------- |
| `b345aaa` | feat(02-02): hero typing island with reduced-motion path    |
| (next)    | docs(02-02): summary                                        |
