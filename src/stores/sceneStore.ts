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

/** Active section for cross-island routing. Set by ScrollNarrative in Phase 6. */
export const $activeSection = atom<string>('hero');

/**
 * True while NavTransition is orchestrating a cover→scroll→reveal animation
 * triggered by a header anchor click. OSScreen reads this to suppress its own
 * PixelReveal intro when the nav transition is already handling the visual
 * cover/reveal — otherwise both reveals would play simultaneously and stack.
 */
export const $navTransitioning = atom<boolean>(false);

/**
 * Pending window to auto-open once OSScreen activates.
 * NavTransition sets this when the user clicks a header hash anchor
 * (#projects → 'projects', #about → 'about', #contact → 'contact').
 * OSScreen consumes the intent on activation, opens the matching window,
 * and clears the store back to null.
 */
export type OsIntent = 'projects' | 'about' | 'contact' | null;
export const $osIntent = atom<OsIntent>(null);
