/**
 * GPUDetector — runs detect-gpu on mount, sets $gpuTier + $isMobile nanostores.
 *
 * Semantics (see sceneStore.ts):
 *   tier 0 — uninitialised.
 *   tier 1 — WebGL unsupported. Only case where HeroFallback replaces SceneCanvas.
 *   tier 2 — mid (default "can run" bucket; also for desktop Safari where
 *            WEBGL_debug_renderer_info is blocked and benchmarking falls back).
 *   tier 3 — high-tier desktop GPU.
 *
 * isMobile is tracked separately so SceneCanvas can lower DPR on phones
 * without excluding them from the 3D experience. Earlier logic forced
 * isMobile → tier 1, which wrongly routed every phone AND desktop Safari
 * (blocked renderer info → fallback tier) to HeroFallback.
 *
 * Returns null — pure side-effect island.
 *
 * Requirement: MOBILE-001, MOBILE-002
 */

import { $gpuTier, $isMobile } from '@/stores';
import { useEffect } from 'react';

export default function GPUDetector() {
  useEffect(() => {
    let cancelled = false;

    async function detect() {
      try {
        const { getGPUTier } = await import('detect-gpu');
        const result = await getGPUTier();
        if (cancelled) return;

        $isMobile.set(!!result.isMobile);

        if (result.type === 'WEBGL_UNSUPPORTED') {
          // Only true blocker — no WebGL, scene cannot render.
          $gpuTier.set(1);
          return;
        }

        // Everything else runs the scene. Tier 3 only for confidently-benchmarked
        // high-end GPUs; otherwise default to 2 so Safari / mobile / fallback
        // detections still render the scene at mid DPR.
        $gpuTier.set(result.tier >= 3 ? 3 : 2);
      } catch {
        // Detection threw — leave $gpuTier at 0. SceneCanvas treats 0 as
        // "try to render" (same default as tier 2).
      }
    }

    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
