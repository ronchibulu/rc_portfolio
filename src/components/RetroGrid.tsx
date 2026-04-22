/**
 * RetroGrid.tsx
 *
 * Tron-style perspective grid background, inspired by Magic UI's
 * Retro-Grid. Renders a mirrored pair of grid planes — one tilted back
 * as the floor, one tilted forward as the ceiling — so the view reads as
 * a receding tunnel rather than a single horizon line with empty sky.
 *
 * Both planes scroll along the grid axis to simulate forward motion. A
 * `boost` prop drops the animation duration sharply during a slide
 * transition, reading as a warp-speed jump. Top and bottom vignettes
 * soften the edges so the grid fades into the dark background rather
 * than cutting off at the container.
 *
 * Pure CSS + single self-contained <style> block — no external deps,
 * no canvas, no WebGL.
 */

interface RetroGridProps {
  /** Accelerate the grid scroll during slide transitions. */
  boost?: boolean;
  /** Respect prefers-reduced-motion — if true, stop the scroll so the
   *  grid is rendered statically. */
  reducedMotion?: boolean;
}

export default function RetroGrid({ boost = false, reducedMotion = false }: RetroGridProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      data-boost={boost ? 'true' : 'false'}
      data-reduced={reducedMotion ? 'true' : 'false'}
    >
      {/* 3D stage — children inherit the perspective so each plane
          tilts into the horizon instead of lying flat on the screen. */}
      <div className="retro-grid-stage absolute inset-0">
        {/* Floor — receding toward the horizon (bottom half) */}
        <div className="retro-grid-plane retro-grid-floor" />
        {/* Ceiling — mirrored, receding toward the horizon (top half) */}
        <div className="retro-grid-plane retro-grid-ceiling" />
      </div>

      {/* Vignette at top and bottom to soften hard edges */}
      <div className="retro-grid-fade absolute inset-0" />

      <style>{`
        .retro-grid-stage {
          perspective: 240px;
        }

        /* Shared grid pattern. Two crossed linear gradients form the
           vertical and horizontal grid lines. */
        .retro-grid-plane {
          position: absolute;
          inset: 0 -50%;
          background-image:
            linear-gradient(to right, rgba(192, 132, 252, 0.45) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(192, 132, 252, 0.45) 1px, transparent 1px);
          background-size: 44px 44px;
          /* Baseline scroll speed — fast enough to read as forward
             motion, slow enough not to read as a strobe. */
          animation: retro-grid-scroll 5s linear infinite;
          will-change: background-position;
        }

        /* Floor — extends downward from the horizon (the top edge of
           this plane sits at the horizon line). */
        .retro-grid-floor {
          top: 50%;
          height: 300%;
          transform-origin: 50% 0;
          transform: rotateX(65deg);
        }

        /* Ceiling — extends upward from the horizon, mirrored so the
           two planes meet in a single vanishing point. */
        .retro-grid-ceiling {
          bottom: 50%;
          height: 300%;
          transform-origin: 50% 100%;
          transform: rotateX(-65deg);
        }

        /* Boost — dramatically shortens the cycle so the grid reads as
           warp-speed during a slide transition. Because changing
           animation-duration mid-animation restarts the keyframes, the
           boost intentionally pops in as a short burst. */
        [data-boost='true'] .retro-grid-plane {
          animation-duration: 0.35s;
        }

        /* Reduced motion — pause entirely so vestibular users get a
           static grid rather than any translation. */
        [data-reduced='true'] .retro-grid-plane {
          animation: none;
        }

        @keyframes retro-grid-scroll {
          0% {
            background-position: 0 0, 0 0;
          }
          100% {
            /* One full tile of travel — keeps the grid seamless. */
            background-position: 0 44px, 0 44px;
          }
        }

        /* Soft fade at the extreme top and bottom so the grid blends
           into the dark bg at its far edges. The horizon (center) is
           kept clear so the two planes read as meeting at a point. */
        .retro-grid-fade {
          background:
            linear-gradient(to bottom,
              rgb(9 9 11) 0%,
              rgba(9, 9, 11, 0.0) 18%,
              rgba(9, 9, 11, 0.35) 50%,
              rgba(9, 9, 11, 0.0) 82%,
              rgb(9 9 11) 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .retro-grid-plane {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
