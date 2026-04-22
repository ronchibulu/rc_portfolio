/**
 * Phase 4/5 — R3F Canvas island (single React root for the entire 3D system).
 *
 * ARCHITECTURE NOTE (Phase 5 fix):
 *   Drei's <View> uses tunnel-rat (a Zustand store) to pipe scene content from
 *   outside the Canvas into the Canvas's render loop. This tunnel is module-scoped,
 *   but Astro's client:only="react" creates a *separate React root* per island.
 *   Separate roots = separate React context trees = the View tunnel's In/Out
 *   never connect.
 *
 *   Fix: SceneCanvas owns ALL R3F content. index.astro passes `heroViewId` so
 *   SceneCanvas can locate the hero tracking div and mount the View internally.
 *   SceneView.tsx is no longer a standalone island — it's rendered inside this
 *   component where View.Port and View share the same React root.
 *
 * Mounting rules (AGENTS.md hard rules + 04-UI-SPEC):
 *   - client:only="react" in index.astro — no SSR output, zero hydration mismatch.
 *   - frameloop="demand" — GPU renders ONLY when invalidate() is called.
 *   - Single canvas. Drei <View.Port> and all <View> regions live in this root.
 *   - gl={{ alpha: true }} keeps the canvas transparent — body bg-zinc-950 shows through.
 */
import { useGLTF } from '@react-three/drei/core/Gltf.js';
// Use direct sub-path imports to avoid pre-bundling the entire @react-three/drei
// barrel (139 re-exports). The barrel causes Vite's dep optimizer to time out,
// leaving @react-three_drei.js as a dangling .map-only entry that 504s on load.
import { View } from '@react-three/drei/web/View.js';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SceneLoader } from './GameSetupScene';
import GameSetupScene from './GameSetupScene';

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

interface SceneCanvasProps {
  /** ID of the hero section tracking div for the Drei <View> scissor region. */
  heroViewId?: string;
}

/**
 * SceneCanvas — the single fixed full-viewport WebGL surface.
 *
 * Owns the entire R3F/Drei tree including the View for the hero scene.
 * This is necessary because Drei's View uses tunnel-rat which requires
 * View.Port and View to share the same React root context.
 *
 * Mount in index.astro as:
 *   <div class="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
 *     <SceneCanvas client:only="react" heroViewId="hero-canvas-view" />
 *   </div>
 */
export default function SceneCanvas({ heroViewId = 'hero-canvas-view' }: SceneCanvasProps) {
  // Locate the Astro-rendered tracking div. Since we're client:only, document is available.
  // useRef initialised synchronously on first render — the Astro DOM is already present.
  const trackRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById(heroViewId) : null,
  );

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.NoToneMapping,
      }}
      performance={{ min: 0.5 }}
    >
      {/*
       * Hero scene View — tracked to the hero section div.
       * View + View.Port must be in the same React root (see architecture note above).
       * View.Port renders the collected scene content here inside the Canvas.
       */}
      <View track={trackRef as React.MutableRefObject<HTMLElement>}>
        <Suspense fallback={<SceneLoader />}>
          <GameSetupScene />
        </Suspense>
      </View>

      {/* Drei multi-scene port — renders content from <View> regions. */}
      <View.Port />

      {/* Fires one invalidate() on mount for the initial demand-mode frame. */}
      <CanvasInit />
    </Canvas>
  );
}
