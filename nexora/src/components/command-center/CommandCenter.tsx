import { useState } from 'react';
import { Library } from '../library/Library';
import { MessageList } from './MessageList';
import { SuggestionsBar } from './SuggestionsBar';
import { InputBar } from './InputBar';

/**
 * CommandCenter
 *
 * Center-pane container that composes:
 *   - MessageList  (flex-1, scrollable)
 *   - SuggestionsBar (above InputBar)
 *   - InputBar (bottom, padded)
 *
 * Also handles the mobile hamburger menu button and Library overlay
 * for viewports < 768px (Requirement 1.6).
 *
 * Requirements: 3.1–3.8, 4.1–4.6, 5.1–5.7
 */
export function CommandCenter() {
  const [isMobileLibraryOpen, setIsMobileLibraryOpen] = useState(false);

  return (
    <main className="flex flex-col h-full overflow-hidden bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Mobile header — visible only on viewports < 768px                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 border-b border-border p-3 md:hidden">
        <button
          type="button"
          aria-label="Open library menu"
          aria-expanded={isMobileLibraryOpen}
          onClick={() => setIsMobileLibraryOpen(true)}
          className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Hamburger icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
        <span className="text-sm font-medium">Nexora</span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Message list — takes all remaining vertical space                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 min-h-0">
        <MessageList />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Suggestions bar — sits directly above the input bar                 */}
      {/* InputBar manages its own internal textarea ref and does not expose  */}
      {/* it via forwardRef, so inputRef is intentionally omitted here.       */}
      {/* SuggestionsBar's inputRef prop is optional (Requirement 4.3).       */}
      {/* ------------------------------------------------------------------ */}
      <SuggestionsBar />

      {/* ------------------------------------------------------------------ */}
      {/* Input bar — pinned to the bottom with padding                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-4 pb-4 pt-2">
        <InputBar />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile Library overlay — rendered as a fixed Sheet-like panel       */}
      {/* ------------------------------------------------------------------ */}
      {isMobileLibraryOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-hidden="true"
            onClick={() => setIsMobileLibraryOpen(false)}
          />

          {/* Slide-in Library panel */}
          <div
            role="dialog"
            aria-label="Library"
            aria-modal="true"
            className="fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-xl transition-transform duration-150 md:hidden"
          >
            {/* Close button inside the overlay */}
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="text-sm font-medium">Library</span>
              <button
                type="button"
                aria-label="Close library menu"
                onClick={() => setIsMobileLibraryOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* X icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
              </button>
            </div>

            {/* Render the Library component inside the overlay */}
            <div className="h-[calc(100%-3rem)] overflow-y-auto">
              <Library />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
