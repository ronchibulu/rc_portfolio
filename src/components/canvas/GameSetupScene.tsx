import { $sceneReady, $scrollProgress } from '@/stores';
import { useGSAP } from '@gsap/react';
import { useGLTF } from '@react-three/drei/core/Gltf.js';
import { PerspectiveCamera } from '@react-three/drei/core/PerspectiveCamera.js';
import { useProgress } from '@react-three/drei/core/Progress.js';
import { Html } from '@react-three/drei/web/Html.js';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Phase 5/6 — R3F scene component.
 *
 * Phase 5 provides:
 *  - Named camera constants (Phase 6 reads these as animation start points)
 *  - Module-level preload for the .glb (SCENE-005 / PERF-002)
 *  - SceneLoader Suspense fallback with Drei <Html> + useProgress
 *  - $sceneReady side effect + invalidate() after model resolves
 *
 * Phase 6 adds:
 *  - CAMERA_END_POSITION / CAMERA_END_TARGET for fly-in destination
 *  - useGSAP() ScrollTrigger hook — GSAP writes cameraProgress ref
 *  - useFrame reads cameraProgress ref, applies lerped position/lookAt (Pitfall §9)
 *  - $scrollProgress nanostore updated from GSAP onUpdate
 *  - invalidate() called each tick during active scroll (demand frameloop)
 *  - Reduced-motion guard: skip ScrollTrigger when prefers-reduced-motion: reduce
 *
 * Sub-path imports only — no @react-three/drei barrel (Phase 4 fix for Vite 504).
 */

// ---------------------------------------------------------------------------
// Register GSAP plugins once at module level.
// ScrollTrigger.config ignoreMobileResize prevents iOS address-bar jank (Pitfall §10).
// ---------------------------------------------------------------------------
gsap.registerPlugin(ScrollTrigger, useGSAP);
ScrollTrigger.config({ ignoreMobileResize: true });

// ---------------------------------------------------------------------------
// Camera constants — Phase 6 imports these as animation start points.
// ---------------------------------------------------------------------------
export const CAMERA_POSITION: [number, number, number] = [6, 6, 8];
export const CAMERA_TARGET: [number, number, number] = [1.17, 3.2, -0.69];
export const CAMERA_FOV = 40;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 100;

// Camera fly-in end: from the chair's perspective — in front of the monitor face.
// In scene_2 the monitor faces lower-right (toward the chair). The screen center
// is approx x≈0, y≈3.5, z≈-0.5. Camera ends where a seated person would be:
// offset toward +X and +Z from the screen, at screen height, looking back at it.
// FOV tapers to 22° so the monitor screen fills the canvas at the end.
export const CAMERA_END_POSITION: [number, number, number] = [2.5, 3.5, 1.5];
export const CAMERA_END_TARGET: [number, number, number] = [0.0, 3.5, -0.5];
export const CAMERA_END_FOV = 22;

// ---------------------------------------------------------------------------
// Module-level preload — fires before any component renders.
// ---------------------------------------------------------------------------
useGLTF.preload('/models/gaming_setup_v12.glb');

// ---------------------------------------------------------------------------
// Allocate Vector3 instances outside any hook/frame to avoid per-frame GC.
// ---------------------------------------------------------------------------
const _startPos = new THREE.Vector3(...CAMERA_POSITION);
const _endPos = new THREE.Vector3(...CAMERA_END_POSITION);
const _startTarget = new THREE.Vector3(...CAMERA_TARGET);
const _endTarget = new THREE.Vector3(...CAMERA_END_TARGET);
const _tmpPos = new THREE.Vector3();
const _tmpTarget = new THREE.Vector3();

// Cubic bezier control points — arc the camera around the monitor's right flank.
// P0 = start [6,6,8], P3 = end [2.5,3.5,1.5]
// P1: drop height fast, stay far-right — begins the rightward swing
// P2: already at screen height, swung to right-front of monitor — lines up the final approach
// The curve sweeps: upper-right-back → right-side at height → right-front at screen level
const _cp1 = new THREE.Vector3(7.0, 3.5, 5.0); // stay right, drop fast to screen height
const _cp2 = new THREE.Vector3(4.5, 3.5, 0.5); // right-front of monitor, screen height

// ---------------------------------------------------------------------------
// SceneLoader — Suspense fallback rendered while .glb is in-flight.
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
// GameSetupScene — R3F scene rendered inside a Drei <View>.
// ---------------------------------------------------------------------------
export default function GameSetupScene() {
  const { scene } = useGLTF('/models/gaming_setup_v12.glb');
  const { camera, invalidate } = useThree();

  // Plain JS ref — GSAP writes value [0,1], useFrame reads it (Pitfall §9 single-writer rule).
  const cameraProgress = useRef({ value: 0 });

  // After model resolves: aim camera at scene centre, render first demand-mode frame,
  // signal scene ready for Phase 6 ScrollTrigger setup.
  useEffect(() => {
    camera.lookAt(new THREE.Vector3(...CAMERA_TARGET));
    invalidate();
    $sceneReady.set(true);
  }, [camera, invalidate]);

  // ---------------------------------------------------------------------------
  // Phase 6 — GSAP ScrollTrigger camera fly-in.
  // useGSAP() is Strict Mode safe (AGENTS.md hard rule — no raw useEffect for GSAP).
  // Trigger: #scene-scroll-pin (set in index.astro Plan 06-02).
  // scrub: true — no numeric lag/catch-up (ARCHITECTURE.md §GSAP ScrollTrigger).
  // ---------------------------------------------------------------------------
  useGSAP(
    () => {
      // Reduced-motion guard — skip entire ScrollTrigger when user prefers no motion.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const tween = gsap.to(cameraProgress.current, {
        value: 1,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: '#scene-scroll-pin',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            $scrollProgress.set(self.progress);
            invalidate(); // demand frameloop: render this frame during scroll
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
      };
    },
    { dependencies: [] },
  );

  // ---------------------------------------------------------------------------
  // useFrame — single writer to the scene graph (Pitfall §9).
  // Lerps camera position and lookAt target from start → end as progress advances.
  // No-ops at progress = 0 to avoid redundant per-frame writes when idle.
  // ---------------------------------------------------------------------------
  useFrame(({ camera: cam }) => {
    const t = cameraProgress.current.value;
    if (t <= 0) return;

    // Cubic bezier: P = (1-t)^3*P0 + 3*(1-t)^2*t*P1 + 3*(1-t)*t^2*P2 + t^3*P3
    // Arcs the camera around the monitor's right flank — rightward orbital sweep.
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    _tmpPos.set(
      mt3 * _startPos.x + 3 * mt2 * t * _cp1.x + 3 * mt * t2 * _cp2.x + t3 * _endPos.x,
      mt3 * _startPos.y + 3 * mt2 * t * _cp1.y + 3 * mt * t2 * _cp2.y + t3 * _endPos.y,
      mt3 * _startPos.z + 3 * mt2 * t * _cp1.z + 3 * mt * t2 * _cp2.z + t3 * _endPos.z,
    );

    // Target lerps straight from start to end (no bezier needed for lookAt).
    _tmpTarget.lerpVectors(_startTarget, _endTarget, t);

    cam.position.copy(_tmpPos);
    cam.lookAt(_tmpTarget);

    // Narrow FOV as camera approaches the monitor — screen fills the frame at end.
    const perspCam = cam as THREE.PerspectiveCamera;
    perspCam.fov = CAMERA_FOV + (CAMERA_END_FOV - CAMERA_FOV) * t;
    perspCam.updateProjectionMatrix();
  });

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
       * Lighting: single low ambient so the .glb baked lighting + monitor emission
       * display as authored (matches image.png). No custom point lights — they
       * overexpose the scene (Phase 5 fix).
       */}
      <ambientLight intensity={0.12} />

      {/* Model */}
      <primitive object={scene} />
    </>
  );
}
