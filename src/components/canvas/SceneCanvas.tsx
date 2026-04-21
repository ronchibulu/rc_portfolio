import { useGLTF } from '@react-three/drei/core/Gltf.js';
/**
 * Phase 4 — R3F Canvas island.
 *
 * Mounting rules (AGENTS.md hard rules + 04-UI-SPEC):
 *   - client:only="react" in index.astro — no SSR output, zero hydration mismatch.
 *   - frameloop="demand" — GPU renders ONLY when invalidate() is called.
 *     Phase 4: one invalidate() on mount (initial frame).
 *     Phase 6: GSAP ticker calls invalidate() during active scroll.
 *   - Single canvas for the entire portfolio. Drei <View.Port> renders View regions
 *     registered by Phase 5+ components. No second <Canvas> ever.
 *   - gl={{ alpha: true }} keeps the canvas transparent — body bg-zinc-950 shows through.
 *   - pointer-events-none on the wrapper (set in index.astro) — HTML layers remain clickable.
 */
// Use direct sub-path imports to avoid pre-bundling the entire @react-three/drei
// barrel (139 re-exports). The barrel causes Vite's dep optimizer to time out,
// leaving @react-three_drei.js as a dangling .map-only entry that 504s on load.
import { View } from '@react-three/drei/web/View.js';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';

// Module-level side effect: register Draco decoder path before any useGLTF() call.
// public/draco/ contains the decoder binaries (Phase 3 output).
useGLTF.setDecoderPath('/draco/');

/**
 * Inner component — must live inside <Canvas> to access useThree().
 * Fires a single invalidate() on mount so the first frame renders with frameloop="demand".
 */
function CanvasInit(): null {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
}

/**
 * SceneCanvas — the single fixed full-viewport WebGL surface.
 *
 * Mount in index.astro as:
 *   <div class="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
 *     <SceneCanvas client:only="react" />
 *   </div>
 *
 * Canvas fills its parent 100% × 100% (R3F default behaviour).
 * The wrapper uses fixed + inset-0 to pin to the viewport behind all HTML content.
 */
export default function SceneCanvas() {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      performance={{ min: 0.5 }}
    >
      {/* Drei multi-scene port — renders content from <View> regions (Phase 5+). */}
      <View.Port />

      {/* Placeholder ambient light — keeps the scene non-black during Phase 4 dev. */}
      {/* Phase 5 replaces this with the full lighting rig. */}
      <ambientLight intensity={0.5} />

      {/* Fires one invalidate() on mount for the initial demand-mode frame. */}
      <CanvasInit />
    </Canvas>
  );
}
