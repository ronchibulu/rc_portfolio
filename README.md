# Ronald Cheng — Portfolio

Dark pixel/8-bit retro portfolio built on **Astro v5** static + **React 19** islands,
with a future R3F gaming-setup scene driven by GSAP ScrollTrigger and an OS-style
project browser.

## Requirements

- **Bun** — this project uses bun as its sole package manager. Do **not** run
  `npm install` or `pnpm install`; both will create a competing lockfile that
  fights `bun.lock`.
  Install bun: https://bun.sh/docs/installation

## Setup

```bash
bun install
bun run dev
```

Dev server defaults to http://localhost:4321.

## Scripts

| Script | What it does |
|--------|--------------|
| `bun run dev` | Astro dev server with HMR |
| `bun run build` | Static production build to `dist/` |
| `bun run preview` | Serve the built `dist/` locally |
| `bun run lint` | Biome lint + `astro check` type-check |
| `bun run format` | Biome format .ts/.tsx/.js/.json + Prettier on .astro |
| `bun run check` | CI-safe: lint + type-check, fails on warnings |

## Project rules (enforced by review)

- **Dark mode only.** No light/dark toggle. Baseline background is `zinc-950`.
- **Default Tailwind scale only.** Do NOT use arbitrary values like `pt-[50px]`
  or `bg-[#ff00ff]`. First violation in PR review is rejected.
- **Single package manager.** `bun.lock` is committed; other lockfiles are removed.
- **R3F Canvas uses `client:only="react"`** (added in Phase 4).
- **GSAP via `useGSAP()` only** (added in Phase 6).

See `AGENTS.md` / `CLAUDE.md` for the full locked stack table and hard rules.
See `.planning/` for phase-by-phase planning artifacts.
