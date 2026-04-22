/**
 * Phase 6 / 12 — ScrollNarrative.tsx
 *
 * Pure scroll-orchestration island mounted via client:only="react" in index.astro.
 * Owns hero/scroll-cue fade, tagline scrub, blackout, and the $activeSection
 * flip at the end of #post-flyin-pin. Returns null.
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

      // DOM tweens (tagline/blackout/heroFade) can't share the camera's
      // useFrame lerp, so we use GSAP's numeric scrub for inertia. 0.4 keeps
      // them visually close to the camera glide without feeling laggy.
      // Short-window tweens (scroll-cue fade) stay on scrub:true.
      const SCRUB = 0.4;

      const scrubConfig = {
        trigger: '#scene-scroll-pin',
        start: 'top top',
        end: 'bottom top',
        scrub: SCRUB,
      };

      const heroFadeTween = gsap.to('#hero-text-content', {
        opacity: 0,
        ease: 'power1.in',
        scrollTrigger: {
          trigger: '#scene-scroll-pin',
          start: 'top top',
          end: '50% top',
          scrub: SCRUB,
        },
      });
      // biome-ignore lint/suspicious/noExplicitAny: diagnostic global only
      (window as any).__heroFadeST = heroFadeTween.scrollTrigger;

      gsap.to('#scroll-cue', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '#scene-scroll-pin',
          start: 'top top',
          end: '10% top',
          scrub: true,
        },
      });

      const taglineTl = gsap.timeline({ scrollTrigger: scrubConfig });
      taglineTl
        .fromTo(
          '#fly-tagline-1',
          { opacity: 0 },
          { opacity: 1, ease: 'power1.in', duration: 0.2 },
          0.25,
        )
        .to('#fly-tagline-1', { opacity: 0, ease: 'power1.out', duration: 0.12 }, 0.7);
      taglineTl
        .fromTo(
          '#fly-tagline-2',
          { opacity: 0 },
          { opacity: 1, ease: 'power1.in', duration: 0.2 },
          0.35,
        )
        .to('#fly-tagline-2', { opacity: 0, ease: 'power1.out', duration: 0.12 }, 0.75);

      const blackoutTl = gsap.timeline({ scrollTrigger: scrubConfig });
      blackoutTl.fromTo(
        '#fly-blackout',
        { opacity: 0 },
        { opacity: 1, ease: 'power2.in', duration: 0.3 },
        0.7,
      );

      // Phase 12 — $activeSection flip across #post-flyin-pin.
      //
      // Dual-signal strategy:
      //   1) onUpdate samples progress every tick, hysteresis prevents flicker
      //   2) onLeave / onEnterBack are edge signals at the pin's end
      // Either path can fire; whichever resolves first wins. Guards stop
      // redundant sets by checking current store value.
      const applyState = (progress: number) => {
        const current = $activeSection.get();
        if (progress >= 0.995) {
          if (current !== 'os') $activeSection.set('os');
        } else if (progress < 0.5) {
          if (current !== 'hero') $activeSection.set('hero');
        }
      };

      const st = ScrollTrigger.create({
        trigger: '#post-flyin-pin',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => applyState(self.progress),
        onLeave: () => {
          if ($activeSection.get() !== 'os') $activeSection.set('os');
        },
        onEnterBack: () => {
          // Scrolling up from past end — remain in 'os' until user crosses
          // below the 0.5 hysteresis threshold; onUpdate handles that.
        },
      });

      // Initial state sync. GSAP does NOT fire onEnter/onLeave for scroll
      // positions that existed before a trigger was created ("just made,
      // hasn't entered anything yet"). If the page loaded with scroll
      // already past the pin's end — browser scroll restore, deep-link,
      // reload mid-scroll — we'd otherwise be stuck in 'hero' with the text
      // fully revealed and no OSScreen. Reading progress once after creation
      // closes that gap.
      applyState(st.progress);
    },
    { dependencies: [sceneReady] },
  );

  return null;
}
