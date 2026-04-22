/**
 * Phase 8 — ProjectsOverlay.tsx
 *
 * Projects folder window — shows 11 project subfolder icons.
 * Opens over the OS desktop when the PROJECTS folder is clicked.
 * Rendered as a retro OS window (fixed overlay with title bar and close button).
 *
 * State: managed locally in OSScreen — ProjectsOverlay receives:
 *  - `open`: boolean — whether the window is visible
 *  - `onClose`: () => void — closes the window
 *  - `onOpenProject`: (project: Project) => void — opens a project dialog
 *
 * Requirements: PROJ-001, OS-007, OS-008
 */

import FolderIcon from '@/components/FolderIcon';
import { PROJECTS, type Project } from '@/data/projects';

interface ProjectsOverlayProps {
  open: boolean;
  onClose: () => void;
  onOpenProject: (project: Project) => void;
}

export default function ProjectsOverlay({ open, onClose, onOpenProject }: ProjectsOverlayProps) {
  if (!open) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-30 m-0 flex w-full max-w-none items-start justify-center border-0 bg-black/60 p-0 px-4 pt-12 backdrop-blur-sm sm:pt-16 md:items-center md:pt-0"
      aria-label="Projects folder"
    >
      {/* Retro OS window */}
      <div className="flex max-h-[80dvh] w-full max-w-3xl flex-col overflow-hidden rounded-sm border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Title bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 bg-zinc-800 px-4 py-2">
          <div className="flex items-center gap-3">
            {/* Retro window traffic lights */}
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500 opacity-80" />
              <span className="inline-block h-3 w-3 rounded-full bg-yellow-400 opacity-70" />
              <span className="inline-block h-3 w-3 rounded-full bg-green-500 opacity-70" />
            </div>
            <span className="font-pixel text-xs text-zinc-100">PROJECTS — 11 items</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm font-pixel text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            aria-label="Close Projects folder"
          >
            ×
          </button>
        </div>

        {/* Grid of 11 project folders */}
        <div className="overflow-y-auto p-4 md:p-6">
          <ul
            className="grid list-none grid-cols-3 gap-4 p-0 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            aria-label="Project folders"
          >
            {PROJECTS.map((project) => (
              <li key={project.slug}>
                <FolderIcon
                  label={project.name}
                  ariaLabel={`Open ${project.name} project`}
                  onClick={() => onOpenProject(project)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </dialog>
  );
}
