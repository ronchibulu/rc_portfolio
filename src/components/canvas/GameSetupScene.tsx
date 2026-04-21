import { $sceneReady } from '@/stores/sceneStore';
import { useGLTF } from '@react-three/drei/core/Gltf.js';
import { PerspectiveCamera } from '@react-three/drei/core/PerspectiveCamera.js';
import { useProgress } from '@react-three/drei/misc/useProgress.js';
/**
 * Phase 5 — R3F scene component.
 *
 * Provides:
 *  - Named camera constants (Phase 6 reads these as animation start points)
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
export const CAMERA_POSITION: [number, number, number] = [8, 6, 10];
export const CAMERA_TARGET: [number, number, number] = [1.2, 2.5, -0.7];
export const CAMERA_FOV = 45;
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
       * Lighting rig — matches dark purple atmosphere in image.png (UI-SPEC §2).
       * No env map, no shadows — too heavy for demand-mode frameloop.
       */}
      <ambientLight intensity={0.15} color="#1a0a2e" />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#b8a0ff" castShadow={false} />
      <directionalLight position={[-3, 4, -5]} intensity={0.4} color="#6040ff" castShadow={false} />

      {/* Model — desk_spot is the root node of gaming_setup_v12.glb. */}
      <primitive object={scene} />
    </>
  );
}
