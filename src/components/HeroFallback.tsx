/**
 * HeroFallback — static section shown only when WebGL is unsupported
 * (tier === 1). Mobile and desktop Safari still get the full 3D scene;
 * fallback is reserved for devices where the canvas literally cannot run.
 *
 * Requirement: MOBILE-001, MOBILE-003
 */

import { $gpuTier } from '@/stores';
import { useStore } from '@nanostores/react';

export default function HeroFallback() {
  const gpuTier = useStore($gpuTier);

  // tier 1 is now exclusively "WebGL unsupported". Everything else (0 unknown,
  // 2 mid, 3 high, including mobile) renders the scene.
  if (gpuTier !== 1) return null;

  return (
    <div
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4"
      aria-label="3D scene simplified for your device"
    >
      {/* Decorative gradient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-zinc-950 via-zinc-900 to-zinc-950"
      />
      {/* Purple grid accent */}
      <div
        aria-hidden="true"
        className="os-bg-grid pointer-events-none absolute inset-0 opacity-40"
      />

      {/* Static content card */}
      <div className="relative z-10 mx-auto max-w-sm space-y-6 text-center">
        <p className="font-pixel text-xs text-purple-400">RC.OS v1.0</p>
        <div className="space-y-2 border border-zinc-700 bg-zinc-900/80 p-6">
          <p className="font-pixel text-xs text-zinc-400">SENIOR FULL-STACK DEVELOPER</p>
          <p className="font-pixel text-xs text-yellow-400">AI · FRONTEND · CLOUD</p>
        </div>
        <p className="font-pixel text-xs leading-relaxed text-zinc-500">
          5 years shipping production frontends
        </p>
        <a
          href="#projects"
          className="inline-block font-pixel text-xs text-purple-400 hover:text-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        >
          ▼ VIEW PROJECTS
        </a>
      </div>
    </div>
  );
}
