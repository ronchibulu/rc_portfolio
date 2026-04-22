/**
 * ContactDialog.tsx
 *
 * Contact window opened from the desktop CONTACT folder icon or via the
 * "Contact" header anchor (NavTransition → $osIntent). Surfaces the same
 * contact channels as the site Footer (LinkedIn + email) inside an OS-style
 * window so the nav link has a real destination while OSScreen is active.
 */

import Window from '@/components/Window';

interface ContactDialogProps {
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
}

const LINKEDIN_URL = 'https://www.linkedin.com/in/ronald-cheng-833038257';
const EMAIL = 'ronald1122323@gmail.com';
const EMAIL_HREF = `mailto:${EMAIL}?subject=Portfolio`;

export default function ContactDialog({
  open,
  minimized,
  maximized,
  onClose,
  onMinimize,
  onToggleMaximize,
}: ContactDialogProps) {
  if (!open) return null;

  return (
    <Window
      title="CONTACT"
      ariaLabel="Contact information"
      size="md"
      z={40}
      minimized={minimized}
      maximized={maximized}
      onClose={onClose}
      onMinimize={onMinimize}
      onToggleMaximize={onToggleMaximize}
    >
      <div
        data-os-scrollable
        className="flex flex-col gap-6 p-6 font-pixel text-xs text-zinc-300"
      >
        <p className="leading-relaxed text-zinc-500">
          <span className="text-purple-400">&gt;_</span> Reach out anytime. I respond within a day.
        </p>

        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-500">LINKEDIN</dt>
            <dd>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center break-all text-zinc-100 underline decoration-purple-400 decoration-dotted underline-offset-4 transition-colors hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                {LINKEDIN_URL.replace('https://www.', '')}
              </a>
            </dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-zinc-500">EMAIL</dt>
            <dd>
              <a
                href={EMAIL_HREF}
                className="inline-flex min-h-11 items-center break-all text-zinc-100 underline decoration-purple-400 decoration-dotted underline-offset-4 transition-colors hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                {EMAIL}
              </a>
            </dd>
          </div>
        </dl>

        <p className="text-zinc-600">
          <span aria-hidden="true">&gt; </span>
          Resume on request.
        </p>
      </div>
    </Window>
  );
}
