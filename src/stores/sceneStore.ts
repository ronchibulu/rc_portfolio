/**
 * Phase 4 — Cross-island state atoms.
 *
 * $gpuTier     — GPU capability tier (0 = unknown). Set by detect-gpu in Phase 10.
 *                Read in Phase 5 for LOD decisions (high/mid/low model quality).
 * $scrollProgress — Normalised scroll position [0, 1]. Set by GSAP ticker in Phase 6.
 *                   Read by useFrame in Phase 5/6 to drive camera animation.
 * $sceneReady  — True once the 3D model has finished loading (Phase 5).
 *                Used to gate scroll-based interactions.
 */
import { atom } from 'nanostores';

/** GPU capability tier from detect-gpu. 0 = uninitialised. Set in Phase 10. */
export const $gpuTier = atom<number>(0);

/** Normalised scroll progress [0, 1]. Set by GSAP ScrollTrigger ticker in Phase 6. */
export const $scrollProgress = atom<number>(0);

/** True when the 3D model has finished loading. Set in Phase 5. */
export const $sceneReady = atom<boolean>(false);
