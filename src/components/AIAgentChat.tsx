/**
 * AIAgentChat.tsx
 *
 * Automated AI-agent chat scene. Renders a FIXED viewport-centered overlay
 * (sibling of #fly-blackout in src/pages/index.astro). #ai-agent-pin acts
 * as the scroll spacer that controls when this overlay is visible — the
 * overlay itself is detached from layout flow so the chat materialises in
 * the centre of the screen the moment the camera fly-in completes (no
 * sliding up from below).
 *
 * Scene flow (each event 500ms after the previous):
 *   1. user prompt     — "Know more about Ronald."                      (instant)
 *   2. thinking        — collapsible accordion, body streamed           (auto-collapses
 *                        on next step → "Thought for X.Xs")
 *   3. ai response 1   — bubble, streamed                               (~22ms / char)
 *   4. tool call       — terminal-style block (spawn_rc_os), lines       (~280ms / line)
 *                        appear sequentially, ends with "✓ ready"
 *   5. ai response 2   — bubble, streamed
 *
 * Pixel avatars (see UserPixelIcon / RcAssistantPixelIcon below) ship as
 * inline SVG with `shape-rendering: crispEdges` — no asset round-trip.
 *
 * Visibility: ScrollTrigger on #ai-agent-pin fades the whole overlay in
 * onEnter + onEnterBack and out onLeave + onLeaveBack. Cascade fires once
 * per mount the first time `armed` flips true.
 *
 * Reduced-motion: all five steps render fully on first paint, no fade,
 * no caret, accordion stays expanded. Overlay is aria-hidden — accessible
 * hero heading lives in HeroTyping.tsx.
 */

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ────────────────────────────────────────────────────────────────────────────
// Step model
// ────────────────────────────────────────────────────────────────────────────

type Step =
  | { kind: 'user'; text: string }
  | { kind: 'thinking'; text: string }
  | { kind: 'ai'; text: string }
  | { kind: 'tool'; name: string; lines: string[] };

const STEPS: ReadonlyArray<Step> = [
  { kind: 'user', text: 'Know more about Ronald.' },
  {
    kind: 'thinking',
    text: 'User wants to know more about the career background of Ronald as a Full-Stack Software Engineer. Searching personal records, project experience, and technical skill set. Compiling the data into RC.OS...',
  },
  {
    kind: 'ai',
    text: 'I have gathered the information about Ronald. Spawning the details in RC.OS...',
  },
  {
    kind: 'tool',
    name: 'spawn_rc_os',
    lines: [
      '> initializing kernel...',
      '> mounting /home/ronald',
      '> loading projects, about, contact',
      '> rendering desktop shell',
      '✓ ready',
    ],
  },
  { kind: 'ai', text: 'RC.OS initialized. Scroll down to enter.' },
];

const CHAR_MS = 22;
const TOOL_LINE_MS = 280;
const STEP_GAP_MS = 500;

const THINKING_DURATION_MS =
  (STEPS[1] as { kind: 'thinking'; text: string }).text.length * CHAR_MS;

// Per-step revealed unit:
//   user / thinking / ai → number of characters revealed
//   tool                  → number of lines revealed
interface StepState {
  mounted: boolean;
  revealed: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function fullCount(step: Step): number {
  return step.kind === 'tool' ? step.lines.length : step.text.length;
}

function fullyRevealedStates(): StepState[] {
  return STEPS.map((s) => ({ mounted: true, revealed: fullCount(s) }));
}

function blankStates(): StepState[] {
  return STEPS.map(() => ({ mounted: false, revealed: 0 }));
}

// ────────────────────────────────────────────────────────────────────────────
// Pixel icons — 8×8 grid scaled to 20×20 with crispEdges. fill="currentColor"
// so the icon picks up the surrounding label/bubble tone.
// ────────────────────────────────────────────────────────────────────────────

function UserPixelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 8 8"
      width="20"
      height="20"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {/* head */}
      <rect x="2" y="0" width="4" height="1" />
      <rect x="1" y="1" width="1" height="3" />
      <rect x="6" y="1" width="1" height="3" />
      <rect x="2" y="4" width="4" height="1" />
      {/* neck */}
      <rect x="3" y="5" width="2" height="1" />
      {/* shoulders / body */}
      <rect x="0" y="6" width="8" height="2" />
    </svg>
  );
}

function RcAssistantPixelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 8 8"
      width="20"
      height="20"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {/* antenna */}
      <rect x="3" y="0" width="2" height="1" />
      <rect x="3" y="1" width="2" height="1" />
      {/* head top */}
      <rect x="1" y="2" width="6" height="1" />
      {/* head body — eyes are negative space at (2,3) and (5,3) */}
      <rect x="0" y="3" width="2" height="1" />
      <rect x="3" y="3" width="2" height="1" />
      <rect x="6" y="3" width="2" height="1" />
      <rect x="0" y="4" width="8" height="1" />
      {/* mouth row — gap at center for the smile */}
      <rect x="0" y="5" width="2" height="1" />
      <rect x="3" y="5" width="2" height="1" />
      <rect x="6" y="5" width="2" height="1" />
      {/* head bottom */}
      <rect x="1" y="6" width="6" height="1" />
      {/* legs */}
      <rect x="2" y="7" width="1" height="1" />
      <rect x="5" y="7" width="1" height="1" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Root
// ────────────────────────────────────────────────────────────────────────────

export default function AIAgentChat() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [reduced] = useState<boolean>(() => prefersReducedMotion());
  const [armed, setArmed] = useState<boolean>(false);
  const [states, setStates] = useState<StepState[]>(() =>
    prefersReducedMotion() ? fullyRevealedStates() : blankStates(),
  );
  const playedRef = useRef<boolean>(false);
  const cancelRef = useRef<boolean>(false);

  // Manual accordion override — null = auto (controlled by step progression).
  // Non-null values are set when the user clicks the thinking summary.
  const [thinkingOpenOverride, setThinkingOpenOverride] = useState<boolean | null>(
    null,
  );

  useGSAP(
    () => {
      gsap.set(overlayRef.current, { opacity: 0 });

      // Single paused tween shared between enter/leave events. play() runs
      // it forward (0→1), reverse() runs it backward toward 0. Using one
      // tween instead of two competing gsap.to() calls eliminates the race
      // condition that left the chat visible after EXIT — when scrollTo(0)
      // crosses the pin range in a single tick, both onEnterBack and
      // onLeaveBack fire back-to-back; with two independent tweens they
      // would fight, but a single play/reverse always converges to the
      // direction matching the trigger's final isActive state.
      const fadeTween = gsap.to(overlayRef.current, {
        opacity: 1,
        duration: reduced ? 0 : 0.5,
        ease: 'power2.out',
        paused: true,
      });

      const visibilityST = ScrollTrigger.create({
        trigger: '#ai-agent-pin',
        start: 'top top',
        end: 'bottom bottom',
        onToggle: (self) => {
          if (self.isActive) fadeTween.play();
          else fadeTween.reverse();
        },
      });

      // Cascade arming — fires on first forward enter (and every re-enter,
      // but setArmed and playedRef make it idempotent).
      const armingST = ScrollTrigger.create({
        trigger: '#ai-agent-pin',
        start: 'top top',
        end: 'bottom bottom',
        onEnter: () => setArmed(true),
        onEnterBack: () => setArmed(true),
      });

      // Initial sync — page may load with scroll already inside or past the pin
      // (refresh, deep-link, browser scroll restore).
      if (visibilityST.isActive) {
        fadeTween.progress(1);
        setArmed(true);
        playedRef.current = true;
        setStates(fullyRevealedStates());
      } else if (visibilityST.progress >= 1) {
        // Past the pin — chat hidden but state at final visible representation
        // so a scroll-up re-entry shows the completed cascade instantly.
        playedRef.current = true;
        setStates(fullyRevealedStates());
      }

      // Reduced-motion users still need the cascade gate flipped so the
      // useEffect below renders the pre-built fully-revealed states.
      if (reduced) setArmed(true);

      return () => {
        visibilityST.kill();
        armingST.kill();
        fadeTween.kill();
      };
    },
    { dependencies: [reduced] },
  );

  // Wall-clock cascade — fires exactly once per mount.
  useEffect(() => {
    if (!armed || reduced) return;
    if (playedRef.current) return;
    playedRef.current = true;
    cancelRef.current = false;

    const setStateAt = (idx: number, next: StepState) => {
      setStates((prev) => {
        const out = prev.slice();
        out[idx] = next;
        return out;
      });
    };

    const streamChars = (idx: number, total: number, onDone: () => void) => {
      let n = 0;
      const tick = () => {
        if (cancelRef.current) return;
        n += 1;
        setStateAt(idx, { mounted: true, revealed: n });
        if (n < total) setTimeout(tick, CHAR_MS);
        else onDone();
      };
      setTimeout(tick, CHAR_MS);
    };

    const streamLines = (idx: number, total: number, onDone: () => void) => {
      let n = 0;
      const tick = () => {
        if (cancelRef.current) return;
        n += 1;
        setStateAt(idx, { mounted: true, revealed: n });
        if (n < total) setTimeout(tick, TOOL_LINE_MS);
        else onDone();
      };
      setTimeout(tick, TOOL_LINE_MS);
    };

    const playStep = (idx: number) => {
      if (cancelRef.current) return;
      if (idx >= STEPS.length) return;

      const step = STEPS[idx];
      const goNext = () => {
        if (idx + 1 < STEPS.length) {
          setTimeout(() => playStep(idx + 1), STEP_GAP_MS);
        }
      };

      if (step.kind === 'user') {
        setStateAt(idx, { mounted: true, revealed: step.text.length });
        goNext();
        return;
      }
      if (step.kind === 'tool') {
        setStateAt(idx, { mounted: true, revealed: 0 });
        streamLines(idx, step.lines.length, goNext);
        return;
      }
      // thinking | ai — stream characters
      setStateAt(idx, { mounted: true, revealed: 0 });
      streamChars(idx, step.text.length, goNext);
    };

    const startTimer = setTimeout(() => playStep(0), STEP_GAP_MS);

    return () => {
      cancelRef.current = true;
      clearTimeout(startTimer);
    };
  }, [armed, reduced]);

  // Determine accordion auto-state: thinking is auto-expanded while it is
  // the most-recent mounted step, then collapses once the next step mounts.
  const thinkingState = states[1];
  const aiResponseAfter = states[2];
  const thinkingDoneStreaming =
    thinkingState.mounted && thinkingState.revealed >= fullCount(STEPS[1]);
  const nextStepStarted = aiResponseAfter.mounted;
  const autoOpen = thinkingState.mounted && !nextStepStarted;
  const thinkingOpen = thinkingOpenOverride ?? autoOpen;

  // Cascade-complete = the final step is fully revealed. Drives the
  // "scroll down" hint below the chat window.
  const lastIdx = STEPS.length - 1;
  const lastStep = STEPS[lastIdx];
  const lastState = states[lastIdx];
  const cascadeDone =
    lastState.mounted && lastState.revealed >= fullCount(lastStep);

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center px-4"
    >
      <div className="flex w-full flex-col items-center gap-6">
        <ChatWindow
          states={states}
          reduced={reduced}
          thinkingOpen={thinkingOpen}
          thinkingDoneStreaming={thinkingDoneStreaming}
          onToggleThinking={() =>
            setThinkingOpenOverride((v) => !(v ?? autoOpen))
          }
        />
        <ScrollHint show={cascadeDone || reduced} reduced={reduced} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Scroll hint — appears beneath the chat once the cascade completes
// ────────────────────────────────────────────────────────────────────────────

interface ScrollHintProps {
  show: boolean;
  reduced: boolean;
}

function ScrollHint({ show, reduced }: ScrollHintProps) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: show ? 1 : 0, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: show ? 0.2 : 0 }}
      className="flex flex-col items-center gap-1 font-pixel text-xs text-zinc-500"
      aria-hidden="true"
    >
      <span>Scroll down to enter RC.OS</span>
      <span className="animate-scrollbob inline-block text-yellow-400">▼</span>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Chat window
// ────────────────────────────────────────────────────────────────────────────

interface ChatWindowProps {
  states: StepState[];
  reduced: boolean;
  thinkingOpen: boolean;
  thinkingDoneStreaming: boolean;
  onToggleThinking: () => void;
}

function ChatWindow({
  states,
  reduced,
  thinkingOpen,
  thinkingDoneStreaming,
  onToggleThinking,
}: ChatWindowProps) {
  // Highest-index mounted bubble (drives caret placement).
  let lastMountedIdx = -1;
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (states[i].mounted) {
      lastMountedIdx = i;
      break;
    }
  }
  const lastStep = lastMountedIdx >= 0 ? STEPS[lastMountedIdx] : null;
  const lastState = lastMountedIdx >= 0 ? states[lastMountedIdx] : null;
  const allDone =
    lastMountedIdx === STEPS.length - 1 &&
    lastStep !== null &&
    lastState !== null &&
    lastState.revealed >= fullCount(lastStep);

  return (
    <div className="relative w-full max-w-4xl overflow-hidden rounded-md border border-zinc-700 bg-zinc-900/95 shadow-2xl">
      {/* Title bar — minimal chatbot chrome (no traffic lights). */}
      <div className="flex items-center gap-3 border-b border-zinc-700 bg-zinc-800/80 px-4 py-2.5">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm bg-purple-400 text-zinc-950">
          <RcAssistantPixelIcon />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-pixel text-xs text-zinc-100">RC Assistant</span>
          <span className="font-sans text-xs text-zinc-500">rc-agent · v1.0</span>
        </div>
        <span className="ml-auto inline-flex items-center gap-2 font-pixel text-xs text-purple-400">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-purple-400 animate-caret" />
          ONLINE
        </span>
      </div>

      {/* Messages */}
      <ul className="flex min-h-72 flex-col gap-4 p-4 sm:min-h-80 md:p-5">
        {STEPS.map((step, idx) => {
          const state = states[idx];
          if (!state.mounted) return null;

          const isLastMounted = idx === lastMountedIdx;
          const total = fullCount(step);
          const isStreaming = isLastMounted && state.revealed < total;
          const showFinalCaret = allDone && idx === STEPS.length - 1;

          if (step.kind === 'thinking') {
            return (
              <ThinkingAccordion
                key={idx}
                text={step.text}
                revealed={state.revealed}
                isStreaming={isStreaming}
                doneStreaming={thinkingDoneStreaming}
                open={thinkingOpen}
                onToggle={onToggleThinking}
              />
            );
          }

          if (step.kind === 'tool') {
            return (
              <ToolCallBlock
                key={idx}
                name={step.name}
                lines={step.lines}
                revealed={state.revealed}
                reduced={reduced}
              />
            );
          }

          // user | ai
          return (
            <Bubble
              key={idx}
              step={step}
              revealed={state.revealed}
              showCaret={
                step.kind === 'ai' && (isStreaming || showFinalCaret)
              }
              caretBlink={showFinalCaret && !isStreaming}
              reduced={reduced}
            />
          );
        })}
      </ul>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Bubble (user / ai)
// ────────────────────────────────────────────────────────────────────────────

interface BubbleProps {
  step: { kind: 'user' | 'ai'; text: string };
  revealed: number;
  showCaret: boolean;
  caretBlink: boolean;
  reduced: boolean;
}

function Bubble({ step, revealed, showCaret, caretBlink, reduced }: BubbleProps) {
  const isUser = step.kind === 'user';
  // User: bubble on the left, icon on the right edge → row-reverse so the
  // icon hugs the right margin while the bubble sits inside.
  // AI:   icon on the left, bubble on the right → default row.
  const rowAlign = isUser
    ? 'self-end flex-row-reverse'
    : 'self-start flex-row';
  const bubbleTone = isUser
    ? 'bg-purple-400 text-zinc-950'
    : 'bg-zinc-800 text-zinc-100 border border-zinc-700';
  const Icon = isUser ? UserPixelIcon : RcAssistantPixelIcon;
  // Solid square so the inline avatar reads as an icon chip instead of
  // floating SVG. Tones match the bubble's accent colour.
  const iconChip = isUser
    ? 'bg-purple-400 text-zinc-950'
    : 'bg-zinc-800 text-purple-400 border border-zinc-700';

  const visible = step.text.slice(0, revealed);

  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex max-w-2xl items-end gap-2 ${rowAlign}`}
    >
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${iconChip}`}
        aria-hidden="true"
      >
        <Icon />
      </span>
      <div className={`rounded-sm px-3 py-2 ${bubbleTone}`}>
        <span className="font-sans text-xs leading-relaxed">{visible}</span>
        {showCaret ? (
          <span
            aria-hidden="true"
            className={`ml-1 inline-block font-sans text-xs ${
              caretBlink ? 'animate-caret' : ''
            }`}
          >
            █
          </span>
        ) : null}
      </div>
    </motion.li>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Thinking accordion — borderless, smaller text, click-to-toggle
// ────────────────────────────────────────────────────────────────────────────

interface ThinkingAccordionProps {
  text: string;
  revealed: number;
  isStreaming: boolean;
  doneStreaming: boolean;
  open: boolean;
  onToggle: () => void;
}

function ThinkingAccordion({
  text,
  revealed,
  isStreaming,
  doneStreaming,
  open,
  onToggle,
}: ThinkingAccordionProps) {
  const summaryLabel = isStreaming
    ? 'Thinking...'
    : doneStreaming
      ? `Thought for ${(THINKING_DURATION_MS / 1000).toFixed(1)}s`
      : 'Thinking...';

  return (
    <li className="self-start max-w-2xl">
      <button
        type="button"
        onClick={onToggle}
        className="pointer-events-auto inline-flex items-center gap-2 font-pixel text-xs text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        aria-expanded={open}
      >
        <span aria-hidden="true" className="inline-block w-3 text-zinc-500">
          {open ? '▼' : '▶'}
        </span>
        <span>{summaryLabel}</span>
      </button>
      {open ? (
        <div className="mt-2 pl-5">
          <p className="font-sans text-xs italic leading-relaxed text-zinc-500">
            {text.slice(0, revealed)}
            {isStreaming ? (
              <span aria-hidden="true" className="ml-0.5 inline-block">
                ▍
              </span>
            ) : null}
          </p>
        </div>
      ) : null}
    </li>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tool call block — terminal-style, monospace, lines stream in sequentially
// ────────────────────────────────────────────────────────────────────────────

interface ToolCallBlockProps {
  name: string;
  lines: string[];
  revealed: number;
  reduced: boolean;
}

function ToolCallBlock({ name, lines, revealed, reduced }: ToolCallBlockProps) {
  const isComplete = revealed >= lines.length;

  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="self-start w-full max-w-xl"
    >
      <div className="overflow-hidden rounded-sm border border-zinc-700 bg-zinc-950">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-700 bg-zinc-800/60 px-3 py-1.5">
          <span className="inline-flex items-center gap-2 font-pixel text-xs text-yellow-400">
            <span aria-hidden="true">⚙</span>
            tool · {name}
          </span>
          <span
            className={`font-pixel text-xs ${
              isComplete ? 'text-purple-400' : 'text-zinc-500'
            }`}
          >
            {isComplete ? 'DONE' : 'RUN'}
          </span>
        </div>
        <pre className="m-0 px-3 py-2 font-sans text-xs leading-relaxed text-zinc-400 whitespace-pre-wrap">
          {lines.slice(0, revealed).map((line, i) => (
            <span key={i} className={line.startsWith('✓') ? 'text-purple-400' : ''}>
              {line}
              {'\n'}
            </span>
          ))}
        </pre>
      </div>
    </motion.li>
  );
}
