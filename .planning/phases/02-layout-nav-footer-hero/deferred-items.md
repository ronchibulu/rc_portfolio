# Phase 2 — Deferred Items

Out-of-scope discoveries logged during plan execution. NOT fixed by the plan that found them.

---

## From Plan 02-01 execution (2026-04-22)

### DEF-02-01-a: Biome formatting errors in `src/components/HeroTyping.tsx`

- **Discovered by:** Plan 02-01 executor during final `bun run check` verification.
- **Origin commit:** `b345aaa feat(02-02): hero typing island with reduced-motion path` (Plan 02-02).
- **Symptom:** `bun run check` (which chains `biome check src && astro check`) fails with exit 1 because Biome detects that `src/components/HeroTyping.tsx` uses double-quoted strings where the project's Biome config requires single quotes. Biome prints "Formatter would have printed the following content" then lists many string-literal and multi-line JSX formatting diffs. Fully auto-fixable via `bunx biome format --write src/components/HeroTyping.tsx` (or `bun run format` if defined).
- **Impact on Plan 02-01:** Plan 02-01 files (`src/styles/globals.css`, `src/components/Header.astro`, `src/components/Footer.astro`) all pass `astro check` cleanly and `bun run build` exits 0. The composite `bun run check` fails only because of this scope-external file, so Plan 02-01's verify block cannot green as a single command. All individual truth greps pass.
- **Scope:** Plan 02-02 owns `HeroTyping.tsx`. Plan 02-01 is explicitly forbidden from modifying it (AGENTS.md hard rule: "Do NOT modify... HeroTyping.tsx").
- **Recommended action:** Either (a) Plan 02-02 executor fixes its own formatting before final commit (TBD if re-run), or (b) Plan 02-03 runs `bunx biome format --write src/components/HeroTyping.tsx` as its first task (it's already inside the Plan 02-03 touch set since that plan composes index.astro around HeroTyping) — but the cleaner assignment is (a).
- **Status:** Open. Deferred to Plan 02-02 cleanup or Phase 2 final polish.
