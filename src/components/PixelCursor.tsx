/**
 * PixelCursor — grid-highlight effect tied to cursor position.
 *
 * The viewport is conceptually divided into a fixed grid of square cells
 * (CELL px on each side, matching the 16px static cursor sprite). Cells
 * start fully transparent. As the cursor enters a cell that cell flashes
 * to ALPHA_MAX opacity, then fades linearly back to 0 over FADE_MS.
 * Cells the cursor never visits stay invisible.
 *
 * Pairs with the static pixel-arrow.png OS cursor in globals.css. The
 * sprite is the cursor itself; this island only paints cell highlights
 * along the trail.
 *
 * Gates (any TRUE = render nothing):
 *   - prefers-reduced-motion: reduce
 *   - (pointer: coarse) touch device
 *   - $gpuTier === 1 (WebGL unsupported / very low-tier)
 *
 * Implementation notes:
 *   - Bresenham fill between previous and current cursor positions so
 *     fast pointer motion still stamps every traversed cell — without
 *     this the trail tears with skipped cells.
 *   - active = Map<cellKey, timestamp>; entries removed when fully
 *     faded so the loop stays O(active count), not O(viewport area).
 *   - rAF loop pauses on visibilitychange so a backgrounded tab does
 *     not keep clearing/painting.
 *   - Resize clears the map (cell coords would mismatch the new grid).
 *
 * Z-index: 50. Mounted AFTER OSScreen so it paints on top of the OS
 * shell but stays below NavTransition (z 70) and PageIntro (z 60).
 */

import { $gpuTier } from '@/stores';
import { useStore } from '@nanostores/react';
import { useEffect, useRef } from 'react';

const CELL = 16;             // grid cell px — matches cursor sprite size
const FADE_MS = 400;         // ms from peak alpha → 0
const ALPHA_MAX = 0.3;       // requirement: 30% opacity peak
const COLOR = '#a78bfa';     // tailwind violet-400 — D-28 CRT accent

export default function PixelCursor() {
  const tier = useStore($gpuTier);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (tier === 1) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reduceMotion || coarsePointer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let cols = Math.ceil(width / CELL);

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      cols = Math.ceil(width / CELL);
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.imageSmoothingEnabled = false;
      // Cell keys depend on cols — drop stale stamps after a resize.
      active.clear();
    }

    /** active cells: key = cy * cols + cx, value = activation timestamp ms. */
    const active = new Map<number, number>();
    let lastCx = -1;
    let lastCy = -1;

    function stamp(cx: number, cy: number, t: number) {
      if (cx < 0 || cy < 0) return;
      active.set(cy * cols + cx, t);
    }

    /**
     * Bresenham line between previous and current cell — guarantees every
     * cell the cursor crossed gets stamped, even on flick-fast motion.
     */
    function stampLine(x0: number, y0: number, x1: number, y1: number, t: number) {
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      let cx = x0;
      let cy = y0;
      // Cap iterations to avoid pathological loops on huge teleports
      // (e.g. window restored after sleep). 4096 cells = ~65k px @ CELL=16.
      let guard = 4096;
      while (guard-- > 0) {
        stamp(cx, cy, t);
        if (cx === x1 && cy === y1) return;
        const e2 = err * 2;
        if (e2 > -dy) {
          err -= dy;
          cx += sx;
        }
        if (e2 < dx) {
          err += dx;
          cy += sy;
        }
      }
    }

    function onMove(e: PointerEvent) {
      const t = performance.now();
      const cx = Math.floor(e.clientX / CELL);
      const cy = Math.floor(e.clientY / CELL);
      if (lastCx < 0) {
        stamp(cx, cy, t);
      } else if (cx !== lastCx || cy !== lastCy) {
        stampLine(lastCx, lastCy, cx, cy, t);
      }
      lastCx = cx;
      lastCy = cy;
    }

    function onLeave() {
      lastCx = -1;
      lastCy = -1;
    }

    let raf = 0;
    let running = true;

    function tick() {
      if (!running) return;
      const now = performance.now();
      ctx!.clearRect(0, 0, width, height);
      ctx!.fillStyle = COLOR;
      for (const [key, stampedAt] of active) {
        const elapsed = now - stampedAt;
        if (elapsed >= FADE_MS) {
          active.delete(key);
          continue;
        }
        const alpha = ALPHA_MAX * (1 - elapsed / FADE_MS);
        const cy = Math.floor(key / cols);
        const cx = key - cy * cols;
        ctx!.globalAlpha = alpha;
        ctx!.fillRect(cx * CELL, cy * CELL, CELL, CELL);
      }
      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    }

    resize();
    raf = requestAnimationFrame(tick);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [tier]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
