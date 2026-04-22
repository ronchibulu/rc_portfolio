/**
 * Phase 12 — PixelReveal.tsx
 *
 * Chunky 8-bit dissolve transition used as the OSScreen's intro animation.
 * A full-viewport <canvas> starts opaque (pure black) and is progressively
 * "punched through" one pixel block at a time until the OS desktop beneath
 * is fully revealed.
 *
 * Why a canvas and not a CSS grid of divs:
 *  - For ~2000 blocks (24px @ 1920×1080) we'd need 2k DOM nodes → layout thrash.
 *  - Canvas gives us a single paint-target; the whole reveal is cheap fills.
 *  - `image-rendering: pixelated` isn't needed because we're drawing rects,
 *    not resampling a bitmap.
 *
 * Why this component, not a library:
 *  - Googled the usual suspects (GSAP Pixel plugin — doesn't exist; Shiffman's
 *    p5 dissolve — too heavy; PixiJS PixelateFilter — 200kB dependency). For a
 *    portfolio with a hard budget on bundle size, ~60 lines of vanilla is the
 *    right call.
 *
 * Contract:
 *  - Fires once when rendered; calls `onDone` when the reveal finishes.
 *  - Respects prefers-reduced-motion (instant completion, zero blocks drawn).
 *  - Handles viewport resize during playback by rebuilding the grid.
 *  - Uses requestAnimationFrame, not gsap.ticker — no GSAP dependency here
 *    so the component stays self-contained.
 */

import { useLayoutEffect, useRef } from 'react';

// Block size tuned for a noticeable "pixel" feel without being distractingly
// chunky on 4K screens. Keep aligned with an even number so DPR scaling stays
// clean — 20px * 2x DPR = 40 device px (integer).
const BLOCK_PX = 20;
const DURATION_MS = 1100;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PixelReveal({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // useLayoutEffect — run BEFORE browser paint so the canvas is filled black on
  // its very first frame. Prevents a one-frame flash of transparent canvas
  // (revealing whatever sits below) when PageIntro swaps from loading → reveal.
  useLayoutEffect(() => {
    // Reduced-motion: skip the animation entirely. Fire onDone on the next
    // tick so downstream state transitions (unmount) happen as if it ran.
    if (prefersReducedMotion()) {
      const t = setTimeout(() => onDoneRef.current(), 0);
      return () => clearTimeout(t);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onDoneRef.current();
      return;
    }

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    let w = window.innerWidth;
    let h = window.innerHeight;
    let cols = 0;
    let rows = 0;
    let totalBlocks = 0;
    let revealOrder: Uint32Array = new Uint32Array(0);
    let blocksDrawn = 0;

    // Fisher-Yates shuffle against a typed array — O(n) and allocation-free
    // after the initial fill. Using Math.random is fine for visual noise.
    function buildRevealOrder(n: number): Uint32Array {
      const arr = new Uint32Array(n);
      for (let i = 0; i < n; i++) arr[i] = i;
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      if (!canvas || !ctx) return;
      canvas.width = Math.ceil(w * dpr);
      canvas.height = Math.ceil(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(w / BLOCK_PX);
      rows = Math.ceil(h / BLOCK_PX);
      totalBlocks = cols * rows;
      revealOrder = buildRevealOrder(totalBlocks);

      // Paint full black canvas — this is what we erase from.
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      blocksDrawn = 0;
    }

    resize();
    window.addEventListener('resize', resize);

    let start = 0;
    let cancelled = false;
    let rafId = 0;

    const tick = (ts: number) => {
      if (cancelled) return;
      if (!start) start = ts;
      const elapsed = ts - start;
      // ease-out cubic — reveals quickly, then trails off for a pleasing finish.
      const linear = Math.min(1, elapsed / DURATION_MS);
      const eased = 1 - Math.pow(1 - linear, 3);

      const target = Math.floor(eased * totalBlocks);
      if (target > blocksDrawn && ctx) {
        // destination-out composites erase prior paint — turns each filled
        // block into transparency, revealing the OSScreen painted below.
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000000';
        for (let i = blocksDrawn; i < target; i++) {
          const idx = revealOrder[i];
          const col = idx % cols;
          const row = (idx - col) / cols;
          ctx.fillRect(col * BLOCK_PX, row * BLOCK_PX, BLOCK_PX, BLOCK_PX);
        }
        ctx.restore();
        blocksDrawn = target;
      }

      if (linear < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Final pass — make sure every block is cleared regardless of rounding.
        if (ctx) {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
        onDoneRef.current();
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // z-index 40 puts the reveal above OSScreen's own z-10 chrome (title bar,
  // desktop, footer) but below any portal-mounted Shadcn dialog content
  // (z-50+). Safe because no dialogs can open before the reveal completes.
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 40 }}
    />
  );
}
