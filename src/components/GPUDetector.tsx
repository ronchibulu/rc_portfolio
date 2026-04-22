/**
 * Phase 10 — GPUDetector.tsx
 *
 * Runs detect-gpu on mount, sets $gpuTier nanostore.
 * Returns null — pure side-effect island.
 *
 * Tier mapping (detect-gpu):
 *  0 — BENCHMARKS_NOT_FOUND / error (treat as mid)
 *  1 — low-tier (mobile budget / no WebGL support)
 *  2 — mid-tier
 *  3 — high-tier
 *
 * Also respects isMobile from detect-gpu. When isMobile=true → treat as tier 1.
 *
 * Requirement: MOBILE-001, MOBILE-002
 */

import { $gpuTier } from '@/stores';
import { useEffect } from 'react';

export default function GPUDetector() {
  useEffect(() => {
    let cancelled = false;

    async function detect() {
      try {
        const { getGPUTier } = await import('detect-gpu');
        const result = await getGPUTier();
        if (cancelled) return;

        // isMobile OR tier ≤ 1 → set tier 1 (fallback path)
        const tier = result.isMobile || result.tier <= 1 ? 1 : result.tier;
        $gpuTier.set(tier);
      } catch {
        // Detection failed — leave $gpuTier at 0 (treated as mid in SceneCanvas)
      }
    }

    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
