/**
 * Phase 6 — ScrollNarrative.tsx
 *
 * Pure scroll-orchestration island mounted via client:only="react" in index.astro.
 * Owns the tagline fade-in/out timeline and the hard-cut $activeSection update.
 * No DOM output — returns null.
 *
 * Rules:
 *  - useGSAP() only — no raw useEffect for GSAP (AGENTS.md hard rule, Pitfall §2)
 *  - Waits for $sceneReady before creating ScrollTrigger (model must be loaded first)
 *  - Reduced-motion guard: skip all ScrollTrigger when prefers-reduced-motion: reduce
 *  - No Drei <ScrollControls> — GSAP ScrollTrigger is the sole scroll authority (Pitfall §1)
 */

import { $activeSection, $sceneReady } from '@/stores';
import { useGSAP } from '@gsap/react';
import { useStore } from '@nanostores/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins — safe to call multiple times; GSAP deduplicates.
gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ScrollNarrative() {
  const sceneReady = useStore($sceneReady);

  useGSAP(
    () => {
      // Gate on model load — ScrollTrigger pin math needs the DOM to be stable.
      if (!sceneReady) return;

      // Reduced-motion: skip all scroll animation (AGENTS.md, SCROLL-008).
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // ------------------------------------------------------------------
      // Tagline scrub timeline — tied to the same #scene-scroll-pin trigger
      // as the camera tween in GameSetupScene.tsx.
      // ------------------------------------------------------------------
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#scene-scroll-pin',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Tagline 1: fade in at 20% → peak at 40%, fade out at 70% → 85%
      tl.fromTo(
        '#fly-tagline-1',
        { opacity: 0 },
        { opacity: 1, ease: 'power1.in', duration: 0.2 },
        0.2,
      ).to('#fly-tagline-1', { opacity: 0, ease: 'power1.out', duration: 0.15 }, 0.7);

      // Tagline 2: fade in at 30% → peak at 50%, fade out at 75% → 90%
      tl.fromTo(
        '#fly-tagline-2',
        { opacity: 0 },
        { opacity: 1, ease: 'power1.in', duration: 0.2 },
        0.3,
      ).to('#fly-tagline-2', { opacity: 0, ease: 'power1.out', duration: 0.15 }, 0.75);

      // ------------------------------------------------------------------
      // Hard-cut transition trigger — fires when scroll pin section exits.
      // Sets $activeSection to 'os' so OS screen content knows it's active.
      // ------------------------------------------------------------------
      ScrollTrigger.create({
        trigger: '#scene-scroll-pin',
        start: 'bottom top',
        onEnter: () => {
          $activeSection.set('os');
        },
        onLeaveBack: () => {
          $activeSection.set('hero');
        },
      });

      return () => {
        tl.scrollTrigger?.kill();
      };
    },
    { dependencies: [sceneReady] },
  );

  return null;
}
