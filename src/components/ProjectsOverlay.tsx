/**
 * Phase 8 — ProjectsOverlay.tsx
 *
 * Projects folder window — shows 11 project subfolder icons.
 * Opens over the OS desktop when the PROJECTS folder is clicked.
 * Rendered as a retro OS window via the shared `Window` chrome
 * (draggable title bar, minimize/maximize/close traffic lights).
 *
 * State: managed in OSScreen — ProjectsOverlay receives:
 *  - `open`: boolean — whether the window is mounted
 *  - `minimized` / `maximized`: boolean — window chrome state
 *  - `onClose`, `onMinimize`, `onToggleMaximize`: handlers
 *  - `onOpenProject`: (project) => void — opens a project dialog
 *
 * Requirements: PROJ-001, OS-007, OS-008
 */

import FolderIcon from '@/components/FolderIcon';
import Window from '@/components/Window';
import { PROJECTS, type Project } from '@/data/projects';

interface ProjectsOverlayProps {
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  zIndex?: number;
  onFocus?: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onOpenProject: (project: Project) => void;
}

export default function ProjectsOverlay({
  open,
  minimized,
  maximized,
  zIndex,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onOpenProject,
}: ProjectsOverlayProps) {
  if (!open) return null;

  return (
    <Window
      title="PROJECTS — 11 items"
      ariaLabel="Projects folder"
      size="lg"
      z={30}
      zIndex={zIndex}
      onFocus={onFocus}
      minimized={minimized}
      maximized={maximized}
      onClose={onClose}
      onMinimize={onMinimize}
      onToggleMaximize={onToggleMaximize}
    >
      {/* Flex-wrap of 11 project folders — keeps source order but centers
          every row so the trailing tile doesn't read as "short". Two tiles
          per row on mobile to prevent label overlap, three at sm:, then
          wider per-item cells at md:/lg: for the full grid.
          `flex-1 min-h-0` on the scroll container lets it honor Window's
          max-h-[85dvh] and scroll when content overflows. */}
      <div
        data-os-scrollable
        className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6"
      >
        <ul
          className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 2xl:grid-cols-5"
          aria-label="Project folders"
        >
          {PROJECTS.map((project) => (
            <li key={project.slug} className="flex min-w-0 justify-center">
              <FolderIcon
                label={project.name}
                ariaLabel={`Open ${project.name} project`}
                onClick={() => onOpenProject(project)}
              />
            </li>
          ))}
        </ul>
      </div>
    </Window>
  );
}
