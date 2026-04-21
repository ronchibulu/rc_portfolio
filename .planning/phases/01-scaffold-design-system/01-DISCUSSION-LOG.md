# Phase 1: Scaffold & Design System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 01-scaffold-design-system
**Areas discussed:** Package manager, Code quality tooling, Design token strategy, Shadcn pre-install scope, Biome .astro coverage

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Package manager | npm vs pnpm vs bun | ✓ |
| Code quality tooling | ESLint+Prettier vs Biome vs Astro check only | ✓ |
| Design token strategy | Literal Tailwind vs semantic CSS-variable aliases | ✓ |
| Shadcn pre-install scope | Minimal vs full downstream set | ✓ |

**User's choice:** All four areas selected and answered in one turn.

---

## Package manager

| Option | Selected |
|--------|----------|
| npm | |
| pnpm | |
| bun | ✓ |

**User's choice:** bun
**Notes:** No qualifiers given — bun for all install / script / CLI operations.

---

## Code quality tooling

| Option | Selected |
|--------|----------|
| ESLint + Prettier | |
| Biome | ✓ |
| Astro check only | |

**User's choice:** Biome
**Notes:** Followed up with scope clarification for .astro file handling (below).

---

## Biome scope follow-up

| Option | Description | Selected |
|--------|-------------|----------|
| Biome (ts/tsx/js) + astro check + Prettier for .astro (Recommended) | Biome handles TS/React. astro check type-checks. Prettier formats .astro files. | ✓ |
| Biome only, skip .astro formatting | Accept unformatted .astro files. | |
| Biome + astro check only, no .astro formatter | Type-check .astro, leave formatting manual. | |

**User's choice:** Biome (ts/tsx/js) + astro check + Prettier for .astro

---

## Design token strategy

| Option | Selected |
|--------|----------|
| Literal Tailwind classes only | ✓ (primary) |
| Semantic CSS-variable aliases only | |
| Hybrid — literal primary, semantic aliases where reused | ✓ (secondary rule) |

**User's choice:** "Literal Tailwind classes as the main approach. Use semantic aliases only when needed."
**Notes:** Pragmatic — avoid speculative aliasing; introduce `--color-*` variables only on evidence of reuse.

---

## Shadcn pre-install scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full downstream set (9 components) (Recommended) | Button, Dialog, Sheet, Card, Badge, Tooltip, Carousel, ScrollArea, Separator | ✓ |
| Core only (5 components) | Button, Dialog, Sheet, Card, Badge | |
| Minimal (Button + Dialog) | Smoke-test + nav only | |

**User's choice:** Full downstream set (9 components)
**Notes:** Pre-install all to avoid per-phase interruptions.

---

## Readiness check

| Option | Selected |
|--------|----------|
| Write CONTEXT.md | ✓ |
| One more area | |

**User's choice:** Write CONTEXT.md
**Notes:** User kept pace deliberately terse — treated discussion as fast decision batch, not exploratory.

---

## Claude's Discretion

- Exact Biome rule set toggles (recommended ruleset accepted)
- Prettier config details for .astro (community defaults)
- `cn` utility placement (Shadcn init default — `src/lib/utils.ts`)
- Swatch layout in smoke-test page
- Exact approach to "dark by default" (`class="dark"` vs baseline zinc styling)

## Deferred Ideas

- SEO / OG meta / favicon / robots.txt → Phase 11
- `.gitattributes` CRLF→LF normalization → optional, else Phase 11
- Lighthouse CI budgets → Phase 11
- TypeScript `"strictest"` escalation → revisit if needed
- Storybook / component playground → not in v1
- Automated arbitrary-value Tailwind lint rule → manual for now
