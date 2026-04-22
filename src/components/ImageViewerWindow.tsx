/**
 * ImageViewerWindow — retro "image.png" viewer rendered as a second, stacked
 * OS window (Option B of the gallery design). Spawned by PixelGallery when a
 * thumbnail is clicked, portaled to <body> so it escapes ProjectDialog's
 * overflow:hidden and stacks above at z=60.
 *
 * Features:
 *  - Shared `Window` chrome: draggable title bar, red/yellow/green traffic
 *    lights. Minimize = close (ephemeral viewer, no dock tab). Maximize =
 *    fullscreen, great for inspecting screenshots.
 *  - Title reads `<filename> — N/M` — matches the retro OS feel.
 *  - Keyboard nav: ←/→ prev/next, Home/End jump, Escape closes.
 *  - ◄ ► pixel-arrow overlay buttons for pointer users.
 *  - Stepped crossfade on image swap (reuses .animate-pixel-fade).
 *  - CRT scanline overlay + purple inner ring, matching PixelGallery.
 */

import Window from '@/components/Window';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ImageViewerWindowProps {
  images: string[];
  name: string;
  startIndex: number;
  onClose: () => void;
}

function filenameFromSrc(src: string): string {
  const tail = src.split('/').pop() ?? src;
  return tail.replace(/\.[a-zA-Z0-9]+$/, '');
}

export default function ImageViewerWindow({
  images,
  name,
  startIndex,
  onClose,
}: ImageViewerWindowProps) {
  const [active, setActive] = useState(startIndex);
  const [swapId, setSwapId] = useState(0);
  const [maximized, setMaximized] = useState(false);

  const count = images.length;
  const multi = count > 1;

  const go = useCallback(
    (idx: number) => {
      if (count === 0) return;
      const next = ((idx % count) + count) % count;
      setActive(next);
      setSwapId((s) => s + 1);
    },
    [count]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (multi && e.key === 'ArrowRight') {
        e.preventDefault();
        go(active + 1);
      } else if (multi && e.key === 'ArrowLeft') {
        e.preventDefault();
        go(active - 1);
      } else if (multi && e.key === 'Home') {
        e.preventDefault();
        go(0);
      } else if (multi && e.key === 'End') {
        e.preventDefault();
        go(count - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, count, multi, go, onClose]);

  if (typeof document === 'undefined' || count === 0) return null;

  const currentSrc = images[active];
  const filename = filenameFromSrc(currentSrc);
  const title = `${filename}.png — ${active + 1}/${count}`;

  return createPortal(
    <Window
      title={title}
      ariaLabel={`${name} — ${filename} screenshot`}
      size="lg"
      z={60}
      minimized={false}
      maximized={maximized}
      onClose={onClose}
      /* Minimize collapses the viewer away — ephemeral, no dock tab. */
      onMinimize={onClose}
      onToggleMaximize={() => setMaximized((m) => !m)}
    >
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
        <img
          key={swapId}
          src={currentSrc}
          alt={`${name} screenshot ${active + 1} of ${count}`}
          className="animate-pixel-fade max-h-full max-w-full object-contain"
          draggable={false}
        />

        {/* Purple edge ring */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-purple-400/20"
        />

        {/* Counter badge */}
        <div className="pointer-events-none absolute left-3 top-3 rounded-sm border border-zinc-700 bg-zinc-900/85 px-2 py-1 font-pixel text-[10px] tracking-wider text-purple-300">
          {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </div>

        {/* Arrows */}
        {multi && (
          <>
            <button
              type="button"
              aria-label={`Previous ${name} screenshot`}
              onClick={() => go(active - 1)}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-900/85 font-pixel text-sm text-zinc-100 transition hover:border-purple-400 hover:bg-zinc-800 hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              <span aria-hidden="true">◄</span>
            </button>
            <button
              type="button"
              aria-label={`Next ${name} screenshot`}
              onClick={() => go(active + 1)}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-900/85 font-pixel text-sm text-zinc-100 transition hover:border-purple-400 hover:bg-zinc-800 hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              <span aria-hidden="true">►</span>
            </button>
          </>
        )}

        {/* Filename caption */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-sm border border-zinc-700 bg-zinc-900/85 px-3 py-1 font-pixel text-[10px] tracking-wider text-zinc-300">
          {filename}.png
        </div>
      </div>
    </Window>,
    document.body
  );
}
