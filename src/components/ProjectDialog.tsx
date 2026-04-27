/**
 * Phase 8 — ProjectDialog.tsx
 *
 * Project detail window — rendered as a retro OS window (not a modal Dialog)
 * so it can coexist with the Projects folder, be dragged around the desktop,
 * minimized to the bottom dock, or maximized.
 *
 * Contains:
 *  - Shared `Window` chrome (drag handle + red/yellow/green traffic lights)
 *  - PixelGallery — retro filmstrip viewer with CRT scanlines, thumb strip,
 *    keyboard nav, stepped crossfade
 *  - Project name, live URL, description
 *  - Tech badge row (Shadcn Badge)
 *
 * Requirements: OS-007, OS-008, OS-009, PROJ-002, PROJ-003, PROJ-004, PROJ-005
 */

import PixelGallery from '@/components/PixelGallery';
import { Badge } from '@/components/ui/badge';
import Window from '@/components/Window';
import type { Project } from '@/data/projects';

interface ProjectDialogProps {
  project: Project | null;
  minimized: boolean;
  maximized: boolean;
  zIndex?: number;
  onFocus?: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
}

export default function ProjectDialog({
  project,
  minimized,
  maximized,
  zIndex,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
}: ProjectDialogProps) {
  if (!project) return null;

  const hasImages = project.images.length > 0;

  return (
    <Window
      title={project.name}
      ariaLabel={`${project.name} — project details`}
      size="lg"
      z={40}
      zIndex={zIndex}
      onFocus={onFocus}
      minimized={minimized}
      maximized={maximized}
      onClose={onClose}
      onMinimize={onMinimize}
      onToggleMaximize={onToggleMaximize}
    >
      <div
        data-os-scrollable
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-4 md:p-6"
        aria-describedby={`project-${project.slug}-desc`}
      >
        {hasImages && (
          <PixelGallery images={project.images} name={project.name} />
        )}

        {/* Project info */}
        <div className="flex flex-col gap-3">
          {/* Name + URL */}
          <div className="flex flex-col gap-1">
            <h2 className="font-pixel text-sm text-zinc-100">{project.name}</h2>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel text-xs break-all text-purple-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              aria-label={`Visit ${project.name} (opens in new tab)`}
            >
              {project.url}
            </a>
          </div>

          {/* Description */}
          <p
            id={`project-${project.slug}-desc`}
            className="text-sm leading-relaxed text-zinc-400"
          >
            {project.description}
          </p>

          {/* Tech badges */}
          <div className="flex flex-wrap gap-2" aria-label="Technologies used">
            {project.tech.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-zinc-700 bg-zinc-800 font-pixel text-xs text-zinc-300"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Window>
  );
}
