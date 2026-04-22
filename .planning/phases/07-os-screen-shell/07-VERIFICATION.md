---
status: human_needed
---

# Phase 7 — OS Screen Shell Verification

**Status:** `human_needed`
**Plans:** 07-01

---

## What Was Built

- `FolderIcon.tsx` — pixel-art SVG folder button, 44px tap target, single-click, focus ring
- `OSScreen.tsx` — fixed z-20 overlay; shows when `$activeSection === 'os'`; retro title bar + desktop grid + status bar
- `globals.css` — `.os-bg-grid` (purple dot grid), `.os-scanlines::before` (scanlines), reduced-motion rule
- `index.astro` — OSScreen mounted, #projects anchor sentinel preserved
- Build: `bunx astro build` exits 0 ✓

---

## How to Verify

```bash
bun run dev
```

Open: **http://localhost:4321**

Scroll past the hero fly-in (scroll down ~200dvh) until the scroll pin exits.

---

## Checklist

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 1 | OS screen appears | After scroll pin exits, OS shell appears instantly (no fade) | ☐ |
| 2 | Background | Dark bg-zinc-950 with visible purple dot-grid pattern | ☐ |
| 3 | Scanlines | Subtle horizontal scanline overlay over the desktop area | ☐ |
| 4 | Title bar | "RC.OS" in purple-400 on left, clock HH:MM on right | ☐ |
| 5 | Folder icons | PROJECTS and ABOUT ME visible in desktop area | ☐ |
| 6 | Folder click | Single click logs to console (Phase 8 stub) | ☐ |
| 7 | Focus tab | Tab key cycles through folder icons, ring visible | ☐ |
| 8 | No console errors | Zero errors on load | ☐ |

---

## Must-Have Truths (automated)

| # | Truth | Verified |
|---|-------|---------|
| 1 | `fixed inset-0 z-20` on OS screen wrapper | Automated ✓ (source review) |
| 2 | `if (activeSection !== 'os') return null` guard | Automated ✓ |
| 3 | Two FolderIcon components rendered | Automated ✓ |
| 4 | `min-h-11 min-w-11` tap target classes | Automated ✓ |
| 5 | `focus-visible:ring-2 focus-visible:ring-purple-400` | Automated ✓ |
| 6 | `.os-bg-grid .os-scanlines` applied to wrapper | Automated ✓ |
| 7 | `bunx astro build` exits 0 | Automated ✓ |
| 8 | Human visual verification — OS screen appears after fly-in | **Human ☐** |

---

## human_verification

Items requiring manual browser verification:

1. OS screen appears instantly after scroll pin exits (hard cut, no fade)
2. Purple dot-grid background and scanlines visible
3. PROJECTS and ABOUT ME folder icons legible
4. Keyboard tab focus works on folder icons

---

## Resume Signal

- **`approved`** — OS screen visible, grid+scanlines look correct, folders clickable
- **Issues found** — Describe: e.g., "OS screen never appears", "background looks wrong"
