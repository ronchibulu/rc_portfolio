# Phase 2: Layout, Nav, Footer, Hero - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Ship-able landing page skeleton — hero typing intro, nav, and footer — before any 3D work starts. Replace the Phase 1 design-system smoke-test page with the real portfolio landing page shell: sticky/top nav, hero section with name + role + tagline typing animation, and a footer with LinkedIn + email links.

**In scope:**
- Replace `src/pages/index.astro` smoke-test content with real hero + nav + footer layout
- `Header` component (Astro or React) with nav anchors: Projects / About / Contact
- `HeroTyping.tsx` React island implementing the typing animation (one-shot, reduced-motion safe)
- `Footer` component with LinkedIn + mail links (`ronald.cheng@example.com` placeholder until user supplies real contact)
- Responsive layout tested at 375 / 768 / 1024 / 1920
- All copy targets "Senior Full-Stack Developer → Web Specialist / Frontend" positioning

**Not in scope:**
- 3D canvas (Phase 4+), 3D assets (Phase 3)
- Scroll-driven camera fly-in or ScrollTrigger (Phase 6)
- OS screen / Projects / About Me (Phase 7+)
- SEO meta, favicon, OG tags (Phase 11)

</domain>

<decisions>
## Implementation Decisions

### Agent's Discretion
All implementation choices are at the agent's discretion — discuss phase was skipped per user setting (`workflow.skip_discuss=true`). Use:
- ROADMAP phase goal and success criteria
- Phase 1 CONTEXT.md decisions (D-01 through D-28) — locked
- `.planning/PROJECT.md`, `AGENTS.md`, `CLAUDE.md` hard rules
- `.planning/research/FEATURES.md` for hero copy/animation guidance
- REQUIREMENTS.md FND-006, FND-007, HERO-001..004

### Defaults the planner should adopt unless a blocker surfaces
- **Typing animation:** Lightweight custom React hook (small state machine + `setInterval`/`setTimeout`) rather than adding a library. Motion v12 is available if needed but not required for typewriter; save the dependency for Phase 6.
- **Nav component:** Astro component with inline `<a>` anchors to `#projects` / `#about` / `#contact`. No client-side JS unless a hamburger menu is needed on `sm:`.
- **Mobile nav:** At `sm` (375px), stack nav inline under the logo or use a minimal text row — no hamburger/drawer for v1; keep it trivial.
- **Footer:** Astro component, two links: LinkedIn `https://linkedin.com/in/ronaldcheng` (placeholder) and `mailto:ronald.cheng@example.com?subject=Portfolio` (placeholder — flag for user to replace before deploy in Phase 11).
- **Hero copy:**
  - Name: "Ronald Cheng"
  - Role: "Senior Full-Stack Developer"
  - Tagline: something short that signals Web Specialist / Frontend intent (agent's discretion — keep it under ~60 chars).
- **Contact placeholders:** Leave clear `TODO` comment in the source near both LinkedIn URL and mailto address so Phase 11 deploy pass catches them.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` path renders final hero text statically. Implement at the component level via a `useReducedMotion` utility (or direct `window.matchMedia` check wrapped for SSR safety — the island is `client:load` so `window` is available).
- **Island directive:** `HeroTyping.tsx` uses `client:load` (not `client:only`) — it can SSR the final string and hydrate to start the animation. If SSR mismatch issues arise, escalate to `client:only="react"` with a static fallback in Astro.
- **Design system:** Use only default Tailwind classes — zinc-950 background, zinc-100 text, purple-400 accents for CRT-style highlight on the role text. `font-pixel` utility for hero heading. Respect the CRLF→LF gitattributes (D-18 equivalent).

</decisions>

<canonical_refs>
## Canonical References

Downstream planning/execution MUST read:

- `CLAUDE.md` / `AGENTS.md` — hard rules
- `.planning/PROJECT.md` — color palette, breakpoints, story flow
- `.planning/REQUIREMENTS.md` §FND (FND-006, FND-007) + §HERO (HERO-001..004)
- `.planning/phases/01-scaffold-design-system/01-CONTEXT.md` — locked scaffold decisions
- `.planning/research/FEATURES.md` — hero/nav/footer feature patterns
- `src/layouts/BaseLayout.astro` — existing layout (reuse as-is)
- `src/styles/globals.css` — `@theme {}` token source

</canonical_refs>

<code_context>
## Existing Code Insights

### Available from Phase 1
- `src/layouts/BaseLayout.astro` — root layout with `<html lang>`, font import, globals.css, dark baseline.
- `src/pages/index.astro` — currently the design-system smoke test. **Replace its content.**
- `src/components/ui/` — Shadcn primitives (Button, etc.) already installed.
- `src/lib/utils.ts` — Shadcn `cn` helper.
- `@/*` alias resolves to `src/*`.
- `font-pixel` utility + `--color-crt-accent` → `purple-400` wired.

### Integration Points
- `HeroTyping.tsx` lives at `src/components/HeroTyping.tsx` (project islands, per D-24).
- `Header.astro` and `Footer.astro` live at `src/components/` or `src/layouts/` — planner picks one, but keep them as Astro components unless client interactivity is required.
- Anchor IDs: `#projects`, `#about`, `#contact`. The actual sections land in Phases 7-9; for Phase 2, the anchors point to placeholder `<section>` stubs so smooth-scroll behavior can be verified.

### Pitfalls to avoid
- No arbitrary Tailwind values (D-21).
- Typing animation MUST have a reduced-motion path that shows final text — not a static blank.
- Don't import Motion v12 or GSAP yet — this phase is zero-animation-library beyond the typewriter.

</code_context>

<specifics>
## Specific Ideas

- Hero section is the "above-the-fold" story entry point — it will eventually be overlaid on the 3D canvas (Phases 4-6). For Phase 2, render it on a solid `bg-zinc-950` background; the 3D layer will slot behind it later.
- Nav should be sticky at the top (`sticky top-0`) or fixed; choose sticky so it doesn't fight the eventual fixed 3D canvas.
- Footer stays at the bottom of the document flow — no fancy positioning.
- Copy should hint at the retro/OS vibe without screaming "portfolio": e.g., subtle `>_` prompt character near the tagline.

</specifics>

<deferred>
## Deferred Ideas

- Contact form (deferred entirely — mailto link is sufficient for v1).
- Hamburger menu / mobile nav drawer (not needed — 3 anchors fit on 375px).
- SEO / OG / favicon (Phase 11).
- Real LinkedIn/email values — placeholders flagged via TODO comments, fixed in Phase 11.
- Motion library for hero enter animation (Phase 6 can add entrance animation when scroll narrative is wired).

</deferred>

---

*Phase: 02-layout-nav-footer-hero*
*Context gathered: 2026-04-22 (auto, discuss skipped)*
