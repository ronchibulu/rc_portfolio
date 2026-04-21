/*
 * Phase 2 — HeroTyping.tsx
 * React 19 island mounted via client:only="react" in src/pages/index.astro.
 *
 * Contract: 02-UI-SPEC §Typing Animation Contract.
 *  - 3 lines in sequence: name -> role -> tagline (with ">_ " prefix + "pixel-sharp" highlight)
 *  - Speed: ~22ms per char (45 chars/sec)
 *  - Hold: 400ms between lines
 *  - Caret: purple-400 "█" — solid while typing, blinks (.animate-caret) at rest on line 3
 *  - Reduced-motion: render all three lines immediately, no caret, no holds
 *  - No SSR output (client:only) — HERO-001 served by <noscript> in index.astro
 *
 * The ".animate-caret" utility class and its @keyframes caret-blink are defined in
 * src/styles/globals.css (Plan 01 Task 1). This component only references the class name.
 */

import { useEffect, useRef, useState } from 'react';

interface HeroTypingProps {
  name: string;
  role: string;
  tagline: string;
}

const CHAR_MS = 22; // ~45 chars/sec
const HOLD_MS = 400; // pause between lines
const TAGLINE_PREFIX = '>_ '; // three chars: ">", "_", " "
const YELLOW_WORD = 'pixel-sharp';

type Phase =
  | { kind: 'idle' }
  | { kind: 'typing'; line: 0 | 1 | 2; charIndex: number }
  | { kind: 'holding'; nextLine: 1 | 2 }
  | { kind: 'done' };

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Render the tagline (line 3) with the ">_ " prefix in purple-400 font-pixel and the
 * body in font-sans with a yellow-400 span around "pixel-sharp" when fully revealed.
 * During progressive reveal, `visibleChars` controls how much of the full string
 * (prefix + tagline) is visible. Coloring segments are calculated against the full
 * string's character indices and clipped to `visibleChars`.
 */
function renderTagline(tagline: string, visibleChars: number) {
  const prefixLen = TAGLINE_PREFIX.length; // 3
  const taglineHasYellow = tagline.indexOf(YELLOW_WORD) >= 0;

  // How many chars of each segment are currently visible.
  const visPrefix = Math.min(visibleChars, prefixLen);
  const visTaglineBody = Math.max(0, visibleChars - prefixLen);

  if (!taglineHasYellow) {
    // Graceful fallback: no yellow highlighting, whole body in zinc-500 font-sans.
    return (
      <>
        <span className="font-pixel text-purple-400">{TAGLINE_PREFIX.slice(0, visPrefix)}</span>
        <span className="font-sans text-zinc-500">{tagline.slice(0, visTaglineBody)}</span>
      </>
    );
  }

  // Segment slice indices within the tagline (not including the prefix).
  const yellowLocalStart = tagline.indexOf(YELLOW_WORD);
  const yellowLocalEnd = yellowLocalStart + YELLOW_WORD.length;

  const preYellow = tagline.slice(0, yellowLocalStart);
  const yellow = tagline.slice(yellowLocalStart, yellowLocalEnd);
  const postYellow = tagline.slice(yellowLocalEnd);

  // Progressive-reveal slices:
  const vPre = preYellow.slice(0, Math.min(visTaglineBody, preYellow.length));
  const vYellow = yellow.slice(
    0,
    Math.max(0, Math.min(visTaglineBody - preYellow.length, yellow.length)),
  );
  const vPost = postYellow.slice(0, Math.max(0, visTaglineBody - preYellow.length - yellow.length));

  return (
    <>
      <span className="font-pixel text-purple-400">{TAGLINE_PREFIX.slice(0, visPrefix)}</span>
      <span className="font-sans text-zinc-500">{vPre}</span>
      <span className="font-sans text-yellow-400">{vYellow}</span>
      <span className="font-sans text-zinc-500">{vPost}</span>
    </>
  );
}

export default function HeroTyping({ name, role, tagline }: HeroTypingProps) {
  // Read reduced-motion ONCE at mount — feed the same value into every downstream hook
  // so we don't re-evaluate window.matchMedia three times on the same tick.
  const prefersReduced = prefersReducedMotion();

  const [reduced] = useState<boolean>(() => prefersReduced);

  // Current typing phase.
  const [phase, setPhase] = useState<Phase>(() =>
    prefersReduced ? { kind: 'done' } : { kind: 'idle' },
  );

  // Visible-char counters per line.
  // client:only="react" — no SSR output, so no hydration mismatch risk.
  // reduced-motion -> render all final text immediately (HERO-004).
  const [shown, setShown] = useState<[number, number, number]>(() => {
    if (prefersReduced) {
      return [name.length, role.length, TAGLINE_PREFIX.length + tagline.length];
    }
    return [0, 0, 0];
  });

  // Keep the latest lines in refs so the effect below doesn't re-subscribe on prop changes.
  const linesRef = useRef<[string, string, string]>([name, role, TAGLINE_PREFIX + tagline]);
  linesRef.current = [name, role, TAGLINE_PREFIX + tagline];

  useEffect(() => {
    if (reduced) return; // reduced-motion: everything is already in "done" state.

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const advance = (current: Phase) => {
      if (cancelled) return;
      setPhase(current);

      if (current.kind === 'idle') {
        timer = setTimeout(() => advance({ kind: 'typing', line: 0, charIndex: 0 }), 0);
        return;
      }

      if (current.kind === 'typing') {
        const fullLen = linesRef.current[current.line].length;
        if (current.charIndex >= fullLen) {
          if (current.line === 2) {
            advance({ kind: 'done' });
            return;
          }
          const nextLine = (current.line + 1) as 1 | 2;
          timer = setTimeout(() => advance({ kind: 'holding', nextLine }), HOLD_MS);
          return;
        }

        setShown((prev) => {
          const next: [number, number, number] = [...prev] as [number, number, number];
          next[current.line] = current.charIndex + 1;
          return next;
        });

        timer = setTimeout(
          () =>
            advance({
              kind: 'typing',
              line: current.line,
              charIndex: current.charIndex + 1,
            }),
          CHAR_MS,
        );
        return;
      }

      if (current.kind === 'holding') {
        advance({
          kind: 'typing',
          line: current.nextLine,
          charIndex: 0,
        });
        return;
      }

      // kind === "done" — nothing to schedule; caret blinks via CSS.
    };

    advance({ kind: 'idle' });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reduced]);

  const [shown0, shown1, shown2] = shown;
  const isDone = phase.kind === 'done';
  const currentLine = phase.kind === 'typing' ? phase.line : null;

  const visibleName = name.slice(0, shown0);
  const visibleRole = role.slice(0, shown1);

  // Caret rendering rules:
  //  - reduced-motion: never render caret
  //  - typing on a line: inline caret at end of that line, NO blink
  //  - done: blinking caret at end of line 3
  const caretNode = (blinking: boolean) =>
    reduced ? null : (
      <span
        aria-hidden="true"
        className={`ml-1 inline-block text-purple-400${blinking ? ' animate-caret' : ''}`}
      >
        █
      </span>
    );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/*
       * SR-only mirror: announce the final hero copy exactly once. The animated
       * elements below are aria-hidden so screen readers do not re-announce on
       * every character tick (per-render announcement is SR/browser-dependent
       * and at best noisy, at worst unintelligible). The <h1> lives here (not on
       * the visual element) so the document keeps exactly one accessible heading
       * with stable final text — the visual <div> below renders the same name
       * with the typing reveal.
       */}
      <div className="sr-only">
        <h1>{name}</h1>
        <p>{role}</p>
        <p>
          {TAGLINE_PREFIX}
          {tagline}
        </p>
      </div>

      <div
        aria-hidden="true"
        className="font-pixel text-3xl leading-tight text-zinc-100 sm:text-4xl md:text-5xl lg:text-6xl"
      >
        {visibleName}
        {currentLine === 0 ? caretNode(false) : null}
      </div>

      <p
        aria-hidden="true"
        className="font-pixel text-base leading-snug text-purple-400 sm:text-lg md:text-xl lg:text-2xl"
      >
        {visibleRole}
        {currentLine === 1 ? caretNode(false) : null}
      </p>

      <p aria-hidden="true" className="text-sm leading-relaxed sm:text-base md:text-lg">
        {renderTagline(tagline, shown2)}
        {currentLine === 2 ? caretNode(false) : null}
        {isDone ? caretNode(true) : null}
      </p>
    </div>
  );
}
