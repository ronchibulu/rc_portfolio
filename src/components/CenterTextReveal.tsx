/**
 * Phase 12 — CenterTextReveal.tsx
 *
 * Scroll-driven TYPING reveal that plays AFTER the camera fly-in completes and
 * BEFORE the OSScreen activates. Each line types character-by-character as the
 * user scrubs, with a purple caret tracking the active line. Typing is gated
 * to the MOMENT THE FIRST LINE'S ELEMENT REACHES VIEWPORT CENTER — not to the
 * sticky stage engaging — so the reveal never starts before the quote is
 * visually centered on screen. The timeline ends when `#post-flyin-pin`'s
 * bottom reaches the viewport's bottom, at which point ScrollNarrative flips
 * $activeSection to 'os' and OSScreen takes over.
 *
 * Contract:
 *  - Mounted inside #post-flyin-stage (sticky h-dvh inside #post-flyin-pin)
 *  - Single GSAP ScrollTrigger scrub (project rule: sole scroll authority)
 *  - No Tailwind arbitrary values — default scale only
 *  - useGSAP() hook only (project rule — no raw useEffect for GSAP)
 *  - prefers-reduced-motion: all lines shown fully, caret static on final line
 *  - Decorative; hero <h1> already establishes the accessible heading
 *
 * Performance note: GSAP onUpdate writes textContent directly on refs — never
 * setState — so character ticks don't trigger React re-renders.
 */

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Line = {
  text: string;
  tone: 'bright' | 'muted';
  accentWord?: string;
};

const LINES: ReadonlyArray<Line> = [
  { text: 'Full-Stack · Software Engineer · AI', tone: 'bright' },
  { text: '5 years shipping production-grade webapps', tone: 'muted' },
  { text: 'Obsessed with frontend craft.', tone: 'muted', accentWord: 'craft.' },
  { text: 'Welcome to RC.OS_', tone: 'bright', accentWord: 'RC.OS_' },
];

// Relative GSAP timeline durations (same time-unit across all lines). Actual
// tempo is driven by the scrub — these only set ratios inside the timeline.
//
// TAIL_HOLD raised so a substantial share of #post-flyin-pin's scroll range
// sits AFTER typing completes: the reader gets a clear beat with the full
// quote on screen before ScrollNarrative flips $activeSection to 'os'.
//   typing units = 4 lines × (TYPE_DUR + GAP_DUR) = 5
//   total        = typing + TAIL_HOLD = 8
//   post-typing hold ≈ TAIL_HOLD / total = 3/8 ≈ 37.5% of the scroll distance
const TYPE_DUR = 1;
const GAP_DUR = 0.25;
const TAIL_HOLD = 3;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function splitLine(line: Line): { main: string; accent: string } {
  if (!line.accentWord) return { main: line.text, accent: '' };
  const idx = line.text.lastIndexOf(line.accentWord);
  if (idx < 0) return { main: line.text, accent: '' };
  return {
    main: line.text.slice(0, idx),
    accent: line.text.slice(idx),
  };
}

export default function CenterTextReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reduced] = useState<boolean>(() => prefersReducedMotion());

  useGSAP(
    () => {
      if (reduced) return;

      const lineEls = rootRef.current?.querySelectorAll<HTMLElement>('.ct-line');
      if (!lineEls || lineEls.length === 0) return;

      type LineTarget = {
        main: string;
        accent: string;
        mainEl: HTMLElement | null;
        accentEl: HTMLElement | null;
        caretEl: HTMLElement | null;
        total: number;
      };

      const targets: LineTarget[] = Array.from(lineEls).map((el, i) => {
        const { main, accent } = splitLine(LINES[i]);
        return {
          main,
          accent,
          mainEl: el.querySelector<HTMLElement>('.ct-main'),
          accentEl: el.querySelector<HTMLElement>('.ct-accent'),
          caretEl: el.querySelector<HTMLElement>('.ct-caret'),
          total: main.length + accent.length,
        };
      });

      // Reset state so scrub-to-top starts from empty every time.
      targets.forEach((t) => {
        if (t.mainEl) t.mainEl.textContent = '';
        if (t.accentEl) t.accentEl.textContent = '';
        if (t.caretEl) {
          t.caretEl.style.opacity = '0';
          t.caretEl.classList.remove('animate-caret');
        }
      });

      // Typing is gated to the FIRST LINE'S element reaching viewport center
      // — not to the pin engaging. This makes the behaviour robust against
      // sticky timing quirks (ancestor overflow, upstream pin release, etc.).
      // The pin's bottom is still used as the end so the timeline finishes
      // before #post-flyin-pin releases and OSScreen activates.
      const firstLineEl = rootRef.current?.querySelector<HTMLElement>('.ct-line');
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: firstLineEl ?? '#post-flyin-pin',
          start: 'center center',
          endTrigger: '#post-flyin-pin',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      targets.forEach((t, idx) => {
        const counter = { value: 0 };
        const pos = idx * (TYPE_DUR + GAP_DUR);
        const isLast = idx === targets.length - 1;

        // Caret appears on this line as its typing begins.
        tl.set(
          t.caretEl,
          { opacity: 1, onComplete: () => t.caretEl?.classList.remove('animate-caret') },
          pos,
        );

        tl.to(
          counter,
          {
            value: t.total,
            duration: TYPE_DUR,
            ease: 'none',
            onUpdate: () => {
              const n = Math.floor(counter.value);
              const mainLen = t.main.length;
              if (t.mainEl) {
                t.mainEl.textContent = t.main.slice(0, Math.min(n, mainLen));
              }
              if (t.accentEl) {
                t.accentEl.textContent =
                  n > mainLen ? t.accent.slice(0, n - mainLen) : '';
              }
            },
          },
          pos,
        );

        // Hand off the caret: non-final lines drop it; last line keeps blinking.
        if (!isLast) {
          tl.set(t.caretEl, { opacity: 0 }, pos + TYPE_DUR);
        } else {
          tl.call(
            () => {
              t.caretEl?.classList.add('animate-caret');
            },
            [],
            pos + TYPE_DUR,
          );
        }
      });

      // Tail — holds final state at the end of the pin so the reader has a beat
      // with the full quote before OSScreen activates.
      tl.to({}, { duration: TAIL_HOLD });
    },
    { dependencies: [reduced], scope: rootRef },
  );

  // Build line elements once so we can split them between the "first line at
  // viewport center" slot and the "remaining lines below" stack without
  // duplicating JSX. GSAP's querySelectorAll('.ct-line') still finds them all
  // regardless of DOM nesting, so the typing timeline is unaffected.
  const lineElements = LINES.map((line, idx) => {
    const { main, accent } = splitLine(line);
    const base =
      line.tone === 'bright'
        ? 'font-pixel text-sm text-zinc-100 sm:text-base md:text-xl lg:text-2xl'
        : 'font-pixel text-xs text-zinc-400 sm:text-sm md:text-base lg:text-lg';
    const isLast = idx === LINES.length - 1;
    return (
      <p key={idx} className={`ct-line whitespace-pre-wrap ${base}`}>
        <span className="ct-main">{reduced ? main : ''}</span>
        {accent ? (
          <span className="ct-accent text-purple-400">{reduced ? accent : ''}</span>
        ) : null}
        <span
          className={`ct-caret ml-1 inline-block text-purple-400 ${
            reduced && isLast ? 'animate-caret' : ''
          }`}
          style={{ opacity: reduced ? (isLast ? 1 : 0) : 0 }}
        >
          █
        </span>
      </p>
    );
  });

  // Layout rationale:
  //   The first line is absolutely positioned at `top: 50%` with
  //   `-translate-y-1/2`, which pins its geometric center exactly to the
  //   stage's vertical midpoint — no reliance on flex space-distribution or
  //   content measurement. The remaining lines are absolutely positioned at
  //   `top: 50%` too and push downward via `pt-*` so they flow below the
  //   first line without overlap.
  //
  //   Because #post-flyin-stage is sticky at viewport `top-0` once
  //   #post-flyin-pin hits `top top`, the stage's vertical midpoint IS the
  //   viewport's vertical midpoint at that moment — so the first line
  //   lands exactly at screen-center precisely when the scrub ScrollTrigger
  //   fires and typing begins. Before that point the first line is still
  //   rising up from below (empty text, no caret), so the typing effect
  //   only "takes effect" once the first text reaches the center of the
  //   screen.
  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 px-4 text-center"
    >
      {/* First line — geometric center pinned to 50% of the stage. */}
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
        {lineElements[0]}
      </div>
      {/* Remaining lines — start at 50% of the stage, flow downward. pt-*
          provides clearance from the first line above (which is centered on
          the 50% line, so its bottom sits slightly above). */}
      <div className="absolute inset-x-0 top-1/2 flex flex-col items-center gap-6 pt-10 md:gap-8 md:pt-12 lg:gap-10 lg:pt-16">
        {lineElements.slice(1)}
      </div>
    </div>
  );
}
