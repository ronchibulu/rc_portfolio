/**
 * AnimatedAboutTimeline.tsx
 *
 * The "animated" variant of the ABOUT ME dialog. Presents each job as
 * a card laid out in 3D space along the RetroGrid's vanishing axis.
 * Transitioning between jobs pushes a virtual camera forward along Z,
 * so the current card rushes past the viewer (scales up, fades out)
 * while the next card grows from the horizon to its resting pose.
 *
 * Choreography:
 *   - All cards mount once at fixed world-Z positions (worldZ = -idx * SPACING).
 *   - A shared `cameraZ` MotionValue animates from oldIdx*SPACING to
 *     newIdx*SPACING over 0.9s on each gesture.
 *   - Each card derives its own screen-Z via useTransform:
 *       relZ = cameraZ - worldZ
 *     Opacity fades in on approach and fades out once the card passes
 *     the camera plane (relZ > 0).
 *   - CSS `perspective` on the parent stage handles the automatic
 *     scaling so distant cards are small and the passing card blows up
 *     just before fading, selling "traveling through space".
 *
 * Input is locked per transition: one scroll gesture = one slide. Wheel,
 * touch, keyboard arrows, and side-timeline clicks all funnel through
 * the same `goTo()` to guarantee the lock behavior.
 *
 * Respects prefers-reduced-motion: camera animation duration collapses
 * to 0, RetroGrid stops moving, and the view becomes an instant cut.
 */

import { JOBS } from '@/data/timeline';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import RetroGrid from '@/components/RetroGrid';

/** Z distance (px) between adjacent cards in world space. Also the
 *  distance cameraZ travels per transition. */
const CARD_SPACING = 900;

/** Camera perspective in px — smaller = more exaggerated depth. */
const PERSPECTIVE = 1200;

/** Milliseconds to lock input after a slide starts transitioning.
 *  Must exceed the camera animation duration below. */
const LOCK_MS = 950;

/** Camera tween duration in seconds. */
const CAMERA_DURATION_S = 0.9;

type Direction = 1 | -1;

export default function AnimatedAboutTimeline() {
  const reducedMotion = useReducedMotion() ?? false;

  const [idx, setIdx] = useState(0);
  const [boosting, setBoosting] = useState(false);

  // Mirror state in refs so the native wheel listener (attached once)
  // can read current values without re-binding on every render.
  const idxRef = useRef(0);
  const lockRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Shared camera Z — every Card3D reads from this and derives its own
  // relZ. Driving one MotionValue keeps all cards perfectly in sync.
  const cameraZ = useMotionValue(0);

  const max = JOBS.length - 1;

  const goTo = useCallback(
    (target: number, _direction: Direction) => {
      if (lockRef.current) return;
      if (target < 0 || target > max) return;
      if (target === idxRef.current) return;

      lockRef.current = true;
      setIdx(target);
      idxRef.current = target;
      setBoosting(true);

      window.setTimeout(() => {
        lockRef.current = false;
        setBoosting(false);
      }, LOCK_MS);
    },
    [max],
  );

  /** Drive cameraZ toward the new slide's world position. */
  useEffect(() => {
    const controls = animate(cameraZ, idx * CARD_SPACING, {
      duration: reducedMotion ? 0 : CAMERA_DURATION_S,
      ease: [0.32, 0, 0.3, 1],
    });
    return () => controls.stop();
  }, [idx, reducedMotion, cameraZ]);

  /** Wheel lock — must use native addEventListener for non-passive so
   *  preventDefault stops page scroll from leaking into the dialog. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (lockRef.current) return;
      // Ignore microscopic deltas — trackpad momentum tails often fire
      // dozens of ~0.5px events after a flick, which would otherwise
      // queue a second transition.
      if (Math.abs(e.deltaY) < 3) return;
      const direction: Direction = e.deltaY > 0 ? 1 : -1;
      goTo(idxRef.current + direction, direction);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [goTo]);

  /** Keyboard arrows — mirrors wheel. Focus the container to activate. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goTo(idxRef.current + 1, 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(idxRef.current - 1, -1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0, -1);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(max, 1);
      }
    };

    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [goTo, max]);

  /** Touch — single-finger swipe drives the same goTo path. */
  const touchRef = useRef<{ y: number; handled: boolean }>({ y: 0, handled: false });
  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { y: e.touches[0].clientY, handled: false };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchRef.current.handled) return;
    const dy = touchRef.current.y - e.touches[0].clientY;
    if (Math.abs(dy) < 40) return;
    const direction: Direction = dy > 0 ? 1 : -1;
    goTo(idxRef.current + direction, direction);
    touchRef.current.handled = true;
  };

  return (
    <div
      ref={containerRef}
      data-os-scrollable
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      tabIndex={0}
      role="region"
      aria-roledescription="slideshow"
      aria-label="Animated employment timeline"
      className={[
        'relative min-h-0 flex-1 overflow-hidden bg-zinc-950 outline-none',
        'focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-inset',
      ].join(' ')}
    >
      {/* Scrolling perspective grid — lives behind the card stage so
          cards read as floating in the same 3D space as the grid. */}
      <RetroGrid boost={boosting} reducedMotion={reducedMotion} />

      {/* 3D card stage. `perspective` here makes every child's translateZ
          render with depth distortion. Cards share one cameraZ so they
          travel in lock-step. On mobile the SideTimeline is hidden so the
          stage spans the full width (cards center in the viewport); on
          md+ we reserve the right gutter for the timeline overlay. */}
      <div
        className="absolute inset-y-0 left-0 right-0 md:right-40"
        style={{
          perspective: `${PERSPECTIVE}px`,
          perspectiveOrigin: '50% 50%',
        }}
      >
        {JOBS.map((job, i) => (
          <Card3D
            key={`${job.company}-${job.period}`}
            job={job}
            jobIdx={i}
            total={JOBS.length}
            cameraZ={cameraZ}
          />
        ))}
      </div>

      {/* Right-side progress navigator — flat overlay, lives OUTSIDE the
          perspective stage so it doesn't tilt with the cards. */}
      <SideTimeline activeIdx={idx} onJump={goTo} reducedMotion={reducedMotion} />

      {/* First-run scroll hint — fades out after the user moves. */}
      {idx === 0 && !boosting ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2"
        >
          <span className="font-pixel text-xs text-zinc-500">
            scroll ▾ to continue
          </span>
        </motion.div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Card3D
// ─────────────────────────────────────────────────────────────────────────

interface Card3DProps {
  job: (typeof JOBS)[number];
  jobIdx: number;
  total: number;
  cameraZ: MotionValue<number>;
}

/** One job rendered as a 3D-positioned card. All cards mount at once at
 *  fixed world-Z positions; the shared cameraZ drives how each relates
 *  to the viewer this frame. */
function Card3D({ job, jobIdx, total, cameraZ }: Card3DProps) {
  /** Screen-relative Z position. Positive = in front of the camera
   *  (past viewer), negative = behind (still ahead along the path). */
  const relZ = useTransform(cameraZ, (cz) => cz - jobIdx * CARD_SPACING);

  /** Opacity falls off quickly once the card passes the camera plane,
   *  and ramps up smoothly as the camera approaches it from afar. */
  const opacity = useTransform(relZ, (v) => {
    if (v > 0) {
      // Passing the camera — fade out fast so the scale-up doesn't
      // swallow the screen.
      return Math.max(0, 1 - v / 350);
    }
    // Approaching — fade in from the far plane.
    return Math.max(0, Math.min(1, 1 + v / (CARD_SPACING * 1.15)));
  });

  return (
    <motion.article
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        // Motion composes x/y/z into a single translate3d(...),
        // and the `%` units on x/y refer to the element's own size
        // (standard CSS translate behavior) so the card is centered.
        x: '-50%',
        y: '-50%',
        z: relZ,
        opacity,
      }}
      className={[
        'w-full max-w-xl',
        'rounded-sm border border-purple-400/40 bg-zinc-950/75 p-6 shadow-2xl',
        'backdrop-blur-sm',
      ].join(' ')}
    >
      {/* Slide counter */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-pixel text-xs text-purple-400">
          &gt;_ {String(jobIdx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span className="font-pixel text-xs text-zinc-500">{job.period}</span>
      </div>

      {/* Company */}
      <h3 className="font-pixel text-xs text-yellow-400">{job.company}</h3>

      {/* Title */}
      <h2 className="mt-2 font-pixel text-sm leading-relaxed text-zinc-100">{job.title}</h2>

      {/* Divider */}
      <div className="my-4 h-px w-full bg-zinc-700" />

      {/* Highlights */}
      <ul className="flex list-none flex-col gap-2 p-0">
        {job.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-300">
            <span className="mt-0.5 shrink-0 text-purple-400" aria-hidden="true">
              ▸
            </span>
            {h}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SideTimeline
// ─────────────────────────────────────────────────────────────────────────

interface SideTimelineProps {
  activeIdx: number;
  onJump: (target: number, dir: Direction) => void;
  reducedMotion: boolean;
}

/** Vertical, clickable progress timeline pinned to the right edge. Each
 *  marker is a dot + short title; the active one pulses and shows its
 *  full title. Clicking fires the same locked transition as a scroll. */
function SideTimeline({ activeIdx, onJump, reducedMotion }: SideTimelineProps) {
  return (
    <nav
      aria-label="Job slide navigator"
      className={[
        'absolute right-3 top-1/2 -translate-y-1/2',
        // Hide the side progress on mobile so cards can use the full width.
        'hidden md:flex',
        'flex-col gap-3',
        'rounded-sm border border-zinc-700 bg-zinc-900/70 px-2 py-3 backdrop-blur-sm',
      ].join(' ')}
    >
      <ol className="flex list-none flex-col gap-2 p-0">
        {JOBS.map((j, i) => {
          const active = i === activeIdx;
          return (
            <li key={`${j.company}-${j.period}`}>
              <button
                type="button"
                onClick={() => onJump(i, i > activeIdx ? 1 : -1)}
                aria-current={active ? 'step' : undefined}
                aria-label={`Go to slide ${i + 1}: ${j.title} at ${j.company}`}
                className={[
                  'group flex w-full items-center gap-2 rounded-sm px-1 py-0.5',
                  'font-pixel text-xs',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  style={active ? { boxShadow: '0 0 8px rgba(192,132,252,0.8)' } : undefined}
                  className={[
                    'inline-block h-2 w-2 shrink-0 rounded-full transition-colors',
                    active ? 'bg-purple-400' : 'bg-zinc-600 group-hover:bg-zinc-400',
                    active && !reducedMotion ? 'animate-pulse' : '',
                  ].join(' ')}
                />
                <span
                  className={[
                    'truncate transition-all',
                    active ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300',
                    active ? 'max-w-40' : 'max-w-0 overflow-hidden group-hover:max-w-40',
                  ].join(' ')}
                >
                  {shortLabel(j.title)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Shorten long titles so the side nav stays narrow. */
function shortLabel(title: string) {
  return title
    .replace('Senior ', 'Sr ')
    .replace(' — AI Innovation', '')
    .replace('Software Engineer & Web Developer', 'Software Engineer');
}
