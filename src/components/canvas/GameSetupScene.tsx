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
// Scene X offset — no longer needed for layout. The right-half layout is now
// achieved by restricting #hero-canvas-view to w-1/2 right-0 in index.astro.
// Model renders at world origin, camera looks directly at model center.
// ---------------------------------------------------------------------------
export const SCENE_X_OFFSET = 0;

// ---------------------------------------------------------------------------
// Camera constants — isometric-style matching desire_scene.png.
// Camera at [5, 10, 7]: upper-right-front of setup, elevated ~38° from horizontal.
// Looks left+down+back toward monitor — same angle as Blender reference render.
// Desk surface, monitor (facing camera), and chair all visible in frame.
// ---------------------------------------------------------------------------
export const CAMERA_POSITION: [number, number, number] = [10, 10, 7];
export const CAMERA_TARGET: [number, number, number] = [1.17, 3.2, -0.69];
export const CAMERA_FOV = 20;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 100;

// Camera fly-in end — camera sits right at the monitor screen face, looking head-on
// into the screen (target pushed inside monitor along -X so lookAt direction is
// perpendicular to screen plane).
// Monitor world pos derived from .glb ide_screen_plane bbox + scene offset [3, 1.5, 0].
export const CAMERA_END_POSITION: [number, number, number] = [3.5, 4.95, -0.43];
export const CAMERA_END_TARGET: [number, number, number] = [2.5, 4.95, -0.43];
export const CAMERA_END_FOV = 10;

// Scroll window inside which the baked ChairSpin clip plays its full duration.
// Aligned with the camera aim arriving on CHAIR_CONTROLLER:
//   t 0.00→0.25 — camera aim lerps startTarget → chair (chair is arriving in frame)
//   t 0.25→0.50 — aim pivots chair → monitor (chair leaves the subject slot)
// The spin is centred on that arrival so the chair visibly rotates while it's the
// hero subject. Outside the window the clip is clamped to its first/last frame.
export const CHAIR_ANIM_SCROLL_START = 0.10;
export const CHAIR_ANIM_SCROLL_END = 0.40;

// Scroll window across which the IDE screen material is dimmed toward pure black.
// Aligned with seg2 of the camera fly-in (aim locked on monitor, camera closing in
// on the screen face). By the time scroll reaches SCREEN_DIM_SCROLL_END the screen
// is fully #000, which sets up the hard cut to the retro OS overlay.
export const SCREEN_DIM_SCROLL_START = 0.50;
export const SCREEN_DIM_SCROLL_END = 1.0;

// ---------------------------------------------------------------------------
// Module-level preload — fires before any component renders.
// ---------------------------------------------------------------------------
useGLTF.preload('/models/computer_room.glb');

// ---------------------------------------------------------------------------
// Allocate Vector3 instances outside any hook/frame to avoid per-frame GC.
// ---------------------------------------------------------------------------
const _startTarget = new THREE.Vector3(...CAMERA_TARGET);
// Chair world pos — CHAIR_CONTROLLER local [2.1, 2.8, -0.8] + scene group offset [3, 1.5, 0].
const _midTarget = new THREE.Vector3(5.1, 4.3, -0.8);
const _endTarget = new THREE.Vector3(...CAMERA_END_TARGET);
const _tmpPos = new THREE.Vector3();
const _tmpTarget = new THREE.Vector3();

// Shared black colour used as the lerp endpoint when the IDE screen fades out.
const _BLACK = new THREE.Color(0x000000);

// Two-segment piecewise cubic bezier for camera fly-in (aim rule B).
// Segment 1 (t 0→0.5): initial isometric → above+behind chair. Camera aims at chair.
// Segment 2 (t 0.5→1): chair vantage → monitor face. Camera pivots to monitor.
// Mid waypoint sits at +X/+Z of chair so the back of the chair is framed, then sweeps
// forward past the chair and around to the screen front.
const _p0 = new THREE.Vector3(...CAMERA_POSITION);       // start: [10,10,7]
const _cp1a = new THREE.Vector3(9.0, 8.0, 5.0);          // seg1 CP1 — ease out of start
const _cp2a = new THREE.Vector3(8.0, 6.3, 2.0);          // seg1 CP2 — approach chair vantage
const _pMid = new THREE.Vector3(7.0, 5.5, 0.5);          // mid waypoint — behind/above chair
const _cp1b = new THREE.Vector3(6.5, 5.3, -0.1);         // seg2 CP1 — leave chair, drop Z
const _cp2b = new THREE.Vector3(4.8, 5.1, -0.4);         // seg2 CP2 — settle to screen height
const _pEnd = new THREE.Vector3(...CAMERA_END_POSITION); // end: in front of screen face

const _curve1 = new THREE.CubicBezierCurve3(_p0, _cp1a, _cp2a, _pMid);
const _curve2 = new THREE.CubicBezierCurve3(_pMid, _cp1b, _cp2b, _pEnd);

// Dev-only debug geometry — sampled from curves at module load.
// 64 samples each = smooth visual, negligible cost.
const _curve1Line = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(_curve1.getPoints(64)),
  new THREE.LineBasicMaterial({ color: '#22d3ee' }), // cyan — segment 1
);
const _curve2Line = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(_curve2.getPoints(64)),
  new THREE.LineBasicMaterial({ color: '#fb923c' }), // orange — segment 2
);

// Handle lines: waypoint → CP1 → CP2 → next waypoint (visualise bezier "pull").
const _handle1 = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([_p0, _cp1a, _cp2a, _pMid]),
  new THREE.LineDashedMaterial({
    color: '#22d3ee',
    dashSize: 0.2,
    gapSize: 0.15,
    opacity: 0.4,
    transparent: true,
  }),
);
_handle1.computeLineDistances();
const _handle2 = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([_pMid, _cp1b, _cp2b, _pEnd]),
  new THREE.LineDashedMaterial({
    color: '#fb923c',
    dashSize: 0.2,
    gapSize: 0.15,
    opacity: 0.4,
    transparent: true,
  }),
);
_handle2.computeLineDistances();

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
  const { scene, animations } = useGLTF('/models/computer_room.glb');
  const { camera, invalidate } = useThree();

  // Plain JS ref — GSAP writes value [0,1], useFrame reads it (Pitfall §9 single-writer rule).
  const cameraProgress = useRef({ value: 0 });

  // Smoothed scroll value displayed to the scene. Each frame lerps toward
  // cameraProgress (the raw GSAP target) using a time-independent exponential
  // decay so the result is framerate-invariant. SMOOTH_RATE controls glide:
  // higher = snappier, lower = floatier. ~8 gives ~85ms halflife.
  const displayedProgress = useRef(0);
  const SMOOTH_RATE = 8;
  const SMOOTH_EPSILON = 0.0002;

  // Chair swivel — scrub the baked GLB clip "ChairSpin" via AnimationMixer.
  // The clip targets CHAIR_CONTROLLER.rotation (quaternion, Y-axis) and has Blender's
  // easing baked into 46 keyframes over 5.0s (0° → 60°, non-linear). Driving the clip
  // directly instead of writing rotation.y keeps the motion identical to Blender.
  //
  // Demand-mode note: mixer.setTime() is called from useFrame, and the useFrame tick
  // only runs because GSAP ScrollTrigger's onUpdate calls invalidate() while scrubbing.
  // Single-writer rule is preserved — the mixer owns CHAIR_CONTROLLER.quaternion.
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const chairClipDurationRef = useRef(0);

  useEffect(() => {
    // Prefer the named clip but fall back to the first animation to survive renames.
    const clip =
      animations.find((c) => c.name === 'ChairSpin') ?? animations[0] ?? null;
    if (!clip) {
      console.warn('[GameSetupScene] No AnimationClip found in computer_room.glb');
      return;
    }

    const mixer = new THREE.AnimationMixer(scene);
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    mixer.setTime(0); // pin to first frame — useFrame scrubs from scroll progress

    mixerRef.current = mixer;
    chairClipDurationRef.current = clip.duration;

    invalidate();

    return () => {
      action.stop();
      mixer.stopAllAction();
      mixer.uncacheAction(clip);
      mixer.uncacheRoot(scene);
      mixerRef.current = null;
      chairClipDurationRef.current = 0;
    };
  }, [scene, animations, invalidate]);

  // IDE screen dim-to-black — find the textured screen mesh and cache original
  // material colour / emissive so the seg2 fade can lerp them toward pure #000.
  // Backwards scroll restores the originals because we recompute from the cached
  // starting values every frame (no destructive writes to the source material).
  type DimmableMaterial = THREE.Material & {
    color?: THREE.Color;
    emissive?: THREE.Color;
    emissiveIntensity?: number;
  };
  const screenMatRef = useRef<DimmableMaterial | null>(null);
  const screenOrigColorRef = useRef<THREE.Color | null>(null);
  const screenOrigEmissiveRef = useRef<THREE.Color | null>(null);
  const screenOrigEmissiveIntensityRef = useRef<number>(1);

  useEffect(() => {
    const node = scene.getObjectByName('ide_screen_plane');
    let mesh: THREE.Mesh | null = null;
    if (node) {
      if ((node as THREE.Mesh).isMesh) {
        mesh = node as THREE.Mesh;
      } else {
        node.traverse((c) => {
          if (!mesh && (c as THREE.Mesh).isMesh) mesh = c as THREE.Mesh;
        });
      }
    }
    if (!mesh) {
      console.warn(
        '[GameSetupScene] ide_screen_plane mesh not found — screen dim disabled',
      );
      return;
    }

    // glTF can produce either a single Material or Material[] — take the first.
    const rawMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const mat = rawMat as DimmableMaterial;
    screenMatRef.current = mat;
    screenOrigColorRef.current = mat.color ? mat.color.clone() : null;
    screenOrigEmissiveRef.current = mat.emissive ? mat.emissive.clone() : null;
    screenOrigEmissiveIntensityRef.current =
      typeof mat.emissiveIntensity === 'number' ? mat.emissiveIntensity : 1;

    invalidate();

    return () => {
      // Restore so Strict-Mode remounts / HMR don't leak a dimmed material.
      if (screenOrigColorRef.current && mat.color) {
        mat.color.copy(screenOrigColorRef.current);
      }
      if (screenOrigEmissiveRef.current && mat.emissive) {
        mat.emissive.copy(screenOrigEmissiveRef.current);
      }
      if (typeof mat.emissiveIntensity === 'number') {
        mat.emissiveIntensity = screenOrigEmissiveIntensityRef.current;
      }
      screenMatRef.current = null;
      screenOrigColorRef.current = null;
      screenOrigEmissiveRef.current = null;
    };
  }, [scene, invalidate]);

  // Dev-only HUD overlay — live camera pos / target / fov / progress.
  // Updated directly via textContent in useFrame (no React re-renders).
  const hudRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const el = document.createElement('div');
    el.id = 'camera-debug-hud';
    el.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'z-index:9999',
      'padding:8px 12px',
      'background:rgba(9,9,11,0.88)',
      'color:#a78bfa',
      'font-family:"Press Start 2P",ui-monospace,monospace',
      'font-size:10px',
      'line-height:1.8',
      'border:1px solid #7c3aed',
      'border-radius:2px',
      'pointer-events:none',
      'white-space:pre',
      'letter-spacing:0.5px',
    ].join(';');
    document.body.appendChild(el);
    hudRef.current = el;
    return () => {
      el.remove();
      hudRef.current = null;
    };
  }, []);

  // After model resolves: aim camera at scene centre, render first demand-mode frame,
  // signal scene ready for Phase 6 ScrollTrigger setup.
  //
  // Lighting note:
  //   computer_room.glb ships with 4 KHR_lights_punctual lights authored in
  //   Blender (desk_spot SPOT + key_light_purple/fill_light/rim_light as POINTs,
  //   ported from the original AREA lights for glTF compatibility). Three.js
  //   (via @react-three/drei's useGLTF) instantiates them automatically, so no
  //   JSX <spotLight>/<pointLight>/<ambientLight> is authored here — that
  //   previously caused double-lighting with the GLB's own lights. The monitor
  //   halo + IDE screen glow still come from the GLB's own emissive materials
  //   (monitor_halo_mat, monitor_screen_ide, ide_plane_mat.001 @ 3.5).
  //
  // We scale the baked intensities down aggressively and clamp the point
  // light falloff: Blender exports watts-converted-to-candela (~24k cd for
  // a 380W point), which renders nuclear-bright in the Three.js PBR path.
  // The INTENSITY_SCALE factor maps Blender's physical units back to the
  // intensities that looked right when authored as JSX (~15-55 cd range).
  useEffect(() => {
    // Dim and range-clamp the GLB's KHR_lights_punctual lights in-place.
    // Blender's watts→candela conversion overshoots what Three.js wants by
    // a large factor; 1/10 brings 24k cd down to ~2.5k cd which, combined
    // with distance caps + decay=2, matches the tuned JSX intensities at
    // typical 3-5m source-to-surface distances.
    // Idempotent: useGLTF caches the same scene graph across Strict-Mode /
    // HMR remounts, so we stamp a marker to skip re-scaling.
    const INTENSITY_SCALE = 1 / 400;
    const DEFAULT_POINT_DISTANCE = 14;
    const DEFAULT_SPOT_DISTANCE = 12;
    const MARK = '__intensityScaled';
    scene.traverse((obj) => {
      const L = obj as THREE.Light;
      if (!L.isLight) return;
      if ((L as THREE.AmbientLight).isAmbientLight) return;
      const marked = L as unknown as Record<string, unknown>;
      if (marked[MARK]) return;
      L.intensity *= INTENSITY_SCALE;
      marked[MARK] = true;
      if ((L as THREE.PointLight).isPointLight) {
        const p = L as THREE.PointLight;
        if (!p.distance || p.distance <= 0) p.distance = DEFAULT_POINT_DISTANCE;
      } else if ((L as THREE.SpotLight).isSpotLight) {
        const s = L as THREE.SpotLight;
        if (!s.distance || s.distance <= 0) s.distance = DEFAULT_SPOT_DISTANCE;
      }
    });

    camera.lookAt(new THREE.Vector3(...CAMERA_TARGET));
    invalidate();
    $sceneReady.set(true);
  }, [camera, invalidate, scene]);

  // ---------------------------------------------------------------------------
  // Phase 6 — GSAP ScrollTrigger camera fly-in.
  // useGSAP() is Strict Mode safe (AGENTS.md hard rule — no raw useEffect for GSAP).
  // Trigger: #scene-scroll-pin (set in index.astro Plan 06-02).
  // scrub: true — GSAP writes raw scroll position into cameraProgress (target).
  // useFrame below lerps a separate displayedProgress ref toward target each
  // frame, giving an ease-in-out glide between wheel ticks. Demand frameloop
  // keeps ticking via the self-driving invalidate() while not yet converged.
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
  useFrame(({ camera: cam }, delta) => {
    // Exponential lerp toward target. Time-independent: same feel at 30/60/120fps.
    // delta is seconds since last frame; clamp to avoid overshoot on long pauses.
    const target = cameraProgress.current.value;
    const cur = displayedProgress.current;
    const diff = target - cur;
    if (Math.abs(diff) > SMOOTH_EPSILON) {
      const dt = Math.min(delta, 0.1);
      const k = 1 - Math.exp(-dt * SMOOTH_RATE);
      displayedProgress.current = cur + diff * k;
      invalidate(); // keep demand frameloop ticking until converged
    } else if (cur !== target) {
      displayedProgress.current = target; // snap last sliver
    }

    const t = displayedProgress.current;

    // Chair swivel — scrub the baked Blender clip across a sub-window of scroll
    // aligned with the camera aim arriving on the chair. Full clip duration is
    // consumed inside [CHAIR_ANIM_SCROLL_START, CHAIR_ANIM_SCROLL_END]; before/after
    // the clip is held at its first/last frame. Scrubs bidirectionally, so the
    // chair rotates forward as you scroll down and rewinds as you scroll up.
    //
    // Note: the target time is clamped strictly inside (0, duration) so that
    // LoopOnce + clampWhenFinished never trip the action's "finished" branch —
    // once tripped, three.js sets action.paused = true and subsequent setTime()
    // calls silently no-op, which is what would break reverse-scrub.
    const mixer = mixerRef.current;
    const clipDur = chairClipDurationRef.current;
    if (mixer && clipDur > 0) {
      const span = CHAIR_ANIM_SCROLL_END - CHAIR_ANIM_SCROLL_START;
      const u =
        t <= CHAIR_ANIM_SCROLL_START
          ? 0
          : t >= CHAIR_ANIM_SCROLL_END
            ? 1
            : (t - CHAIR_ANIM_SCROLL_START) / span;
      const target = Math.min(u * clipDur, clipDur - 1e-4);
      mixer.setTime(target);
    }

    // IDE screen dim — fades the monitor image to pure #000 across seg2 of the
    // fly-in (scroll SCREEN_DIM_SCROLL_START → SCREEN_DIM_SCROLL_END). Dims the
    // albedo colour *and* emissive so the result is black regardless of whether
    // the material draws the IDE image via map or emissiveMap. Each frame
    // recomputes from the cached originals, which makes reverse scroll restore
    // the screen naturally.
    const screenMat = screenMatRef.current;
    const origColor = screenOrigColorRef.current;
    const origEmissive = screenOrigEmissiveRef.current;
    if (screenMat) {
      const dimSpan = SCREEN_DIM_SCROLL_END - SCREEN_DIM_SCROLL_START;
      const dim =
        t <= SCREEN_DIM_SCROLL_START
          ? 0
          : t >= SCREEN_DIM_SCROLL_END
            ? 1
            : (t - SCREEN_DIM_SCROLL_START) / dimSpan;
      if (screenMat.color && origColor) {
        screenMat.color.copy(origColor).lerp(_BLACK, dim);
      }
      if (screenMat.emissive && origEmissive) {
        screenMat.emissive.copy(origEmissive).lerp(_BLACK, dim);
      }
      if (typeof screenMat.emissiveIntensity === 'number') {
        screenMat.emissiveIntensity =
          screenOrigEmissiveIntensityRef.current * (1 - dim);
      }
    }

    // Animate camera only when scroll has progressed. HUD still updates below.
    if (t > 0) {
      // Three-phase aim (move-to-chair split into early/late, then move-to-monitor):
      //   t 0.00→0.25 — seg1 position (first half). Aim lerps startTarget → chair.
      //   t 0.25→0.50 — seg1 position (second half). Aim pivots chair → monitor.
      //   t 0.50→1.00 — seg2 position (all). Aim stays on monitor.
      if (t < 0.25) {
        const s = t * 2;                 // 0 → 0.5 of curve1
        _curve1.getPoint(s, _tmpPos);
        _tmpTarget.lerpVectors(_startTarget, _midTarget, t * 4); // 0 → 1
      } else if (t < 0.5) {
        const s = t * 2;                 // 0.5 → 1 of curve1
        _curve1.getPoint(s, _tmpPos);
        _tmpTarget.lerpVectors(_midTarget, _endTarget, (t - 0.25) * 4); // 0 → 1
      } else {
        const s = (t - 0.5) * 2;         // 0 → 1 of curve2
        _curve2.getPoint(s, _tmpPos);
        _tmpTarget.copy(_endTarget);
      }

      cam.position.copy(_tmpPos);
      cam.lookAt(_tmpTarget);

      // Narrow FOV as camera approaches the monitor — screen fills the frame at end.
      const perspCam = cam as THREE.PerspectiveCamera;
      perspCam.fov = CAMERA_FOV + (CAMERA_END_FOV - CAMERA_FOV) * t;
      perspCam.updateProjectionMatrix();
    }

    // Dev HUD — direct DOM write, no re-renders.
    if (hudRef.current) {
      const p = cam.position;
      const tgt = t > 0 ? _tmpTarget : _startTarget;
      const fov = (cam as THREE.PerspectiveCamera).fov;
      const seg =
        t === 0
          ? 'idle'
          : t < 0.25
            ? 'seg1a·aim→chair'
            : t < 0.5
              ? 'seg1b·aim→monitor'
              : 'seg2·aim=monitor';
      hudRef.current.textContent =
        `CAMERA DEBUG [${seg}]\n` +
        `scroll t  ${t.toFixed(3)}\n` +
        `pos       ${p.x.toFixed(2).padStart(6)}, ${p.y.toFixed(2).padStart(6)}, ${p.z.toFixed(2).padStart(6)}\n` +
        `lookAt    ${tgt.x.toFixed(2).padStart(6)}, ${tgt.y.toFixed(2).padStart(6)}, ${tgt.z.toFixed(2).padStart(6)}\n` +
        `fov       ${fov.toFixed(2)}`;
    }
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
       * Lighting is baked into computer_room.glb via KHR_lights_punctual
       * (4 lights: desk_spot SPOT + key_light_purple/fill_light/rim_light POINTs).
       * Three.js instantiates them automatically when useGLTF resolves; their
       * intensities are scaled + range-clamped in the useEffect above.
       *
       * A very dim violet ambientLight provides fill so surfaces outside the
       * direct cones are still readable (matches Blender's world background
       * of (0.01, 0.005, 0.02) @ strength 0.05).
       */}
      <ambientLight color="#2a1f45" intensity={0.18} />

      {/* Model at world origin — layout separation handled by right-half canvas view. */}
      <group position={[3.0, 1.5, 0]}>
        <primitive object={scene} />
      </group>

      {/*
       * Debug helpers — dev only. Strip before production build.
       *   axesHelper: red=+X, green=+Y, blue=+Z (length 5).
       *   gridHelper: 20x20 on XZ plane at y=0, violet major lines.
       *   Box3 bounds + markers at key path points (start/mid/end + mid-target).
       */}
      {import.meta.env.DEV && (
        <>
          <axesHelper args={[5]} />
          <gridHelper args={[20, 20, '#a78bfa', '#3a2a5e']} />

          {/* Bezier curve paths — sampled into THREE.Line at module load. */}
          <primitive object={_curve1Line} />
          <primitive object={_curve2Line} />

          {/* Dashed handles — waypoint → CP1 → CP2 → next waypoint. */}
          <primitive object={_handle1} />
          <primitive object={_handle2} />

          {/* Control-point markers (small cubes — bezier handles). */}
          <mesh position={_cp1a}>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshBasicMaterial color="#22d3ee" wireframe />
          </mesh>
          <mesh position={_cp2a}>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshBasicMaterial color="#22d3ee" wireframe />
          </mesh>
          <mesh position={_cp1b}>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshBasicMaterial color="#fb923c" wireframe />
          </mesh>
          <mesh position={_cp2b}>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshBasicMaterial color="#fb923c" wireframe />
          </mesh>

          {/* Path waypoint markers (spheres) */}
          <mesh position={_p0}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#facc15" wireframe />
          </mesh>
          <mesh position={_pMid}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#22c55e" wireframe />
          </mesh>
          <mesh position={_pEnd}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#ef4444" wireframe />
          </mesh>
          {/* LookAt target markers (solid cubes) */}
          <mesh position={CAMERA_TARGET}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          <mesh position={_midTarget}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
          <mesh position={CAMERA_END_TARGET}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </>
      )}
    </>
  );
}
