/**
 * PixelGallery — pixel-tile thumbnail grid for ProjectDialog.
 *
 * Option B of the gallery design: the main viewer lives in its own
 * ImageViewerWindow (opened on click), NOT inline — keeps the project
 * dialog compact and matches the retro-OS "click file → it opens in
 * its own window" metaphor.
 *
 * Layout:
 *  - Header strip: "SCREENSHOTS (N)" label + hint text.
 *  - Responsive grid: 2 / 3 / 4 columns by breakpoint.
 *  - Each tile: aspect-video image, pixel border, filename caption.
 *  - Click → spawn ImageViewerWindow starting at that index.
 *  - Stagger-in reveal (30ms per tile) on mount.
 *  - Hover: scale 1.03, purple border flash.
 *  - prefers-reduced-motion: stagger + hover scale disabled.
 */

import ImageViewerWindow from '@/components/ImageViewerWindow';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

interface PixelGalleryProps {
  images: string[];
  name: string;
}

function filenameFromSrc(src: string): string {
  const tail = src.split('/').pop() ?? src;
  return tail.replace(/\.[a-zA-Z0-9]+$/, '');
}

export default function PixelGallery({ images, name }: PixelGalleryProps) {
  const reduced = useReducedMotion() ?? false;
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <section aria-label={`${name} screenshots`} className="flex flex-col gap-3">
        {/* Header strip */}
        <div className="flex items-baseline justify-between border-b border-zinc-800 pb-2">
          <h3 className="font-pixel text-[10px] tracking-wider text-purple-400">
            &gt;_ SCREENSHOTS ({String(images.length).padStart(2, '0')})
          </h3>
          <span
            className="hidden font-pixel text-[9px] text-zinc-600 sm:block"
            aria-hidden="true"
          >
            CLICK TO OPEN
          </span>
        </div>

        {/* Thumbnail grid */}
        <ul
          role="list"
          className="grid list-none grid-cols-2 gap-2 p-0 md:grid-cols-3 lg:grid-cols-4"
        >
          {images.map((src, i) => {
            const fname = filenameFromSrc(src);
            return (
              <motion.li
                key={src}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 0.2, delay: i * 0.03, ease: 'easeOut' }
                }
              >
                <motion.button
                  type="button"
                  onClick={() => setViewerIdx(i)}
                  whileHover={reduced ? undefined : { scale: 1.03 }}
                  whileTap={reduced ? undefined : { scale: 0.97 }}
                  aria-label={`Open ${name} ${fname} screenshot (${i + 1} of ${images.length})`}
                  className="group/tile relative block w-full overflow-hidden rounded-sm border border-zinc-700 bg-zinc-950 text-left transition-colors hover:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  {/* Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                    <img
                      src={src}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-85 transition-opacity duration-150 group-hover/tile:opacity-100"
                    />
                    {/* Hover overlay: magnifier glyph */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100"
                    >
                      <span className="rounded-sm border border-purple-400 bg-zinc-950/85 px-2 py-1 font-pixel text-[10px] text-purple-300">
                        [ OPEN ]
                      </span>
                    </div>
                    {/* Index chip */}
                    <span className="pointer-events-none absolute left-1 top-1 rounded-sm border border-zinc-700 bg-zinc-900/85 px-1.5 py-0.5 font-pixel text-[9px] text-zinc-400 group-hover/tile:text-purple-300">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Filename caption */}
                  <div className="flex items-center gap-1 border-t border-zinc-800 bg-zinc-900 px-2 py-1.5">
                    <span
                      aria-hidden="true"
                      className="font-pixel text-[9px] text-purple-400 group-hover/tile:text-yellow-400"
                    >
                      ▸
                    </span>
                    <span className="truncate font-pixel text-[9px] text-zinc-400 group-hover/tile:text-zinc-100">
                      {fname}.png
                    </span>
                  </div>
                </motion.button>
              </motion.li>
            );
          })}
        </ul>
      </section>

      {/* Image viewer — portaled to <body>, stacks above ProjectDialog.
          `key={viewerIdx}` forces a fresh mount when the user clicks a
          different thumb while the viewer is already open, so it jumps to
          the new index instead of staying on the previous one. */}
      {viewerIdx !== null && (
        <ImageViewerWindow
          key={viewerIdx}
          images={images}
          name={name}
          startIndex={viewerIdx}
          onClose={() => setViewerIdx(null)}
        />
      )}
    </>
  );
}
