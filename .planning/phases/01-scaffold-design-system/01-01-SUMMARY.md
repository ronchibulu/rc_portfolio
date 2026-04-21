---
phase: 01-scaffold-design-system
plan: 01
status: complete
completed: 2026-04-22
---

# 01-01 Summary — Astro v5 Scaffold + Tooling Baseline

## What was built

A buildable, lintable, type-checkable Astro v5 static project at the repo root with the full downstream dependency set pre-installed. No visible UI — this plan is deliberately tooling-only.

## Versions installed

| Tool | Version |
|------|---------|
| bun | 1.3.8 |
| astro | 5.18.1 (downgraded from scaffold default 6.1.8 to honor locked stack) |
| @astrojs/react | 4.4.2 |
| @astrojs/vercel | 9.0.5 (v10 requires Astro 6 — pinned to v9 for Astro 5 compat) |
| @astrojs/check | 0.9.8 (dev — required by `astro check`) |
| react, react-dom | 19.2.5 |
| three | 0.176.0 |
| @react-three/fiber | 9.6.0 |
| @react-three/drei | 10.7.7 |
| gsap | 3.15.0 |
| @gsap/react | 2.1.2 |
| motion | 12.38.0 |
| tailwindcss | 4.2.4 |
| @tailwindcss/vite | 4.2.4 |
| @fontsource/press-start-2p | 5.2.7 |
| nanostores | 1.3.0 |
| @nanostores/react | 1.1.0 |
| detect-gpu | 5.0.70 |
| clsx | 2.1.1 |
| tailwind-merge | 3.5.0 |
| class-variance-authority | 0.7.1 |
| lucide-react | 1.8.0 |
| @biomejs/biome | 1.9.4 |
| prettier | 3.8.3 |
| prettier-plugin-astro | 0.14.1 |
| typescript | 6.0.3 |

## Key files created

- `package.json` — `ronald-cheng-portfolio`, private, type:module, 6 scripts (dev/start/build/preview/lint/format/check)
- `bun.lock` — bun 1.3+ text lockfile (replaces the deprecated binary `bun.lockb`)
- `astro.config.mjs` — `output: 'static'`, `vercel({})` adapter, `react()` integration, `@tailwindcss/vite` Vite plugin
- `tsconfig.json` — extends `astro/tsconfigs/strict`, `baseUrl: "."`, paths `@/*` → `./src/*`, `jsx: "react-jsx"`
- `biome.json` — recommended + a11y/correctness/suspicious/style/complexity; excludes `*.astro`; LF line endings
- `.prettierrc` — `prettier-plugin-astro`, scoped to `*.astro` via overrides
- `.prettierignore` — ignore-all + unignore `src/**/*.astro` (Prettier scoped tight to D-06)
- `.gitignore` — Astro + bun + Vercel + editor excludes
- `README.md` — bun-only setup, 6-script table, project rules (dark only, no arbitrary values, bun.lock committed)
- `src/pages/index.astro`, `src/assets/astro.svg`, `src/assets/background.svg` (Astro minimal-template defaults, overwritten in Plan 02)

## Deviations from CONTEXT.md / PLAN

| Decision | Plan said | Reality | Reason |
|----------|-----------|---------|--------|
| D-02 (lockfile) | Commit `bun.lockb` (binary) | Committed `bun.lock` (text) | bun 1.3.8 emits text lockfile by default; `bun.lockb` is deprecated. Intent (reproducible installs, committed lockfile) preserved. |
| Astro version | `bun create astro --template minimal --typescript strict --no-install --no-git` → expected v5 default | Scaffold wrote Astro ^6.1.8 | `bun add astro@^5` in Task 1 step 2 downgraded the pin to 5.18.1. Locked stack respected. |
| `@astrojs/vercel` import | `import vercel from '@astrojs/vercel/static'` (per plan Task 2) | `import vercel from '@astrojs/vercel'` | `@astrojs/vercel/static` subpath import is deprecated in v9+; unified adapter handles `output: 'static'` from the single import. Compile-time error forced the fix. |
| `vercel()` call | `adapter: vercel()` (no args per plan) | `adapter: vercel({})` | v9+ requires an options argument (TypeScript `ts(2554)`). Empty object accepts all defaults. |
| Biome `check src` empty-src handling | N/A | Added `--no-errors-on-unmatched` to lint/format/check | During scaffold, src/ only contains .astro (excluded from Biome). Without the flag Biome errors on empty match. Required until Plan 02 adds TS files. |
| `bun create astro --add @astrojs/react,@astrojs/vercel` | (plan intent was to avoid individual `astro add` runs) | Flag errors with `--no-install`; ran `bun add` directly for all integrations | Non-blocking — dependencies still installed correctly. |
| `bun create astro` target dir | Plan said `.` (current directory) | Scaffold wrote to `./deeply-disk/` because `.` was non-empty | Moved files back to repo root with `cp -r deeply-disk/. .` and removed `deeply-disk/`. No data lost. |

## Verification

- ✓ `bun run check` exits 0 (biome check src --no-errors-on-unmatched + astro check → 0 errors/warnings/hints)
- ✓ `bun run build` exits 0, produces `dist/index.html` + `.vercel/output/static/` (1 page, 195KB client bundle, 818ms)
- ✓ `package.json` `type: module` and all 21 runtime deps + 8 dev deps present
- ✓ No `package-lock.json` or `pnpm-lock.yaml` on disk
- ✓ `@astrojs/tailwind` is NOT installed (deprecated v3-era integration)
- ✓ `@/*` tsconfig alias defined (verification deferred to Plan 03 which actually imports via `@/`)

## Issues encountered

1. **create-astro `--add` + `--no-install` incompatibility** — `--add` requires deps to install; fix was to run `bun add` directly for all integrations.
2. **Target-dir collision** — `bun create astro .` refused to write to a non-empty directory and fell back to `./deeply-disk/`. Solved with `cp -r deeply-disk/. . && rm -rf deeply-disk`.
3. **Biome empty-match error** — `biome check src` errors on empty matches; added `--no-errors-on-unmatched` to all Biome-prefix scripts.
4. **`@astrojs/vercel/static` deprecated** — caught by `astro check` diagnostic; rewrote the import in astro.config.mjs.
5. **`vercel()` now requires an argument** — v9+ breaking change from earlier v3-era examples; passed `{}` to accept defaults.

All issues resolved during Task 1.3 verification; phase now has a clean green build.

## Commits

- `feat(01-01): scaffold astro v5 + install all phase 1+ deps via bun`
- `feat(01-01): configure astro.config.mjs + tsconfig paths + README`
- `feat(01-01): biome + prettier config, scripts, build verification`
