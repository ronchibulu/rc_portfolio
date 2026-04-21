# Phase 1: Scaffold & Design System - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a running Astro v5 static site with the pixel/8-bit design system fully wired up — project scaffold, integrations, Tailwind v4 theme, Shadcn primitives, pixel font, palette tokens, and responsive breakpoints. **No story content, no 3D, no animation** — this phase produces a styled blank shell that every downstream phase builds on.

Not in scope (belongs to later phases): nav UI, hero typing, footer content (Phase 2), 3D assets (Phase 3+), scroll narrative (Phase 6), OS screen (Phase 7+).

</domain>

<decisions>
## Implementation Decisions

### Package manager
- **D-01:** Use **bun** as the sole package manager. All install / script / CLI commands use `bun` and `bunx` (e.g., `bun add`, `bun run dev`, `bunx shadcn@latest init`).
- **D-02:** Commit `bun.lockb` (bun's binary lockfile). Remove any stray `package-lock.json` / `pnpm-lock.yaml` if they appear.
- **D-03:** README / setup instructions reference bun explicitly, not npm, so new contributors don't pollute the lockfile.

### Code quality & formatting
- **D-04:** **Biome** handles lint + format for `.ts` / `.tsx` / `.js` / `.jsx` / `.json`. Configure with TypeScript, React, a11y, and correctness rule sets enabled.
- **D-05:** `astro check` handles type-checking of `.astro` files (Astro's official recommendation — Biome does not parse the `.astro` component syntax).
- **D-06:** **Prettier** formats `.astro` files only, with `prettier-plugin-astro`. Scope Prettier tightly (via `.prettierignore` or `overrides` in `package.json`) so it never touches files Biome owns — avoids dueling formatters.
- **D-07:** Wire three scripts: `bun run lint` (biome + astro check), `bun run format` (biome format --write + prettier on .astro), `bun run check` (lint + type-check, CI-safe).

### TypeScript
- **D-08:** Use Astro's built-in `"strict"` preset in `tsconfig.json` for Phase 1. Escalate to `"strictest"` only if a later phase demands it — avoid forcing `exactOptionalPropertyTypes`-level rigor on greenfield code that will churn.
- **D-09:** `tsconfig.json` `baseUrl: "."` + `paths: { "@/*": ["./src/*"] }` configured **before** running `bunx shadcn@latest init`. Dev server restarted after editing tsconfig so Astro picks up the alias.

### Tailwind v4 + design tokens
- **D-10:** Theme tokens defined in a single CSS `@theme {}` block inside `src/styles/globals.css`. No `tailwind.config.js`.
- **D-11:** Strategy: **use literal Tailwind default classes as the primary styling tool** (`bg-zinc-950`, `text-green-400`, `border-zinc-700`). Keep the color math simple — the default zinc/green/yellow palette already matches the pixel/8-bit aesthetic.
- **D-12:** Introduce a **semantic CSS variable alias only when a token is reused and needs to be renameable in one place** — e.g., `--color-crt-accent` if green-400 is the CRT glow everywhere and might swap to lime-400 later. Do NOT pre-emptively alias every color. Alias only on evidence of reuse, not speculation.
- **D-13:** Pixel font token: `--font-pixel: 'Press Start 2P', monospace;` in `@theme {}`, referenced via `font-pixel` utility class.
- **D-14:** `@import "tailwindcss";` at the top of `globals.css` — NOT the deprecated `@tailwind base/components/utilities` directives.
- **D-15:** `applyBaseStyles: false` on the Tailwind Vite plugin configuration so base styles aren't loaded twice across Astro + Shadcn.

### Shadcn pre-install scope
- **D-16:** Pre-install the **full downstream set** via `bunx shadcn@latest add <component>` so later phases don't interrupt for per-component init: **Button, Dialog, Sheet, Card, Badge, Tooltip, Carousel, ScrollArea, Separator**.
- **D-17:** After every `shadcn add`, audit the generated component files against Tailwind v3→v4 class renames (`shadow`→`shadow-sm`, `rounded`→`rounded-sm`, `outline-none`→`outline-hidden`, `ring`→`ring-3`, `bg-[--var]`→`bg-(--var)`). Run `bunx @tailwindcss/upgrade` if available and the diff is clean.
- **D-18:** Carousel uses the Shadcn wrapper over embla-carousel-react (Shadcn's default carousel implementation). Do not swap for a different slider lib.

### Font delivery
- **D-19:** `@fontsource/press-start-2p` installed via bun and imported once at the top of the root `BaseLayout.astro` (`import '@fontsource/press-start-2p';`). No Google Fonts network request.

### Responsive & Tailwind hygiene
- **D-20:** Tailwind v4 default breakpoints overridden via `@theme {}` only if 375 / 768 / 1024 / 1920 targets don't already match v4 defaults. Default v4 breakpoints map: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536. We need **`sm` = 375 and `2xl` = 1920**, so override `--breakpoint-sm: 375px;` and `--breakpoint-2xl: 1920px;` in `@theme {}` — leave md/lg alone.
- **D-21:** **No arbitrary values ever.** Enforce via Biome custom rule or manual review in later phases. First violation in PR review = reject.
- **D-22:** Dark-mode only. Do NOT install or configure `next-themes` / `astro-themes` / Shadcn's dark-mode variant. Everything is zinc-950 by default.

### Layout & file organization
- **D-23:** Single `src/layouts/BaseLayout.astro` as the root layout — sets `<html lang>`, imports globals.css + font, renders `<Header />` + `<slot />` + `<Footer />`. Do NOT split into RootLayout/PageLayout yet — one portfolio page doesn't need that abstraction.
- **D-24:** Standard Astro tree: `src/pages/index.astro`, `src/layouts/`, `src/components/ui/` (Shadcn), `src/components/` (project-specific islands like `HeroTyping.tsx`), `src/styles/globals.css`, `src/lib/utils.ts` (Shadcn's `cn` helper goes here). No atomic-design / feature-folder experimentation.
- **D-25:** `astro.config.mjs` sets `output: 'static'`, adapter `vercel()`, integrations `[react(), tailwind({ applyBaseStyles: false })]`. **Do not** enable hybrid or SSR modes.

### Smoke-test reference page
- **D-26:** `src/pages/index.astro` contains a minimal **design-system smoke test** for Phase 1 verification only (replaced in Phase 2):
  - One heading using `font-pixel` Press Start 2P
  - One `<Button>` Shadcn primitive with default + secondary variants
  - Color swatches displaying every palette token (zinc-950/900/800, zinc-100, green-400, lime-400, yellow-400, zinc-700, zinc-500)
  - Breakpoint indicator visible at each of 375 / 768 / 1024 / 1920 (`sm:block md:hidden` pattern)
- **D-27:** No routing, no nav, no SEO meta beyond `<title>Ronald Cheng — Portfolio</title>` + `<meta charset>` in BaseLayout. Meta/OG/favicon baked in Phase 11 (deploy pass).

### Claude's Discretion
- Exact Biome rule set toggles (recommended ruleset accepted)
- Prettier config details for .astro (use Astro community defaults)
- `cn` utility placement (follow Shadcn init default → `src/lib/utils.ts`)
- Swatch layout in smoke-test page (any readable grid)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope & rules
- `CLAUDE.md` — Locked stack table + hard rules (no arbitrary Tailwind values, dark-only, `client:only` for R3F, `useGSAP()` only, etc.)
- `.planning/PROJECT.md` — Context, color palette, breakpoints, key decisions
- `.planning/REQUIREMENTS.md` §Foundation (FND) — FND-001 through FND-009 traceability

### Stack & architecture
- `.planning/research/SUMMARY.md` — Stack lock-in table + architecture decisions (locked)
- `.planning/research/STACK.md` §Tailwind v4 Key Changes, §Font Strategy — CSS-first config + fontsource pattern
- `.planning/research/ARCHITECTURE.md` §Astro + R3F Integration Pattern — island directives (R3F used in later phases, but directive rules apply project-wide)

### Pitfalls that shape Phase 1 scaffolding
- `.planning/research/PITFALLS.md` §7 Tailwind v4 Breaking Changes That Will Break Shadcn — v3→v4 class rename table, `@import "tailwindcss"` vs `@tailwind`, `applyBaseStyles: false`
- `.planning/research/PITFALLS.md` §8 Shadcn + Astro Path Alias — exact setup order (tsconfig paths FIRST → restart → integrations → `shadcn init` → import globals.css in root layout)

### Third-party docs to follow during install
- Bun docs: https://bun.sh/docs/cli/install for `bun add`, `bunx` vs `bun x` semantics
- Astro docs: https://docs.astro.build/en/guides/integrations-guide/react/ and https://docs.astro.build/en/guides/integrations-guide/vercel/
- Tailwind v4: https://tailwindcss.com/docs/upgrade-guide — breaking changes table
- Shadcn Astro: https://ui.shadcn.com/docs/installation/astro
- Biome: https://biomejs.dev/guides/getting-started/

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **None** — greenfield project. `C:/coding_proj/self_portfolio/` currently contains only `.planning/`, `.claude/`, `CLAUDE.md`, `Resume.docx`, `gaming_setup_v12.glb` (51 MB raw — Phase 3 optimizes), `image.png`, `os_screen.png`, `projects/` (11 dirs with screenshots).
- No `package.json`, `src/`, `astro.config.mjs` exist yet — Phase 1 creates them.

### Established Patterns
- Repository uses **CRLF line endings** on Windows (git warns `LF will be replaced by CRLF`). Configure `.gitattributes` with `* text=auto eol=lf` so generated files stay LF across contributors. Low-risk add during Phase 1.
- `.claude/` already present — skill config / settings managed outside the Astro tree. Leave untouched.

### Integration Points
- Root of repo becomes the Astro project root. `package.json`, `astro.config.mjs`, `tsconfig.json`, `biome.json`, `components.json` (Shadcn config) all land at repo root.
- `/public/` is reserved for later phases (3D model, draco decoder, project screenshots). Phase 1 only creates the empty directory.
- Reference images (`image.png`, `os_screen.png`, `gaming_setup_v12.glb`) stay at repo root until Phase 3 relocates the .glb → `/public/models/` via optimization pipeline.

</code_context>

<specifics>
## Specific Ideas

- Smoke-test page must make it visually obvious whether the design system is wired — palette swatches + font heading + a real Shadcn button all in one view. A blank page proves nothing.
- Keep the tooling surface tight: one package manager (bun), one linter (Biome) + one type-checker (astro check) + one formatter-for-astro (Prettier scoped to .astro only). Three tools, each owning one job, zero overlap.
- No dark-mode toggle infrastructure — "dark by default" means `class="dark"` on `<html>` or just baseline zinc-950 styling, whichever is simpler (Claude's discretion).

</specifics>

<deferred>
## Deferred Ideas

- **SEO / OG meta / favicon / robots.txt** — Phase 11 (Performance Pass + Deploy). Don't pollute Phase 1 with deployment concerns.
- **`.gitattributes` CRLF→LF normalization** — optional Phase 1 add, but if scope pressure appears, defer to Phase 11.
- **Lighthouse budget targets in CI** — Phase 11.
- **Upgrade from "strict" to "strictest" TypeScript** — revisit if a later phase's type complexity demands it; no speculative escalation.
- **Storybook / component playground** — not in v1. If UI-review fatigue emerges, reconsider in v2.
- **ESLint plugin that forbids arbitrary Tailwind values automatically** — if manual PR review fails to catch violations, revisit; for now the rule is written, enforcement is cultural.

</deferred>

---

*Phase: 01-scaffold-design-system*
*Context gathered: 2026-04-22*
