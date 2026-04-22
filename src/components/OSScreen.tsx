/**
 * Phase 7/8/9 — OSScreen.tsx
 *
 * Retro OS desktop shell that appears after the camera fly-in blackout.
 * Mounted via client:only="react" in index.astro.
 *
 * Rendering logic:
 *  - Subscribes to $activeSection nanostore
 *  - Returns null (hidden) when activeSection !== 'os'
 *  - When 'os': renders full-screen fixed overlay that takes over the viewport
 *    (z-50, above the sticky Header z-40 and the 3D canvas z-0)
 *  - Locks document scroll while active so OSScreen truly "takes over" the
 *    screen — user must scroll up (wheel / touch) to release (ScrollNarrative
 *    handles the hero return via onLeaveBack on the scene pin)
 *
 * Window management (added):
 *  - Projects, About Me, and Project detail are all rendered as draggable
 *    retro OS windows via the shared `Window` component.
 *  - Each window has a per-window {open, minimized, maximized} triplet.
 *  - The bottom dock bar shows a tab for every open window — tabs toggle
 *    the corresponding `minimized` state when clicked, and animate in/out
 *    with Motion v12.
 *
 * State:
 *  - projectsOpen / projectsMinimized / projectsMaximized — Projects folder window
 *  - selectedProject / projectMin / projectMax — Project detail window
 *  - aboutOpen / aboutMinimized / aboutMaximized — About Me window
 *
 * Layout:
 *  - Fixed full-screen, z-50 (above Header z-40, above dialogs use z-[60]+)
 *  - bg-zinc-950 + .os-bg-grid dot pattern + .os-scanlines pseudo-element
 *  - Retro title bar at top (h-10)
 *  - Desktop content area: centered folder icons
 *  - Dock bar at bottom showing tabs for every open window
 */

import AboutDialog from '@/components/AboutDialog';
import ContactDialog from '@/components/ContactDialog';
import PixelReveal from '@/components/PixelReveal';
import type { Project } from '@/data/projects';
import { $activeSection, $navTransitioning, $osIntent } from '@/stores';
import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import FolderIcon from './FolderIcon';
import ProjectDialog from './ProjectDialog';
import ProjectsOverlay from './ProjectsOverlay';

/** Retro pixel-art clock display — HH:MM in 24h format */
function OsClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm}`);
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-pixel text-xs text-zinc-400" aria-label={`Current time: ${time}`}>
      {time}
    </span>
  );
}

/**
 * Dock tab rendered in the bottom bar for an open window. Clicking toggles
 * the window between minimized and restored. Animates in on mount and out
 * on unmount via AnimatePresence.
 */
function DockTab({
  title,
  minimized,
  onToggle,
}: {
  title: string;
  minimized: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      onClick={onToggle}
      aria-pressed={!minimized}
      aria-label={`${minimized ? 'Restore' : 'Minimize'} ${title}`}
      className={[
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5',
        'font-pixel text-xs transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400',
        minimized
          ? 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-purple-400'
          : 'border-purple-400/60 bg-purple-400/10 text-purple-400 hover:bg-purple-400/20',
      ].join(' ')}
    >
      <span aria-hidden="true">{minimized ? '▸' : '▾'}</span>
      <span className="max-w-24 truncate sm:max-w-48">{title}</span>
    </motion.button>
  );
}

export default function OSScreen() {
  const activeSection = useStore($activeSection);
  const navTransitioning = useStore($navTransitioning);
  const osIntent = useStore($osIntent);

  // Projects folder window
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [projectsMinimized, setProjectsMinimized] = useState(false);
  const [projectsMaximized, setProjectsMaximized] = useState(false);

  // Project detail window
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectMinimized, setProjectMinimized] = useState(false);
  const [projectMaximized, setProjectMaximized] = useState(false);

  // About Me window
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutMinimized, setAboutMinimized] = useState(false);
  const [aboutMaximized, setAboutMaximized] = useState(false);

  // Contact window
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMinimized, setContactMinimized] = useState(false);
  const [contactMaximized, setContactMaximized] = useState(false);

  // ---------------------------------------------------------------------------
  // Phase 12 — PixelReveal intro.
  //
  // Plays a chunky 8-bit dissolve once per session when the OSScreen first
  // activates. `hasPlayedIntroRef` persists across activeSection toggles so
  // scrolling back up to hero and returning to OS does NOT replay the intro —
  // a decision that favours "see it once" over "see it every time". Swap the
  // ref for a normal state slice if we later decide replays are desirable.
  //
  // `showReveal` flips off when PixelReveal.onDone fires, unmounting the
  // canvas. The ref guards against re-mounting on subsequent activations.
  // ---------------------------------------------------------------------------
  const hasPlayedIntroRef = useRef(false);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    if (activeSection === 'os') {
      if (hasPlayedIntroRef.current) return;
      hasPlayedIntroRef.current = true;
      // When a header anchor click (NavTransition) caused this activation,
      // NavTransition already owns the viewport cover/reveal at zIndex 70.
      // Playing OSScreen's own intro on top would stack two concurrent
      // reveals — mark the intro as consumed and skip the local animation.
      if ($navTransitioning.get()) return;
      setShowReveal(true);
      return;
    }
    // Leaving OS — reset so the next activation (e.g. scrolling back down
    // past the post-flyin-pin after an EXIT) replays the pixel dissolve.
    hasPlayedIntroRef.current = false;
    setShowReveal(false);
  }, [activeSection]);

  // ---------------------------------------------------------------------------
  // Lock body scroll while OSScreen is active so it genuinely takes over the
  // viewport. The only way out is the EXIT button in the title bar, which
  // dispatches the `rc:nav` event handled by NavTransition — that owns the
  // pixel cover → scrollTo(top) → pixel reveal flow back to the hero section.
  //
  // Wheel/touch are also cancelled so trackpad "inertia" past the end of
  // scroll can't accidentally trigger ScrollTrigger scrubs while OS is active.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeSection !== 'os') return;
    // Release the lock while NavTransition is running a cover → scrollTo →
    // reveal flow. Overflow:hidden on body propagates to the viewport
    // scroller in modern browsers, which blocks programmatic scrollTo /
    // scrollIntoView — that would prevent header anchors and the EXIT button
    // from moving the page. `$navTransitioning` flips true in NavTransition
    // before cover begins and false after reveal completes; on cleanup here
    // ($activeSection flip, OSScreen unmount) the prior overflow is restored.
    if (navTransitioning) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Allow native scrolling inside elements tagged with `data-os-scrollable`
    // (e.g. the About Me timeline, Projects list, Project detail body) while
    // still cancelling page-level wheel/touch so nothing can drive the global
    // ScrollTrigger out of OS. Window-level listener fires during bubble, after
    // any inner container listener — so we must check the target here or the
    // browser's native scroll on the container will be cancelled.
    const swallow = (e: Event) => {
      const target = e.target as Element | null;
      if (target?.closest?.('[data-os-scrollable]')) return;
      e.preventDefault();
    };

    window.addEventListener('wheel', swallow, { passive: false });
    window.addEventListener('touchmove', swallow, { passive: false });

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('wheel', swallow);
      window.removeEventListener('touchmove', swallow);
    };
  }, [activeSection, navTransitioning]);

  /**
   * Trigger the NavTransition pixel cover → reveal flow back to the hero.
   * NavTransition listens for `rc:nav` (see src/components/NavTransition.tsx)
   * and handles the scroll jump + ScrollTrigger.refresh internally.
   */
  function handleExit() {
    window.dispatchEvent(new CustomEvent('rc:nav', { detail: { href: '/' } }));
  }

  // ---------------------------------------------------------------------------
  // Auto-open a window when the user navigates here via a header hash anchor.
  // NavTransition sets $osIntent to 'projects' | 'about' | 'contact' before
  // the cover animation starts. Once OSScreen is active, open the matching
  // window and clear the intent so a later EXIT → re-enter doesn't replay it.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeSection !== 'os') return;
    if (!osIntent) return;
    if (osIntent === 'projects') {
      setProjectsOpen(true);
      setProjectsMinimized(false);
    } else if (osIntent === 'about') {
      setAboutOpen(true);
      setAboutMinimized(false);
    } else if (osIntent === 'contact') {
      setContactOpen(true);
      setContactMinimized(false);
    }
    $osIntent.set(null);
  }, [activeSection, osIntent]);

  if (activeSection !== 'os') return null;

  // ── Open handlers — ensure a freshly-opened window starts un-minimized. ──
  function handleOpenProjects() {
    setProjectsOpen(true);
    setProjectsMinimized(false);
  }

  function handleOpenAboutMe() {
    setAboutOpen(true);
    setAboutMinimized(false);
  }

  function handleOpenContact() {
    setContactOpen(true);
    setContactMinimized(false);
  }

  // ── Close handlers — reset chrome state so next open is clean. ──
  function handleCloseProjects() {
    setProjectsOpen(false);
    setProjectsMinimized(false);
    setProjectsMaximized(false);
  }

  function handleCloseProject() {
    setSelectedProject(null);
    setProjectMinimized(false);
    setProjectMaximized(false);
  }

  function handleCloseAbout() {
    setAboutOpen(false);
    setAboutMinimized(false);
    setAboutMaximized(false);
  }

  function handleCloseContact() {
    setContactOpen(false);
    setContactMinimized(false);
    setContactMaximized(false);
  }

  const hasAnyTab = projectsOpen || selectedProject !== null || aboutOpen || contactOpen;

  return (
    <div
      className="os-bg-grid os-scanlines fixed inset-0 z-50 flex flex-col bg-zinc-950"
      aria-label="RC.OS Desktop"
    >
      {/* ── Title Bar ── */}
      <header className="relative z-10 flex h-10 shrink-0 items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4">
        {/* Left: exit button + brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExit}
            aria-label="Exit OS and return to the intro"
            className="inline-flex items-center gap-1.5 rounded-sm border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-pixel text-xs text-zinc-300 transition-colors hover:border-purple-400 hover:bg-purple-400/10 hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <span aria-hidden="true">×</span>
            <span>EXIT</span>
          </button>
          <span className="font-pixel text-xs text-purple-400">RC.OS</span>
        </div>

        {/* Center: decorative menu items */}
        <nav aria-label="OS menu bar" className="hidden gap-6 sm:flex">
          {['FILE', 'EDIT', 'VIEW', 'HELP'].map((item) => (
            <span
              key={item}
              className="cursor-default font-pixel text-xs text-zinc-600 select-none"
            >
              {item}
            </span>
          ))}
        </nav>

        {/* Right: status */}
        <div className="flex items-center gap-3">
          <span className="hidden font-pixel text-xs text-zinc-600 sm:block" aria-hidden="true">
            ●●○
          </span>
          <OsClock />
        </div>
      </header>

      {/* ── Desktop Area ── */}
      <main
        aria-label="Desktop icons"
        className="relative z-10 flex flex-1 flex-col items-center justify-start px-4 pt-16 sm:pt-20 md:pt-24"
      >
        {/* Desktop label */}
        <p className="mb-8 font-pixel text-xs text-zinc-700 md:mb-12" aria-hidden="true">
          &gt;_ DESKTOP
        </p>

        {/* Folder icon grid */}
        <ul
          aria-label="Desktop folders"
          className="flex list-none flex-wrap justify-center gap-8 p-0 md:gap-16 lg:gap-24"
        >
          <li>
            <FolderIcon
              label="PROJECTS"
              ariaLabel="Open Projects folder — 11 projects"
              onClick={handleOpenProjects}
            />
          </li>
          <li>
            <FolderIcon
              label="ABOUT ME"
              ariaLabel="Open About Me folder"
              onClick={handleOpenAboutMe}
            />
          </li>
          <li>
            <FolderIcon
              label="CONTACT"
              ariaLabel="Open Contact folder"
              onClick={handleOpenContact}
            />
          </li>
        </ul>
      </main>

      {/* ── Dock / Status Bar ── */}
      <footer
        aria-label="Window dock"
        className="relative z-10 flex h-8 shrink-0 items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950 px-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 font-pixel text-xs text-zinc-700">3 ITEMS</span>
          {hasAnyTab && (
            <span className="shrink-0 font-pixel text-xs text-zinc-800" aria-hidden="true">
              |
            </span>
          )}
          <div className="flex min-w-0 flex-wrap items-center gap-2 overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              {projectsOpen && (
                <DockTab
                  key="projects"
                  title="PROJECTS"
                  minimized={projectsMinimized}
                  onToggle={() => setProjectsMinimized((m) => !m)}
                />
              )}
              {selectedProject && (
                <DockTab
                  key={`project-${selectedProject.slug}`}
                  title={selectedProject.name}
                  minimized={projectMinimized}
                  onToggle={() => setProjectMinimized((m) => !m)}
                />
              )}
              {aboutOpen && (
                <DockTab
                  key="about"
                  title="ABOUT ME"
                  minimized={aboutMinimized}
                  onToggle={() => setAboutMinimized((m) => !m)}
                />
              )}
              {contactOpen && (
                <DockTab
                  key="contact"
                  title="CONTACT"
                  minimized={contactMinimized}
                  onToggle={() => setContactMinimized((m) => !m)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
        <span className="shrink-0 font-pixel text-xs text-zinc-700">RC PORTFOLIO v1.0</span>
      </footer>

      {/* ── Projects folder window ── */}
      <ProjectsOverlay
        open={projectsOpen}
        minimized={projectsMinimized}
        maximized={projectsMaximized}
        onClose={handleCloseProjects}
        onMinimize={() => setProjectsMinimized(true)}
        onToggleMaximize={() => setProjectsMaximized((m) => !m)}
        onOpenProject={(project) => {
          // Keep Projects folder mounted so its dock tab remains; minimize
          // it to give the detail window focus without losing context.
          setProjectsMinimized(true);
          setSelectedProject(project);
          setProjectMinimized(false);
          setProjectMaximized(false);
        }}
      />

      {/* ── Project detail window ── */}
      <ProjectDialog
        project={selectedProject}
        minimized={projectMinimized}
        maximized={projectMaximized}
        onClose={handleCloseProject}
        onMinimize={() => setProjectMinimized(true)}
        onToggleMaximize={() => setProjectMaximized((m) => !m)}
      />

      {/* ── About Me window ── */}
      <AboutDialog
        open={aboutOpen}
        minimized={aboutMinimized}
        maximized={aboutMaximized}
        onClose={handleCloseAbout}
        onMinimize={() => setAboutMinimized(true)}
        onToggleMaximize={() => setAboutMaximized((m) => !m)}
      />

      {/* ── Contact window ── */}
      <ContactDialog
        open={contactOpen}
        minimized={contactMinimized}
        maximized={contactMaximized}
        onClose={handleCloseContact}
        onMinimize={() => setContactMinimized(true)}
        onToggleMaximize={() => setContactMaximized((m) => !m)}
      />

      {/* ── Phase 12: Pixelated dissolve intro ──
          Positioned absolutely inside the z-50 root, z-index 40 sits above
          the desktop chrome but below any future portal dialogs. Unmounts
          itself via onDone when the reveal completes (~1.1s), or immediately
          under prefers-reduced-motion. */}
      {showReveal && <PixelReveal onDone={() => setShowReveal(false)} />}
    </div>
  );
}
