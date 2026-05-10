import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { downloadArtifact } from '../../lib/download';
import { ArtifactTabs } from './ArtifactTabs';

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid extra dependencies)
// ---------------------------------------------------------------------------

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/** Filled pin icon — shown when artifact is pinned */
function PinFilledIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2L8 8H4l4 6v6l4-2 4 2v-6l4-6h-4L12 2z" />
    </svg>
  );
}

/** Outline pin icon — shown when artifact is not pinned */
function PinOutlineIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2L8 8H4l4 6v6l4-2 4 2v-6l4-6h-4L12 2z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

/**
 * Canvas is the right-pane container that slides open/closed with a 150ms
 * width transition. It renders the artifact header (title, close, pin,
 * download) and the ArtifactTabs content area.
 *
 * Requirements: 6.1, 6.11, 7.1–7.6, 8.1–8.3
 */
export function Canvas() {
  const isCanvasOpen = useAppStore((s) => s.isCanvasOpen);
  const activeArtifact = useAppStore((s) => s.activeArtifact);
  const closeCanvas = useAppStore((s) => s.closeCanvas);
  const pinArtifact = useAppStore((s) => s.pinArtifact);
  const unpinArtifact = useAppStore((s) => s.unpinArtifact);

  // ── Download error banner ──────────────────────────────────────────────
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleDownloadError() {
      setDownloadError('Download could not be completed.');

      // Auto-dismiss after 5 seconds
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      dismissTimerRef.current = setTimeout(() => {
        setDownloadError(null);
        dismissTimerRef.current = null;
      }, 5000);
    }

    window.addEventListener('downloadError', handleDownloadError);
    return () => {
      window.removeEventListener('downloadError', handleDownloadError);
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  // ── Pin / Unpin handler ────────────────────────────────────────────────
  function handlePinToggle() {
    if (!activeArtifact) return;
    if (activeArtifact.isPinned) {
      unpinArtifact(activeArtifact.id);
    } else {
      pinArtifact(activeArtifact);
    }
  }

  // ── Download handler ───────────────────────────────────────────────────
  function handleDownload() {
    if (!activeArtifact) return;
    downloadArtifact(activeArtifact);
  }

  return (
    <aside
      className="h-full border-l border-border bg-background flex flex-col overflow-hidden"
      style={{
        width: isCanvasOpen ? '420px' : '0px',
        transition: 'width 150ms ease',
        overflow: 'hidden',
      }}
      aria-label="Canvas pane"
      aria-hidden={!isCanvasOpen}
    >
      {isCanvasOpen && activeArtifact && (
        <>
          {/* ── Header bar ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
            {/* Artifact title */}
            <h2 className="text-sm font-semibold text-foreground truncate flex-1 mr-2">
              {activeArtifact.title}
            </h2>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Pin button */}
              <button
                type="button"
                onClick={handlePinToggle}
                aria-label={
                  activeArtifact.isPinned ? 'Unpin artifact' : 'Pin artifact'
                }
                className={[
                  'inline-flex items-center justify-center w-8 h-8 rounded',
                  'transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
                  activeArtifact.isPinned
                    ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {activeArtifact.isPinned ? <PinFilledIcon /> : <PinOutlineIcon />}
              </button>

              {/* Download button */}
              <button
                type="button"
                onClick={handleDownload}
                aria-label="Download artifact"
                className={[
                  'inline-flex items-center justify-center w-8 h-8 rounded',
                  'text-muted-foreground hover:text-foreground',
                  'transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
                ].join(' ')}
              >
                <DownloadIcon />
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={closeCanvas}
                aria-label="Close canvas"
                className={[
                  'inline-flex items-center justify-center w-8 h-8 rounded',
                  'text-muted-foreground hover:text-foreground',
                  'transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
                ].join(' ')}
              >
                <XIcon />
              </button>
            </div>
          </div>

          {/* ── Download error banner ────────────────────────────────── */}
          {downloadError && (
            <div
              role="alert"
              aria-live="assertive"
              className={[
                'mx-3 mt-2 px-3 py-2 rounded text-sm',
                'bg-destructive/10 text-destructive border border-destructive/20',
                'flex items-center justify-between gap-2 shrink-0',
              ].join(' ')}
            >
              <span>{downloadError}</span>
              <button
                type="button"
                onClick={() => setDownloadError(null)}
                aria-label="Dismiss error"
                className="text-destructive hover:opacity-70 transition-opacity duration-150 shrink-0"
              >
                <XIcon />
              </button>
            </div>
          )}

          {/* ── Artifact tabs content ────────────────────────────────── */}
          <div className="flex-1 overflow-hidden">
            <ArtifactTabs artifact={activeArtifact} />
          </div>
        </>
      )}
    </aside>
  );
}
