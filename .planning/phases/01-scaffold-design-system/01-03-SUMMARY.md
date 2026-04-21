---
phase: 01-scaffold-design-system
plan: 03
status: complete
completed: 2026-04-22
human_checkpoint: approved (with D-28 revision round)
---

# 01-03 Summary — Shadcn Init + 9 Components + Smoke Test + D-28 Palette Shift

## What was built

Shadcn installed against the existing Astro+Tailwind v4 shell (Radix/Nova preset), full downstream component set generated under `src/components/ui/`, Phase 1 smoke-test page showcases the palette/font/breakpoints, human visual verification passed after a user-requested palette shift from green→purple (D-28 added mid-phase).

## Shadcn install

```bash
bunx shadcn@latest init -t astro -b radix -p nova -y
```

- Style: `radix-nova` (Radix UI primitives + Nova preset — 2026 shadcn CLI default)
- components.json: `tsx: true`, `rsc: false`, `cssVariables: true`, `baseColor: neutral`, icon library: `lucide`
- Aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`
- Added 9 components via `bunx shadcn@latest add button dialog sheet card badge tooltip carousel scroll-area separator`
- `embla-carousel-react@^8.6.0` auto-installed by `shadcn add carousel` (D-18 satisfied)
- All 9 files under `src/components/ui/*.tsx` import `cn` from `@/lib/utils`

## V3 → V4 audit findings (D-17 / PITFALLS §7)

| Pattern | v3 | v4 | Found? |
|---------|----|----|--------|
| bare `shadow` | `shadow` | `shadow-sm` | None |
| bare `shadow-sm` (Input/Badge) | `shadow-sm` | `shadow-xs` | None |
| bare `rounded` | `rounded` | `rounded-sm` | None |
| `outline-none` | remove UA outline | `outline-hidden` | **Present in 3 files** (kept — see below) |
| bare `ring` | `ring` | `ring-3` | None |
| `[--var]` CSS-var | `bg-[--foo]` | `bg-(--foo)` | None |

**`outline-none` exception — kept intentionally:** Present in `button.tsx` (line 8), `dialog.tsx` (line 64), `scroll-area.tsx` (line 21). In each case it is paired with `focus-visible:border-ring focus-visible:ring-3` or `focus-visible:ring-[3px]`. This is the **intended 2026 Shadcn v4 focus pattern**: `outline-none` removes the default UA outline, keyboard focus is shown via the visible ring. Swapping to `outline-hidden` would have no observable effect. PITFALLS §7 targets the legacy v3 "remove outline without a replacement focus style" anti-pattern — we don't have that anti-pattern here.

## globals.css reconciliation

`shadcn init` appended content to our globals.css. We reconciled as follows:

**Removed:**
- `@import "@fontsource-variable/geist"` — project uses Press Start 2P only (D-13, D-19)
- `@import "shadcn/tailwind.css"` package dependency — replaced with the inline `@theme inline {}` block that maps color tokens to CSS vars
- Light-mode `:root {}` oklch block — dark only (D-22). The `.dark {}` oklch palette is applied to `:root` so it is the single palette
- `body { @apply bg-background text-foreground }` in `@layer base` — BaseLayout.astro owns the `<body class="bg-zinc-950 text-zinc-100 ...">` directly (D-22, D-23)

**Kept:**
- `@import "tw-animate-css"` — used by Shadcn animation utilities
- `@custom-variant dark (&:is(.dark *))` — forward-compat with Shadcn conditional dark styles
- `@theme inline { --color-* : var(--*) }` color-mapping block — component tokens (`bg-primary`, `text-foreground`, etc.) resolve through this
- `@layer base * { border-border outline-ring/50 }` — Shadcn components depend on these tokens

**Preserved from Plan 02:**
- `--font-pixel`, `--breakpoint-sm: 375px`, `--breakpoint-2xl: 1920px`, `--color-crt-accent` alias, dark-only html/body baseline

## Smoke-test page (`src/pages/index.astro`)

Renders per D-26:
- H1 `Phase 1 Design System` in `font-pixel text-purple-400 md:text-4xl lg:text-5xl`
- Shadcn `<Button>` default + secondary variants, `client:load`-hydrated React islands
- 9-cell palette grid: zinc-950, zinc-900, zinc-800, zinc-100, **purple-400**, **violet-400**, yellow-400, zinc-700, zinc-500
- Responsive breakpoint indicator spanning xs/sm/md/lg/2xl with `sm:hidden` → `2xl:block` chain
- CRT accent token demo using `text-(--color-crt-accent)` v4 CSS-var syntax

Arbitrary-value audit (D-21): Only `text-[10px]` (4 instances) on swatch labels — kept as documented surgical exception because `text-xs` (12px) is disproportionate to Press Start 2P's 8-pixel glyphs.

## D-28 mid-phase revision — retro dark+purple palette

During human visual verification (Task 3.3), the user reported: "The overall style should be in retro style with dark and purple theme color." The locked palette (green-400 CRT accent / lime-400 secondary) did not match the intent.

Resolution: Added **D-28** to CONTEXT.md, shifted accent from green→purple:
- `--color-crt-accent` alias: `var(--color-green-400)` → `var(--color-purple-400)`
- H1 color: `text-green-400` → `text-purple-400`
- Swatches: `bg-green-400`/`bg-lime-400` → `bg-purple-400`/`bg-violet-400`
- CRT accent caption: copy updated to reference purple
- Docs aligned: AGENTS.md, CLAUDE.md, .planning/PROJECT.md §Color palette, CONTEXT.md D-11 / D-12 / D-26
- Yellow highlight unchanged; zinc-950 dark base unchanged (accent shift only, not a background shift)
- Commit: `feat(01-03): D-28 retro dark+purple theme — swap CRT accent green→purple`

Plans 01-01 / 01-02 / 01-03 PLAN.md and 01-01 / 01-02 SUMMARY.md **were not rewritten** — they reflect what was executed before D-28 landed. This summary documents the change in one place.

## Verification

| Gate | Result |
|------|--------|
| `bun run check` (biome + astro check) | ✓ 0 errors / 0 warnings / 0 hints across 15 files |
| `bun run build` | ✓ `dist/index.html` + `.vercel/output/static/` produced, 195KB client bundle |
| `components.json` aliases match tsconfig paths | ✓ `@/components`, `@/lib/utils`, etc. resolve |
| All 9 components present at `src/components/ui/` | ✓ button, dialog, sheet, card, badge, tooltip, carousel, scroll-area, separator |
| `embla-carousel-react` in `package.json` (D-18) | ✓ ^8.6.0 |
| No `tailwind.config.{js,mjs,ts}` (D-10/D-14) | ✓ CSS-first via `@theme {}` |
| No `outline-none` without focus-visible fallback | ✓ all 3 sites paired with `focus-visible:ring-*` |
| Smoke-test contains all 9 palette swatches + H1 + Button + breakpoint indicator | ✓ |
| Dist HTML contains `bg-purple-400`, `bg-violet-400`, `text-purple-400`, `font-pixel`, no `bg-green-400`/`bg-lime-400` | ✓ |
| Human visual checkpoint | ✓ approved (after D-28 revision) |

## Deviations from PLAN

| Decision | Plan said | Reality | Reason |
|----------|-----------|---------|--------|
| Shadcn style | `default` or `new-york` | `radix-nova` | 2026 shadcn CLI renamed presets; `nova` is the rough equivalent of `new-york` for the 2026 registry. Components are v4-clean. |
| baseColor | `zinc` | `neutral` (then palette swapped to purple via D-28) | CLI default; palette semantics override via Tailwind default classes on `<body>` + our @theme block regardless of components.json baseColor. |
| `shadcn add` output style | Expected matching project Biome style | Shadcn generates double-quotes, no semis, no trailing commas | Excluded `src/components/ui/**` from Biome linting/formatting (generated code, Shadcn owns it). Biome continues to enforce project style on `src/lib/`, `src/layouts/`, `src/pages/` (non-.astro), etc. |
| `bun remove @fontsource-variable/geist shadcn` | N/A | Removed after init | `init` auto-installed Geist and kept `shadcn` as a runtime dep; both unnecessary — CLI works via bunx alone, and Press Start 2P is the only font. |
| `@import "shadcn/tailwind.css"` | N/A | Replaced with inline `@theme inline {}` block | Keeps globals.css self-contained, no implicit package dependency. |
| Accent palette | green-400 / lime-400 (locked in CONTEXT.md D-11, D-12, D-26) | purple-400 / violet-400 | User feedback at the visual checkpoint triggered D-28 revision. Accent-only shift; base + highlight untouched. |

## Issues encountered

1. **shadcn CLI invocation syntax** — `bunx --bun shadcn@latest init` errors with "Script not found shadcn@latest". Correct form is `bun x shadcn@latest init` (space, not hyphen). Logged in deviation table above.
2. **Nova preset prompted for preset choice** — `-y` alone insufficient; need explicit `-p nova` to skip the arrow-keys interactive menu.
3. **Biome formatting conflict with Shadcn** — resolved by excluding `src/components/ui/**` from Biome.
4. **Palette mismatch with user aesthetic intent** — surfaced at the human checkpoint; applied D-28 accent shift without reopening execution.

## Commits (Wave 3)

- `feat(01-03): shadcn init (radix/nova preset) + 9 components + v4 audit`
- `feat(01-03): smoke-test page with palette swatches, breakpoints, CRT accent`
- `feat(01-03): D-28 retro dark+purple theme — swap CRT accent green→purple`
- `docs(01-03): summary — shadcn + smoke test + D-28 complete` (this commit)

## Next

Phase 1 success criteria fully met (ROADMAP.md Phase 1 §Success Criteria 1–4). Ready for `/gsd-next` → Phase 2 (Layout, Nav, Footer, Hero).
