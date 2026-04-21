import GameSetupScene, { SceneLoader } from '@/components/canvas/GameSetupScene';
/**
 * Phase 5 — Drei <View> wrapper component.
 *
 * Mounts with client:only="react" in index.astro (hard rule — AGENTS.md).
 * document is always available on first render (no SSR guard needed for ref init,
 * but typeof guard is included for safety in case of future SSR context changes).
 *
 * Sub-path imports only — no @react-three/drei barrel (Phase 4 established fix for Vite 504).
 * No second <Canvas> — this component renders inside the existing canvas via View (AGENTS.md).
 */
import { View } from '@react-three/drei/web/View.js';
import { Suspense, useRef } from 'react';

interface SceneViewProps {
  /** ID of the DOM element the View scissor region should track. */
  trackId: string;
}

/**
 * SceneView — registers a Drei <View> viewport tracked to a DOM element by ID.
 *
 * The tracking div lives in Astro markup (`<div id="hero-canvas-view" />`), not in React.
 * Since this island is client:only="react", document.getElementById is safe to call
 * synchronously in the component body on the first render pass.
 *
 * Usage in index.astro:
 *   <div id="hero-canvas-view" class="absolute inset-0 pointer-events-none" />
 *   <SceneView client:only="react" trackId="hero-canvas-view" />
 */
export default function SceneView({ trackId }: SceneViewProps) {
  // Initialize ref synchronously from the Astro-rendered DOM element.
  // typeof guard retained for safety in case of future SSR context.
  const ref = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById(trackId) : null,
  );

  return (
    <View track={ref as React.MutableRefObject<HTMLElement>}>
      <Suspense fallback={<SceneLoader />}>
        <GameSetupScene />
      </Suspense>
    </View>
  );
}
