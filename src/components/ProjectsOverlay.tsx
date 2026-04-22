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
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onOpenProject: (project: Project) => void;
}

export default function ProjectsOverlay({
  open,
  minimized,
  maximized,
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
      minimized={minimized}
      maximized={maximized}
      onClose={onClose}
      onMinimize={onMinimize}
      onToggleMaximize={onToggleMaximize}
    >
      {/* Flex-wrap of 11 project folders — keeps source order but centers
          every row (including the trailing 5th item of the last row) so the
          last row doesn't read as "short" against a 6-column grid. Fixed
          per-item width keeps columns visually aligned across rows. */}
      <div className="overflow-y-auto p-4 md:p-6">
        <ul
          className="flex list-none flex-wrap justify-center gap-4 p-0 md:gap-6"
          aria-label="Project folders"
        >
          {PROJECTS.map((project) => (
            <li key={project.slug} className="flex w-28 justify-center md:w-32 lg:w-36">
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
