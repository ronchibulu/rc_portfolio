/**
 * Phase 7 — FolderIcon.tsx
 *
 * A single retro desktop folder icon button.
 * Renders a pixel-art SVG folder, a label in Press Start 2P, and handles
 * single-click (reliable on touch via native <button>).
 *
 * Constraints:
 *  - Tap target: min 44×44px (OS-005 / MOBILE-005) — Tailwind h-11=2.75rem=44px
 *  - Single-click only — no onDoubleClick (OS-006)
 *  - Focus visible: purple-400 ring (consistent with project focus style)
 *  - No arbitrary Tailwind values
 */

interface FolderIconProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Aria label for accessibility (defaults to label) */
  ariaLabel?: string;
}

/**
 * Pixel-art folder SVG icon.
 * 64×56px viewBox — folder body + tab in currentColor.
 */
function FolderSvg() {
  return (
    <svg
      width="64"
      height="56"
      viewBox="0 0 64 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Folder tab */}
      <rect x="4" y="4" width="22" height="8" rx="2" fill="currentColor" opacity="0.9" />
      {/* Folder body */}
      <rect x="2" y="10" width="60" height="40" rx="3" fill="currentColor" opacity="0.85" />
      {/* Inner highlight line */}
      <rect x="6" y="14" width="52" height="2" fill="white" opacity="0.12" />
      {/* Pixel shine dots */}
      <rect x="8" y="18" width="2" height="2" fill="white" opacity="0.2" />
      <rect x="12" y="18" width="2" height="2" fill="white" opacity="0.15" />
    </svg>
  );
}

export default function FolderIcon({
  label,
  onClick,
  disabled = false,
  ariaLabel,
}: FolderIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      className="folder-icon-btn group flex min-h-11 w-full max-w-full min-w-11 flex-col items-center gap-2 rounded-sm p-3 text-zinc-400 transition-transform duration-150 hover:scale-105 hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40"
    >
      <FolderSvg />
      <span className="block max-w-full break-normal text-center font-pixel text-xs leading-tight text-zinc-100 group-hover:text-purple-400">
        {label}
      </span>
    </button>
  );
}
