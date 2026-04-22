# Phase 7: OS Screen Shell - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Retro OS desktop shell that appears after the camera fly-in blackout. Contains full-screen retro dot-grid background with scanline overlay, a pixel-art title bar at the top, and a responsive desktop icon grid with exactly two folder icons: "Projects" (11 subfolders) and "About Me". Visible only when `$activeSection === 'os'`. Single-click opens respective dialogs (stubbed for Phase 8/9).

</domain>

<decisions>
## Implementation Decisions

### OSScreen Component
- React island mounted `client:only="react"` in index.astro, replacing the `#projects` section placeholder
- Subscribes to `$activeSection` via `useStore` — renders `null` (hidden) when `activeSection !== 'os'`
- Full screen: `fixed inset-0 z-20` so it covers the canvas layer (z-0) but sits below dialogs (z-50)
- Background: `bg-zinc-950` (body default) with CSS dot-grid and scanline overlay
- Transition: no fade — instant hard cut (PROJECT.md §Story flow: "no fade")

### Retro Grid Background
- Dot grid: `background-image: radial-gradient(circle, rgba(139,92,246,0.15) 1px, transparent 1px)` (purple dots, very subtle)
- Grid size: `background-size: 24px 24px` for tight pixel aesthetic
- CSS class `.os-bg-grid` defined in `globals.css`

### Scanline Overlay
- Pseudo-element `::before` on the OS screen wrapper
- `background: repeating-linear-gradient(transparent 0px, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)`
- `pointer-events-none`, `absolute inset-0`, `z-[1]`
- CSS class `.os-scanlines` defined in `globals.css`

### OS Title Bar
- Sticky `h-10` bar at top: `bg-zinc-900 border-b border-zinc-700`
- Left: "RC.OS" in `font-pixel text-xs text-purple-400`
- Center: decorative pixel menu items in `font-pixel text-xs text-zinc-500`
- Right: clock/status area with current time rendered in React
- Accessible landmark: `role="banner"` or `<header>`

### Desktop Icon Grid
- Displayed in center/top area of screen, padding from title bar
- Two icons: "PROJECTS" and "ABOUT ME"
- Layout: `flex gap-8 md:gap-12 flex-wrap justify-center` or grid
- Not a nav grid — just two large icons, centered at md+, stacked on sm

### FolderIcon Component
- Props: `label`, `icon`, `onClick`, `disabled?`
- Wrapper: `button` with `min-w-[44px] min-h-[44px]` (tap target MOBILE-005 / OS-005)
- Focus visible: `focus-visible:ring-2 focus-visible:ring-purple-400`
- Pixel folder SVG icon (hand-crafted using `<rect>` path, dark/purple palette)
- Label: `font-pixel text-xs text-zinc-100` below icon
- Hover: gentle `hover:scale-105` transform + `hover:text-purple-400`
- Single-click only: `onClick` prop, no `onDoubleClick`
- Touch: native `<button>` click fires on touch reliably (OS-006)

### agent's Discretion
- Exact pixel art shape for folder SVG
- Clock tick interval (1s setInterval is fine)
- Precise icon positioning within the desktop area

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `$activeSection = atom<string>('hero')` in `src/stores/sceneStore.ts` — import and subscribe with `useStore`
- `useStore` from `@nanostores/react` — already used in `ScrollNarrative.tsx`
- `client:only="react"` pattern — established in every island (SceneCanvas, HeroTyping, ScrollNarrative)
- Tailwind utilities: `font-pixel`, `bg-zinc-950`, `bg-zinc-900`, `border-zinc-700`, `text-purple-400`, `text-zinc-500`, `text-zinc-100`, `text-yellow-400`
- `focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black` — established focus ring pattern (Header.astro)
- CSS class slots: `globals.css` already has Phase 2/6 additions, new OS classes append at bottom

### Established Patterns
- Islands: `export default function ComponentName() { ... }` — functional components
- Conditional render: check nanostore value, return `null` if not active
- Sub-path imports only: `@nanostores/react` is a bare package (OK without sub-path)
- No arbitrary Tailwind values

### Integration Points
- `index.astro` — replace `#projects` section placeholder with `<OSScreen client:only="react" />`
- The `#projects` section ID must be preserved for nav scroll-to anchor
- `globals.css` — add `.os-bg-grid` and `.os-scanlines` CSS definitions
- Phase 8 will pass `onOpenProjects` / `onOpenAbout` callbacks down to FolderIcon

</code_context>

<specifics>
## Specific Ideas

- Reference: `os_screen.png` (project root) — dark-theme version with zinc-950 bg, purple accent
- The OS screen appears as full-screen overlay after blackout completes (hard cut)
- "PROJECTS" folder opens the projects subfolder grid (Phase 8)
- "ABOUT ME" folder opens the about timeline (Phase 9)
- Both folders show stubbed console.log click handlers in Phase 7

</specifics>

<deferred>
## Deferred Ideas

- OS system tray / status bar click handlers — deferred to Phase 8+
- Window manager (minimize/restore) — out of scope, PROJECT.md
- Animated folder open effect — deferred to Phase 8 (dialog open covers it)

</deferred>
