import { $sceneReady } from '@/stores/sceneStore';
import { useGLTF } from '@react-three/drei/core/Gltf.js';
import { PerspectiveCamera } from '@react-three/drei/core/PerspectiveCamera.js';
import { useProgress } from '@react-three/drei/core/Progress.js';
/**
 * Phase 5 — R3F scene component.
 *
 * Provides:
 *  - Named camera constants (Phase 6 reads these as animation start points)
 *  - SCENE_OFFSET_X: hero-state rightward offset; Phase 6 tweens to 0 on scroll fly-in
 *  - Module-level preload for the .glb (SCENE-005 / PERF-002 — fires before any render)
 *  - 3-light rig matching the dark purple atmosphere in image.png (UI-SPEC §2)
 *  - SceneLoader Suspense fallback with Drei <Html> + useProgress (UI-SPEC §3)
 *  - $sceneReady side effect + invalidate() after model resolves (CONTEXT.md)
 *
 * Sub-path imports only — no @react-three/drei barrel (Phase 4 established fix for Vite 504).
 * Do NOT call useGLTF.setDecoderPath() here — already done in SceneCanvas.tsx.
 * Do NOT add orbit controls or a continuous useFrame loop (AGENTS.md hard rules).
 */
import { Html } from '@react-three/drei/web/Html.js';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Camera constants — Phase 6 imports these as animation start points.
// Tunable: values matched to image.png isometric perspective.
// ---------------------------------------------------------------------------
// gaming_setup_v12.glb bbox: min(-4.83, 2, -6.69) / max(7.17, 3.92, 5.31)
// Desk top surface y≈3.0, monitor top y≈3.9, floor y≈0
// Reference image.png: camera upper-right, looking down at ~35° — desk top surface
// clearly visible, monitor faces viewer, chair sits right of desk.
// Target aimed at desk center (not floor) so camera looks at desk, not ground.
export const CAMERA_POSITION: [number, number, number] = [6, 6, 8];
export const CAMERA_TARGET: [number, number, number] = [1.17, 3.2, -0.69];
export const CAMERA_FOV = 40;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 100;

// ---------------------------------------------------------------------------
// Module-level preload — fires immediately when the module is evaluated,
// before any component renders. Draco path already set in SceneCanvas.tsx.
// ---------------------------------------------------------------------------
useGLTF.preload('/models/gaming_setup_v12.glb');

// ---------------------------------------------------------------------------
// SceneLoader — Suspense fallback rendered while .glb is in-flight.
// Exported so SceneView.tsx can use it as the <Suspense fallback>.
// ---------------------------------------------------------------------------
export function SceneLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <p className="font-['Press_Start_2P'] text-xs text-purple-400 whitespace-nowrap">
        LOADING... {Math.round(progress)}%
      </p>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// GameSetupScene — the R3F scene rendered inside a Drei <View>.
// ---------------------------------------------------------------------------
export default function GameSetupScene() {
  const { scene } = useGLTF('/models/gaming_setup_v12.glb');
  const { camera, invalidate } = useThree();

  // After model resolves: aim camera at scene centre, render the first
  // demand-mode frame, and signal that the scene is ready for Phase 6.
  useEffect(() => {
    camera.lookAt(new THREE.Vector3(...CAMERA_TARGET));
    invalidate();
    $sceneReady.set(true);
  }, [camera, invalidate]);

  return (
    <>
      {/* Camera — makeDefault registers it as the View-local active camera. */}
      <PerspectiveCamera
        makeDefault
        position={CAMERA_POSITION}
        fov={CAMERA_FOV}
        near={CAMERA_NEAR}
        far={CAMERA_FAR}
      />

      {/*
       * Lighting: use only a tiny neutral ambient so the .glb's baked lighting
       * and emission textures (monitor glow, desk surface) display as authored.
       * The reference image.png is lit by the .glb's own baked lights —
       * adding external point lights overexposes the scene.
       * Keep intensity ≤ 0.15 so baked shadows remain intact.
       */}
      <ambientLight intensity={0.12} />

      {/* Model — rendered centered, no offset (Phase 6 handles scroll positioning) */}
      <primitive object={scene} />
    </>
  );
}
