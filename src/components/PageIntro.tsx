/**
 * PageIntro.tsx
 *
 * Full-viewport boot sequence that runs once per page load:
 *
 *   1. `loading` — solid black overlay with a centered "LOADING x%" counter
 *      driven by Drei's useProgress. The hero, header, canvas and scroll are
 *      all visually hidden (overlay + scroll lock) until the 3D scene
 *      finishes loading.
 *   2. `revealing` — PixelReveal dissolves the black overlay one chunky block
 *      at a time, revealing the hero + 3D scene behind it.
 *   3. `done` — overlay unmounts, body scroll is released, ScrollTrigger is
 *      refreshed so its measurements reflect the now-unlocked layout.
 *
 * Why this component (vs a static <Html> fallback in the Canvas):
 *  - Drei's <Html> progress fallback lives inside the canvas; the rest of the
 *    page (hero text, header, blackout overlay) would still be visible during
 *    load. The user wants a clean black boot screen.
 *  - Gating scroll at the page level also ensures the camera fly-in never
 *    plays against a half-loaded scene — the user sees the scene for the
 *    first time at t=0 of the pixel reveal, not mid-load.
 *
 * Guards:
 *  - Low-tier GPU (mobile fallback) — SceneCanvas returns null and $sceneReady
 *    never flips. Short-circuit to `done` so mobile isn't stuck on LOADING.
 *  - prefers-reduced-motion: PixelReveal already completes instantly via its
 *    own guard, so we still go through the same state machine without a long
 *    reveal animation.
 *  - Browser scroll restoration: disabled on mount so a mid-scroll refresh
 *    doesn't leave the user past the hero when scroll unlocks.
 */

import PixelReveal from '@/components/PixelReveal';
import { $gpuTier, $sceneReady } from '@/stores';
import { useStore } from '@nanostores/react';
import { useProgress } from '@react-three/drei/core/Progress.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useLayoutEffect, useState } from 'react';

type Phase = 'loading' | 'revealing' | 'done';

export default function PageIntro() {
  const gpuTier = useStore($gpuTier);
  const sceneReady = useStore($sceneReady);
  const { progress } = useProgress();
  const [phase, setPhase] = useState<Phase>('loading');

  // Retire the SSR boot cover (#page-intro-boot) as soon as this React overlay
  // is committed. useLayoutEffect runs after DOM commit but BEFORE browser
  // paint, so the React overlay (also zIndex 60, also black during `loading`)
  // is already in the DOM before the SSR cover is removed — no flash, no gap.
  // The SSR cover must be gone before PixelReveal animates, otherwise its
  // erosion would reveal the still-opaque SSR div instead of the page.
  useLayoutEffect(() => {
    const boot = document.getElementById('page-intro-boot');
    boot?.remove();
  }, []);

  // Disable browser scroll restoration for this page lifecycle so a refresh
  // mid-scroll doesn't land the user past the hero when we unlock scroll.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prev = window.history.scrollRestoration;
    try {
      window.history.scrollRestoration = 'manual';
    } catch {
      /* some browsers block — ignore */
    }
    window.scrollTo(0, 0);
    return () => {
      try {
        window.history.scrollRestoration = prev;
      } catch {
        /* ignore */
      }
    };
  }, []);

  // Low-tier GPU short-circuit — SceneCanvas never mounts on tier 1, so
  // $sceneReady would never flip. Skip straight to done once detection resolves.
  useEffect(() => {
    if (gpuTier === 1 && phase !== 'done') {
      setPhase('done');
    }
  }, [gpuTier, phase]);

  // Kick off the reveal the moment the 3D scene is ready.
  useEffect(() => {
    if (sceneReady && phase === 'loading') {
      setPhase('revealing');
    }
  }, [sceneReady, phase]);

  // Scroll lock while the intro is on-screen. Lock at both <html> and <body>
  // because some browsers ignore one or the other depending on which element
  // owns the scroll viewport.
  useEffect(() => {
    if (phase === 'done') return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [phase]);

  // After the intro closes, refresh ScrollTrigger so its pin measurements
  // reflect the now-scrollable document. Without refresh, any trigger created
  // while overflow was hidden may have cached zero-height ranges.
  useEffect(() => {
    if (phase !== 'done') return;
    // Next tick — let the scroll-lock cleanup flush first.
    const t = setTimeout(() => {
      try {
        ScrollTrigger.refresh();
      } catch {
        /* ScrollTrigger not registered yet — harmless on tier-1 path */
      }
    }, 0);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'done') return null;

  // zIndex 60 — above OSScreen (z-50) and Header (z-40) so the boot screen
  // genuinely covers every layer until the reveal completes. Inline style
  // because Tailwind's default scale caps at z-50 and project rule forbids
  // arbitrary values (z-[60]).
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 60 }}
    >
      {phase === 'loading' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <p className="font-pixel text-xs whitespace-nowrap text-purple-400 sm:text-sm">
            LOADING... {Math.round(progress)}%
          </p>
        </div>
      ) : (
        <PixelReveal onDone={() => setPhase('done')} />
      )}
    </div>
  );
}
