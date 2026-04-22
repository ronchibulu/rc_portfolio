/**
 * Phase 9 — AboutDialog.tsx
 *
 * About Me dialog with scroll-animated vertical timeline.
 * Mounted inside OSScreen (client:only="react").
 *
 * Layout:
 *  - Shadcn Dialog (centered md+, bottom-sheet max-md via CSS overrides)
 *  - Scrollable content area with vertical timeline
 *  - Two company blocks: UDS and Hypthon (3 grouped titles)
 *  - Each timeline entry animates in on scroll (Motion v12 InView)
 *  - prefers-reduced-motion: entries appear immediately, no animation
 *
 * Requirements: ABOUT-001, ABOUT-002, ABOUT-003, ABOUT-004, ABOUT-005, ABOUT-006
 */

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TIMELINE } from '@/data/timeline';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Animated timeline entry — fades + slides in when scrolled into view */
function TimelineEntry({
  period,
  title,
  highlights,
  reducedMotion,
}: {
  period: string;
  title: string;
  highlights: string[];
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, x: -16 }}
      whileInView={reducedMotion ? {} : { opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative pl-6"
    >
      {/* Timeline dot */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-purple-400"
      />
      {/* Connector line (not on last entry — handled with CSS) */}
      <time dateTime={period} className="mb-1 block font-pixel text-xs text-zinc-500">
        {period}
      </time>
      <h4 className="mb-2 font-pixel text-xs leading-relaxed text-zinc-100">{title}</h4>
      <ul className="flex list-none flex-col gap-1 p-0">
        {highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-400">
            <span className="mt-0.5 shrink-0 text-purple-400" aria-hidden="true">
              ▸
            </span>
            {h}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/** Company block — contains one or more TimelineEntry elements */
function CompanyBlock({
  company,
  periodRange,
  entries,
  reducedMotion,
}: {
  company: string;
  periodRange: string;
  entries: { period: string; title: string; highlights: string[] }[];
  reducedMotion: boolean;
}) {
  return (
    <section aria-label={`${company} employment history`}>
      {/* Company header */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        whileInView={reducedMotion ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.3 }}
        className="mb-4 border-b border-zinc-700 pb-2"
      >
        <h3 className="font-pixel text-xs text-yellow-400">{company}</h3>
        <time className="font-pixel text-xs text-zinc-500">{periodRange}</time>
      </motion.div>

      {/* Timeline entries */}
      <div className="relative ml-2 flex flex-col gap-6 border-l border-zinc-700 pl-4">
        {entries.map((entry) => (
          <TimelineEntry
            key={`${entry.period}-${entry.title}`}
            period={entry.period}
            title={entry.title}
            highlights={entry.highlights}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </section>
  );
}

export default function AboutDialog({ open, onClose }: AboutDialogProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        className={[
          // Base styling
          'flex flex-col gap-0 overflow-hidden border border-zinc-700 bg-zinc-900 p-0 shadow-2xl',
          // Desktop sizing
          'sm:max-w-2xl',
          // Mobile bottom sheet override
          'max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto',
          'max-md:h-[90dvh] max-md:max-w-none',
          'max-md:translate-x-0 max-md:translate-y-0',
          'max-md:rounded-none max-md:rounded-t-2xl',
          'max-md:data-[state=open]:slide-in-from-bottom',
          'max-md:data-[state=closed]:slide-out-to-bottom',
        ].join(' ')}
        aria-describedby="about-timeline-desc"
      >
        {/* Title Bar */}
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-zinc-700 bg-zinc-800 px-4 py-2">
          <div className="flex items-center gap-3">
            {/* Retro window traffic lights */}
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500 opacity-80" />
              <span className="inline-block h-3 w-3 rounded-full bg-yellow-400 opacity-70" />
              <span className="inline-block h-3 w-3 rounded-full bg-green-500 opacity-70" />
            </div>
            <DialogTitle className="font-pixel text-xs text-zinc-100">ABOUT ME</DialogTitle>
          </div>
          <DialogClose
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm font-pixel text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            aria-label="Close About Me dialog"
          >
            ×
          </DialogClose>
        </DialogHeader>

        {/* Scrollable timeline content */}
        <ScrollArea className="flex-1">
          <div id="about-timeline-desc" className="flex flex-col gap-8 p-4 md:p-6">
            {/* Intro */}
            <AnimatePresence>
              <motion.p
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="font-pixel text-xs leading-relaxed text-purple-400"
              >
                &gt;_ Hello! I'm Ronald Cheng — a Senior Full-Stack Developer with 5 years shipping
                production frontends and AI-powered products.
              </motion.p>
            </AnimatePresence>

            {/* Timeline */}
            <div className="flex flex-col gap-10" aria-label="Employment timeline">
              {TIMELINE.map((block) => (
                <CompanyBlock
                  key={block.company}
                  company={block.company}
                  periodRange={block.periodRange}
                  entries={block.entries}
                  reducedMotion={prefersReducedMotion}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
