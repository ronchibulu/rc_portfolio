/**
 * PixelCover.tsx
 *
 * Inverse of PixelReveal: starts on a transparent full-viewport canvas and
 * progressively fills it with chunky 8-bit black blocks in randomised order
 * until the underlying page is fully obscured. Fires `onDone` when every
 * block has been painted.
 *
 * Used by NavTransition to "cover" the viewport before jumping scroll to a
 * new anchor and then handing off to PixelReveal for the "uncover" phase.
 *
 * Kept deliberately symmetric with PixelReveal — same block size, duration,
 * ease curve, resize handling — so the two animations feel like one piece
 * played forward and backward.
 */

import { useLayoutEffect, useRef } from 'react';

// Keep aligned with PixelReveal so cover/reveal feel symmetric.
const BLOCK_PX = 20;
const DURATION_MS = 1100;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PixelCover({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useLayoutEffect(() => {
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

    function buildOrder(n: number): Uint32Array {
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
      // Start from transparent so the page shows through until blocks land.
      ctx.clearRect(0, 0, w, h);
      cols = Math.ceil(w / BLOCK_PX);
      rows = Math.ceil(h / BLOCK_PX);
      totalBlocks = cols * rows;
      revealOrder = buildOrder(totalBlocks);
      blocksDrawn = 0;
    }

    resize();
    window.addEventListener('resize', resize);

    // Reduced-motion: paint a full black rectangle immediately, fire onDone
    // on the next tick so downstream state transitions still run.
    if (prefersReducedMotion()) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      const t = setTimeout(() => onDoneRef.current(), 0);
      return () => {
        clearTimeout(t);
        window.removeEventListener('resize', resize);
      };
    }

    let start = 0;
    let cancelled = false;
    let rafId = 0;

    const tick = (ts: number) => {
      if (cancelled) return;
      if (!start) start = ts;
      const elapsed = ts - start;
      const linear = Math.min(1, elapsed / DURATION_MS);
      const eased = 1 - Math.pow(1 - linear, 3);

      const target = Math.floor(eased * totalBlocks);
      if (target > blocksDrawn && ctx) {
        ctx.fillStyle = '#000000';
        for (let i = blocksDrawn; i < target; i++) {
          const idx = revealOrder[i];
          const col = idx % cols;
          const row = (idx - col) / cols;
          ctx.fillRect(col * BLOCK_PX, row * BLOCK_PX, BLOCK_PX, BLOCK_PX);
        }
        blocksDrawn = target;
      }

      if (linear < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Final pass — guarantee every pixel is black regardless of rounding.
        if (ctx) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, w, h);
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

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 40 }}
    />
  );
}
