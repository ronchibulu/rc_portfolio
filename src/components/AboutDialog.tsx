/**
 * Phase 9 — AboutDialog.tsx
 *
 * About Me window. Offers two presentations of the employment history,
 * selectable via a toggle in the top-right of the window title bar:
 *
 *  - SIMPLE    — the original text-only scrollable vertical timeline,
 *                best for quick scanning and screen readers.
 *  - ANIMATED  — a full-bleed slideshow over a Tron-style RetroGrid
 *                background. Each job is a slide; scroll drives
 *                progression with a per-transition lock so one gesture
 *                moves exactly one slide. See AnimatedAboutTimeline.tsx.
 *
 * Layout:
 *  - Shared Window container (red/yellow/green traffic lights)
 *  - Mode toggle wired through Window's `headerRight` slot
 *  - Scrollable content area with vertical timeline (simple mode)
 *  - Or animated slideshow (animated mode)
 *
 * Requirements: ABOUT-001, ABOUT-002, ABOUT-003, ABOUT-004, ABOUT-005, ABOUT-006
 */

import AnimatedAboutTimeline from '@/components/AnimatedAboutTimeline';
import Window from '@/components/Window';
import { TIMELINE } from '@/data/timeline';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

type AboutMode = 'simple' | 'animated';

interface AboutDialogProps {
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
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

/** Segmented two-way toggle used in the title-bar headerRight slot. */
function ModeToggle({
  mode,
  onChange,
}: {
  mode: AboutMode;
  onChange: (m: AboutMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="About view mode"
      className="flex items-center overflow-hidden rounded-sm border border-zinc-700 bg-zinc-900"
    >
      <ModeButton
        selected={mode === 'simple'}
        label="SIMPLE"
        onClick={() => onChange('simple')}
      />
      <ModeButton
        selected={mode === 'animated'}
        label="ANIMATED"
        onClick={() => onChange('animated')}
      />
    </div>
  );
}

function ModeButton({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={[
        'px-2 py-1 font-pixel text-xs transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400',
        selected
          ? 'bg-purple-400 text-zinc-950'
          : 'text-zinc-400 hover:text-zinc-100',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export default function AboutDialog({
  open,
  minimized,
  maximized,
  onClose,
  onMinimize,
  onToggleMaximize,
}: AboutDialogProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [mode, setMode] = useState<AboutMode>('simple');

  /** Changing to animated mode auto-maximizes the window so the 3D scene
   *  gets the full canvas it needs. We don't forcibly un-maximize when
   *  switching back to simple — the user can restore with the green
   *  traffic light if they want the smaller window again. */
  const handleModeChange = (next: AboutMode) => {
    setMode(next);
    if (next === 'animated' && !maximized) {
      onToggleMaximize();
    }
  };

  if (!open) return null;

  return (
    <Window
      title="ABOUT ME"
      ariaLabel="About Me timeline"
      size="md"
      z={40}
      minimized={minimized}
      maximized={maximized}
      onClose={onClose}
      onMinimize={onMinimize}
      onToggleMaximize={onToggleMaximize}
      headerRight={<ModeToggle mode={mode} onChange={handleModeChange} />}
      // Animated mode needs the full canvas for the 3D scene — lock the
      // maximize affordance so the user can't shrink out from under it.
      disableToggleMaximize={mode === 'animated'}
    >
      {mode === 'animated' ? (
        <AnimatedAboutTimeline />
      ) : (
        // Scrollable timeline content — native scroll container with min-h-0
        // so it can shrink inside the flex-col parent and activate overflow-y.
        <div data-os-scrollable className="min-h-0 flex-1 overflow-y-auto">
          <div id="about-timeline-desc" className="flex flex-col gap-8 p-4 md:p-6">
            {/* Intro */}
            <AnimatePresence>
              <motion.p
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="font-pixel text-xs leading-relaxed text-purple-400"
              >
                &gt;_ Hello! I'm Ronald Cheng — a Senior Full-Stack Developer with 5 years
                shipping production frontends and AI-powered products.
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
        </div>
      )}
    </Window>
  );
}
