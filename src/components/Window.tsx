/**
 * Window.tsx
 *
 * Reusable retro OS window chrome used by ProjectsOverlay, ProjectDialog,
 * and AboutDialog. Provides:
 *  - Title bar with the three retro traffic-light controls:
 *      red = close, yellow = minimize, green = maximize/restore
 *  - Pointer-based drag via the title bar (disabled when maximized)
 *  - Spring animation on minimize (scale + fade toward the bottom dock bar)
 *    and on maximize/restore (width/height + position)
 *  - Respects prefers-reduced-motion — transitions skip their tween
 *
 * The window content is supplied via `children`. `minimized` / `maximized`
 * state is owned by the parent (OSScreen) so the bottom-bar dock can read
 * and toggle it.
 */

import { motion, useReducedMotion } from 'motion/react';
import type React from 'react';
import { useState } from 'react';

export interface WindowProps {
  title: string;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  minimized: boolean;
  maximized: boolean;
  children: React.ReactNode;
  /** Size token — controls max-width when not maximized. */
  size?: 'md' | 'lg';
  /** aria-label override; falls back to `title`. */
  ariaLabel?: string;
  /** Stacking context for layered windows (e.g. detail over folder). */
  z?: 30 | 40 | 50 | 60;
  /** Optional element rendered on the right edge of the title bar
   *  (e.g. mode toggle, status chip). Pointer events inside this slot
   *  are isolated so clicks don't start a title-bar drag. */
  headerRight?: React.ReactNode;
  /** When true, the maximize/restore affordance is locked: the green
   *  traffic light renders as a dimmed, non-interactive chip and the
   *  title-bar double-click-to-toggle is suppressed. Useful when the
   *  content inside the window needs a guaranteed canvas size (e.g. the
   *  3D animated About view). */
  disableToggleMaximize?: boolean;
}

export default function Window({
  title,
  onClose,
  onMinimize,
  onToggleMaximize,
  minimized,
  maximized,
  children,
  size = 'lg',
  ariaLabel,
  z = 30,
  headerRight,
  disableToggleMaximize = false,
}: WindowProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // Pointer-based drag on the title bar. We attach window-level listeners on
  // pointerdown so the drag keeps tracking even if the pointer leaves the
  // title bar (fast drags, above the viewport, etc).
  const onTitlePointerDown = (e: React.PointerEvent) => {
    if (maximized) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const startX = pos.x;
    const startY = pos.y;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    setDragging(true);

    const onMove = (ev: PointerEvent) => {
      setPos({
        x: startX + (ev.clientX - startClientX),
        y: startY + (ev.clientY - startClientY),
      });
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const sizeClass = size === 'md' ? 'sm:max-w-2xl' : 'sm:max-w-3xl';
  const zClass =
    z === 60 ? 'z-[60]' : z === 50 ? 'z-50' : z === 40 ? 'z-40' : 'z-30';

  return (
    // Outer centering layer — flex centers the motion child regardless of
    // maximize/size state, leaving Motion free to own the transform channel
    // for drag + minimize (no competition with Tailwind's -translate-x-1/2).
    <div
      aria-hidden={minimized}
      className={`pointer-events-none fixed inset-0 flex items-center justify-center p-4 ${zClass}`}
    >
      <motion.div
        role="dialog"
        aria-label={ariaLabel ?? title}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{
          opacity: minimized ? 0 : 1,
          scale: minimized ? 0.18 : 1,
          x: maximized ? 0 : pos.x,
          y: maximized ? 0 : pos.y,
        }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : dragging
              ? { duration: 0 }
              : { type: 'spring', stiffness: 360, damping: 32, mass: 0.7 }
        }
        style={{
          pointerEvents: minimized ? 'none' : 'auto',
          // Shrink toward the bottom-center so the minimize tween reads as
          // "dropping into the dock" below.
          transformOrigin: '50% 100%',
        }}
        className={[
          'relative flex flex-col overflow-hidden',
          'rounded-sm border border-zinc-700 bg-zinc-900 shadow-2xl',
          'w-full',
          maximized ? 'h-full max-w-none' : `max-h-[85dvh] ${sizeClass}`,
        ].join(' ')}
      >
        {/* ── Title bar (drag handle) ── */}
        <div
          onPointerDown={onTitlePointerDown}
          onDoubleClick={disableToggleMaximize ? undefined : onToggleMaximize}
          role="presentation"
          className={[
            'flex shrink-0 select-none items-center justify-between',
            'border-b border-zinc-700 bg-zinc-800 px-4 py-2',
            maximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
          ].join(' ')}
        >
          <div className="flex items-center gap-3">
            <div className="group/lights flex gap-1.5">
              <TrafficLight variant="close" label={`Close ${title}`} onClick={onClose} />
              <TrafficLight
                variant="minimize"
                label={`Minimize ${title}`}
                onClick={onMinimize}
              />
              <TrafficLight
                variant="maximize"
                label={
                  disableToggleMaximize
                    ? `${title} is locked fullscreen`
                    : `${maximized ? 'Restore' : 'Maximize'} ${title}`
                }
                onClick={onToggleMaximize}
                isMaximized={maximized}
                disabled={disableToggleMaximize}
              />
            </div>
            <span className="font-pixel text-xs text-zinc-100">{title}</span>
          </div>
          {headerRight ? (
            <div
              className="flex items-center"
              // Prevent drag/double-click-maximize when interacting with
              // controls that live in this slot (e.g. mode toggle buttons).
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              {headerRight}
            </div>
          ) : null}
        </div>

        {/* ── Content ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </motion.div>
    </div>
  );
}

interface TrafficLightProps {
  variant: 'close' | 'minimize' | 'maximize';
  label: string;
  onClick: () => void;
  isMaximized?: boolean;
  /** When true, the light renders as a dim, non-interactive chip and its
   *  onClick becomes a no-op. Used by the maximize light when the parent
   *  has locked its current size (see Window's `disableToggleMaximize`). */
  disabled?: boolean;
}

/**
 * Retro traffic-light button. The symbol inside the circle is hidden by
 * default and revealed when the user hovers over the lights cluster — the
 * classic macOS affordance.
 */
function TrafficLight({
  variant,
  label,
  onClick,
  isMaximized,
  disabled = false,
}: TrafficLightProps) {
  const color =
    variant === 'close'
      ? 'bg-red-500'
      : variant === 'minimize'
        ? 'bg-yellow-400'
        : 'bg-green-500';
  const glyph =
    variant === 'close' ? '×' : variant === 'minimize' ? '–' : isMaximized ? '▾' : '+';
  const glyphColor =
    variant === 'close'
      ? 'text-red-950'
      : variant === 'minimize'
        ? 'text-yellow-950'
        : 'text-green-950';

  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) return;
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className={[
        'inline-flex h-3 w-3 items-center justify-center rounded-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400',
        color,
        disabled
          ? 'cursor-not-allowed opacity-30 grayscale'
          : 'opacity-80 transition-opacity hover:opacity-100',
      ].join(' ')}
    >
      <span
        className={[
          'font-pixel leading-none opacity-0 transition-opacity',
          disabled ? '' : 'group-hover/lights:opacity-100',
          glyphColor,
        ].join(' ')}
        style={{ fontSize: '8px' }}
        aria-hidden="true"
      >
        {glyph}
      </span>
    </button>
  );
}
