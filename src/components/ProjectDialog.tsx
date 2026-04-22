/**
 * Phase 8 — ProjectDialog.tsx
 *
 * Responsive project detail dialog.
 * - Desktop (md+): Shadcn Dialog centered modal, max-w-3xl
 * - Mobile (< md): bottom sheet behaviour via CSS overrides on DialogContent
 *
 * Contains:
 *  - Retro OS title-bar header (window chrome, project name, close button)
 *  - Image slider (Shadcn Carousel, keyboard accessible, aria-labels)
 *  - Project name, live URL, description
 *  - Tech badge row (Shadcn Badge)
 *
 * Requirements: OS-007, OS-008, OS-009, PROJ-002, PROJ-003, PROJ-004, PROJ-005
 */

import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Project } from '@/data/projects';

interface ProjectDialogProps {
  project: Project | null;
  onClose: () => void;
}

/** Fallback image shown when a screenshot path does not resolve. */
function PlaceholderImage({ name }: { name: string }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-zinc-800"
      aria-label={`${name} screenshot placeholder`}
    >
      <span className="font-pixel text-xs text-zinc-500">[ screenshot ]</span>
    </div>
  );
}

export default function ProjectDialog({ project, onClose }: ProjectDialogProps) {
  if (!project) return null;

  const hasImages = project.images.length > 0;

  return (
    <Dialog
      open={!!project}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={[
          // Base — OS window chrome: zinc-900 bg, zinc-700 border
          'flex flex-col gap-0 overflow-hidden border border-zinc-700 bg-zinc-900 p-0 shadow-2xl',
          // Desktop sizing
          'sm:max-w-3xl',
          // Mobile bottom sheet override (max-width < 768px)
          'max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto',
          'max-md:h-[90dvh] max-md:max-w-none',
          'max-md:translate-x-0 max-md:translate-y-0',
          'max-md:rounded-none max-md:rounded-t-2xl',
          'max-md:data-[state=open]:slide-in-from-bottom',
          'max-md:data-[state=closed]:slide-out-to-bottom',
        ].join(' ')}
        aria-describedby={`project-${project.slug}-desc`}
      >
        {/* ── Title Bar ── */}
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-zinc-700 bg-zinc-800 px-4 py-2">
          <div className="flex items-center gap-3">
            {/* Retro window traffic lights */}
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500 opacity-80" />
              <span className="inline-block h-3 w-3 rounded-full bg-yellow-400 opacity-70" />
              <span className="inline-block h-3 w-3 rounded-full bg-green-500 opacity-70" />
            </div>
            <DialogTitle className="font-pixel text-xs text-zinc-100">{project.name}</DialogTitle>
          </div>

          <DialogClose
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm font-pixel text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            aria-label="Close project dialog"
          >
            ×
          </DialogClose>
        </DialogHeader>

        {/* ── Scrollable content ── */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
          {/* Image slider */}
          {hasImages && (
            <section aria-label={`${project.name} screenshots`}>
              <Carousel opts={{ loop: project.images.length > 1 }} className="w-full">
                <CarouselContent>
                  {project.images.map((src, i) => (
                    <CarouselItem key={src}>
                      <div className="relative aspect-video overflow-hidden rounded-sm bg-zinc-800">
                        <img
                          src={src}
                          alt={`${project.name} screenshot ${i + 1} of ${project.images.length}`}
                          aria-label={`${project.name} screenshot ${i + 1} of ${project.images.length}`}
                          className="h-full w-full object-cover"
                          loading={i === 0 ? 'eager' : 'lazy'}
                          onError={(e) => {
                            // Hide broken image, show placeholder
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            const placeholder = e.currentTarget.nextElementSibling;
                            if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 hidden items-center justify-center bg-zinc-800">
                          <PlaceholderImage name={project.name} />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {project.images.length > 1 && (
                  <>
                    <CarouselPrevious
                      className="left-2 border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                      aria-label={`Previous ${project.name} screenshot`}
                    />
                    <CarouselNext
                      className="right-2 border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                      aria-label={`Next ${project.name} screenshot`}
                    />
                  </>
                )}
              </Carousel>
            </section>
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
                className="font-pixel text-xs text-purple-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
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
      </DialogContent>
    </Dialog>
  );
}
