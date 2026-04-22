/**
 * Phase 7/8/9 — OSScreen.tsx
 *
 * Retro OS desktop shell that appears after the camera fly-in blackout.
 * Mounted via client:only="react" in index.astro.
 *
 * Rendering logic:
 *  - Subscribes to $activeSection nanostore
 *  - Returns null (hidden) when activeSection !== 'os'
 *  - When 'os': renders full-screen fixed overlay above canvas (z-20)
 *
 * State:
 *  - projectsOpen: boolean — whether the Projects folder window is open (Phase 8)
 *  - selectedProject: Project | null — which project dialog is open (Phase 8)
 *  - aboutOpen: boolean — whether About Me dialog is open (Phase 9)
 *
 * Layout:
 *  - Fixed full-screen, z-20 (above canvas z-0, below dialogs z-50)
 *  - bg-zinc-950 + .os-bg-grid dot pattern + .os-scanlines pseudo-element
 *  - Retro title bar at top (h-10)
 *  - Desktop content area: centered folder icons
 */

import AboutDialog from '@/components/AboutDialog';
import type { Project } from '@/data/projects';
import { $activeSection } from '@/stores';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
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

export default function OSScreen() {
  const activeSection = useStore($activeSection);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  // Phase 9: aboutOpen wired here but dialog implemented in Phase 9
  const [aboutOpen, setAboutOpen] = useState(false);

  if (activeSection !== 'os') return null;

  function handleOpenProjects() {
    setProjectsOpen(true);
  }

  function handleOpenAboutMe() {
    // Phase 9: about me timeline dialog
    setAboutOpen(true);
  }

  return (
    <div
      className="os-bg-grid os-scanlines fixed inset-0 z-20 flex flex-col bg-zinc-950"
      aria-label="RC.OS Desktop"
    >
      {/* ── Title Bar ── */}
      <header className="relative z-10 flex h-10 shrink-0 items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4">
        {/* Left: brand */}
        <span className="font-pixel text-xs text-purple-400">RC.OS</span>

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
        </ul>
      </main>

      {/* ── Status Bar ── */}
      <footer className="relative z-10 flex h-8 shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-950 px-4">
        <span className="font-pixel text-xs text-zinc-700">2 ITEMS</span>
        <span className="font-pixel text-xs text-zinc-700">RC PORTFOLIO v1.0</span>
      </footer>

      {/* ── Phase 8: Projects overlay (z-30) ── */}
      <ProjectsOverlay
        open={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        onOpenProject={(project) => {
          setProjectsOpen(false);
          setSelectedProject(project);
        }}
      />

      {/* ── Phase 8: Project detail dialog (z-50 via Shadcn Dialog portal) ── */}
      <ProjectDialog project={selectedProject} onClose={() => setSelectedProject(null)} />

      {/* ── Phase 9: About Me dialog ── */}
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
