/**
 * Phase 6 — ScrollNarrative.tsx
 *
 * Pure scroll-orchestration island mounted via client:only="react" in index.astro.
 * Owns:
 *  - Hero text fade-out (0%→25% scroll) so camera fly-in takes visual dominance
 *  - Tagline fade-in/out scrub timeline (mid-scroll)
 *  - Blackout overlay fade-in (70%→100%) — "entering the monitor" illusion
 *  - Hard-cut $activeSection update on pin exit
 * No DOM output — returns null.
 *
 * Rules:
 *  - useGSAP() only — no raw useEffect for GSAP (AGENTS.md hard rule, Pitfall §2)
 *  - Waits for $sceneReady before creating ScrollTrigger (model must load first)
 *  - Reduced-motion guard: skip all ScrollTrigger when prefers-reduced-motion: reduce
 *  - No Drei <ScrollControls> — GSAP ScrollTrigger is the sole scroll authority
 */

import { $activeSection, $sceneReady } from '@/stores';
import { useGSAP } from '@gsap/react';
import { useStore } from '@nanostores/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ScrollNarrative() {
  const sceneReady = useStore($sceneReady);

  useGSAP(
    () => {
      if (!sceneReady) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const scrubConfig = {
        trigger: '#scene-scroll-pin',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      };

      // ------------------------------------------------------------------
      // Hero text + scroll cue fade out early (0%→25%).
      // Camera fly-in takes visual dominance after the text disappears.
      // ------------------------------------------------------------------
      const heroTl = gsap.timeline({ scrollTrigger: scrubConfig });
      heroTl.to('#hero-text-content', { opacity: 0, ease: 'power1.in', duration: 0.25 }, 0);
      heroTl.to('#scroll-cue', { opacity: 0, duration: 0.1 }, 0);

      // ------------------------------------------------------------------
      // Tagline scrub timeline — fade in/out during mid-scroll fly-in.
      // ------------------------------------------------------------------
      const taglineTl = gsap.timeline({ scrollTrigger: scrubConfig });

      // Tagline 1: fade in 25%→45%, fade out 70%→82%
      taglineTl
        .fromTo(
          '#fly-tagline-1',
          { opacity: 0 },
          { opacity: 1, ease: 'power1.in', duration: 0.2 },
          0.25,
        )
        .to('#fly-tagline-1', { opacity: 0, ease: 'power1.out', duration: 0.12 }, 0.7);

      // Tagline 2: fade in 35%→55%, fade out 75%→87%
      taglineTl
        .fromTo(
          '#fly-tagline-2',
          { opacity: 0 },
          { opacity: 1, ease: 'power1.in', duration: 0.2 },
          0.35,
        )
        .to('#fly-tagline-2', { opacity: 0, ease: 'power1.out', duration: 0.12 }, 0.75);

      // ------------------------------------------------------------------
      // Blackout overlay — fades in as camera approaches monitor face (70%→100%).
      // Produces the "entering the monitor screen" → black illusion.
      // ------------------------------------------------------------------
      const blackoutTl = gsap.timeline({ scrollTrigger: scrubConfig });
      blackoutTl.fromTo(
        '#fly-blackout',
        { opacity: 0 },
        { opacity: 1, ease: 'power2.in', duration: 0.3 },
        0.7,
      );

      // ------------------------------------------------------------------
      // Hard-cut trigger — when scroll pin exits forward, set activeSection.
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
        heroTl.scrollTrigger?.kill();
        taglineTl.scrollTrigger?.kill();
        blackoutTl.scrollTrigger?.kill();
      };
    },
    { dependencies: [sceneReady] },
  );

  return null;
}
