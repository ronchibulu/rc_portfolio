/**
 * NavTransition.tsx
 *
 * Header anchor navigation wrapped in a pixel-cover → scroll → pixel-reveal
 * transition. Intercepts clicks on any `<a href="#...">` (plus the brand "/")
 * inside the site header, runs a chunky 8-bit cover animation, jumps the
 * scroll position to the target anchor (so all scroll-driven state — camera
 * fly-in, blackout, CenterTextReveal typing, $activeSection — snaps to its
 * final values behind the cover), then plays the reverse pixel reveal.
 *
 * Design notes:
 *  - Click delegation at the document level keeps Header.astro 100% static.
 *  - `$navTransitioning` store tells OSScreen to suppress its own PixelReveal
 *    intro so the two reveals don't stack when navigating to #projects /
 *    #about / #contact (all three land inside OSScreen).
 *  - Scroll jump uses `behavior: 'auto'` — instant. Smooth scrolling during
 *    a cover would cause the underlying ScrollTrigger scrubs to update
 *    progressively, which could fire camera fly-in tweens under the cover
 *    for no benefit. Instant jump lets all ScrollTriggers resolve once.
 *  - `ScrollTrigger.refresh()` after the jump ensures pin measurements are
 *    reconciled if any layout changed (e.g. OSScreen now mounted).
 *  - zIndex 70 — above PageIntro's zIndex 60 and every other overlay.
 */

import PixelCover from '@/components/PixelCover';
import PixelReveal from '@/components/PixelReveal';
import { $activeSection, $navTransitioning, $osIntent, type OsIntent } from '@/stores';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

type Phase = 'idle' | 'covering' | 'revealing';

/** Map header hash anchors to the OS window that should auto-open. */
function intentForHref(href: string): OsIntent {
  if (href === '#projects') return 'projects';
  if (href === '#about') return 'about';
  if (href === '#contact') return 'contact';
  return null;
}

export default function NavTransition() {
  const [phase, setPhase] = useState<Phase>('idle');
  const targetRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Left-click only; allow ctrl/cmd/shift/alt to open in new tab/window
      // through the browser's native handling.
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (phaseRef.current !== 'idle') return;

      const anchor = (e.target as HTMLElement | null)?.closest?.(
        'header a',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Only handle in-page nav — hash anchors or the brand's "/". External
      // links fall through to default browser behaviour.
      const isHash = href.startsWith('#') && href !== '#';
      const isRoot = href === '/';
      if (!isHash && !isRoot) return;

      e.preventDefault();
      targetRef.current = href;
      $osIntent.set(intentForHref(href));
      $navTransitioning.set(true);
      setPhase('covering');
    };
    // Programmatic entry point — any component can dispatch
    //   window.dispatchEvent(new CustomEvent('rc:nav', { detail: { href: '/' } }))
    // to route through the same cover → scroll → reveal flow without needing
    // a header anchor. OSScreen's EXIT button uses this to return to hero.
    const onExternal = (e: Event) => {
      if (phaseRef.current !== 'idle') return;
      const detail = (e as CustomEvent<{ href?: string }>).detail;
      const href = detail?.href;
      if (!href) return;
      const isHash = href.startsWith('#') && href !== '#';
      const isRoot = href === '/';
      if (!isHash && !isRoot) return;
      targetRef.current = href;
      $osIntent.set(intentForHref(href));
      $navTransitioning.set(true);
      setPhase('covering');
    };

    document.addEventListener('click', onClick);
    window.addEventListener('rc:nav', onExternal);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('rc:nav', onExternal);
    };
  }, []);

  const handleCoverDone = () => {
    // Force-unlock any overflow locks set by overlays (OSScreen, PageIntro) so
    // programmatic scrollTo is guaranteed to land.
    const html = document.documentElement;
    html.style.overflow = '';
    document.body.style.overflow = '';

    // globals.css sets `html { scroll-behavior: smooth }`. That would make
    // window.scrollTo animate over several hundred ms — the cover→reveal
    // transition would finish before the scroll lands, stranding the user
    // near the old section. Inline-override scroll-behavior for this jump.
    const prevScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    const href = targetRef.current;
    let targetY = 0;
    if (href === '/') {
      targetY = 0;
      $activeSection.set('hero');
    } else if (href && href.startsWith('#')) {
      const el = document.querySelector(href) as HTMLElement | null;
      if (el) targetY = window.scrollY + el.getBoundingClientRect().top;
      // All in-page hash anchors in this portfolio (#projects, #about,
      // #contact) resolve inside OSScreen, so flip the store directly.
      $activeSection.set('os');
    }

    const jump = () => {
      // `instant` overrides both CSS scroll-behavior and the legacy default,
      // guaranteeing a synchronous position write with no tween.
      window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
    };
    jump();
    // Re-enforce one frame later so any ScrollTrigger / layout side-effect
    // that nudges scroll (e.g. a pin snapping to its recomputed range) can't
    // leave the user at the old section.
    requestAnimationFrame(() => {
      jump();
      html.style.scrollBehavior = prevScrollBehavior;
    });

    try {
      ScrollTrigger.refresh();
    } catch {
      /* not registered — no-op */
    }
    setPhase('revealing');
  };

  const handleRevealDone = () => {
    targetRef.current = null;
    $navTransitioning.set(false);
    setPhase('idle');
  };

  if (phase === 'idle') return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 70 }}
    >
      {phase === 'covering' ? (
        <PixelCover onDone={handleCoverDone} />
      ) : (
        <PixelReveal onDone={handleRevealDone} />
      )}
    </div>
  );
}
