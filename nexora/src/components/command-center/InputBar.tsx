import { useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useSlashCommand } from '../../hooks/useSlashCommand';
import { SlashCommandMenu } from './SlashCommandMenu';

// ---------------------------------------------------------------------------
// Pure exported functions (required for property-based testing)
// ---------------------------------------------------------------------------

/**
 * Computes the number of visible rows for the textarea.
 * Caps at 6 rows; beyond 6 lines a scrollbar is shown.
 *
 * Property 11: Input Bar Row Capping
 * Validates: Requirements 5.1
 */
export function computeRows(lineCount: number): number {
  return Math.min(lineCount, 6);
}

/**
 * Returns `true` iff the value contains at least one non-whitespace character.
 * Used to gate the send button and Enter-to-submit behaviour.
 *
 * Property 14: Send Button Disabled on Whitespace Input
 * Validates: Requirements 5.5
 */
export function isSubmittable(value: string): boolean {
  return value.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * InputBar
 *
 * Auto-expanding textarea with slash-command support, attachment picker,
 * web-search toggle, and a send button.
 *
 * Behaviour:
 *   - Textarea expands up to 6 rows; shows scrollbar beyond that.
 *   - Typing "/" at the start of input or after whitespace opens SlashCommandMenu.
 *   - Enter (no Shift) submits when isSubmittable; Shift+Enter inserts newline.
 *   - Attachment button opens the hidden file input.
 *   - Send button is disabled when !isSubmittable(inputValue).
 *
 * Requirements: 5.1–5.7, 11.4
 */
export function InputBar() {
  const inputValue = useAppStore((s) => s.inputValue);
  const setInputValue = useAppStore((s) => s.setInputValue);
  const addMessage = useAppStore((s) => s.addMessage);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track line count for row computation.
  const [lineCount, setLineCount] = useState(1);

  // Web-search toggle state.
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // Slash command hook.
  const {
    isOpen: slashMenuOpen,
    selectedIndex,
    setIsOpen: setSlashMenuOpen,
    setSelectedIndex,
    shouldShowSlashMenu,
    replaceSlashCommand,
  } = useSlashCommand();

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /** Recalculate line count from the current textarea value. */
  function recalcLineCount(value: string) {
    const lines = value.split('\n').length;
    setLineCount(lines);
  }

  /** Submit the current input as a user message. */
  function handleSubmit() {
    if (!isSubmittable(inputValue)) return;

    addMessage({ role: 'user', content: inputValue });
    setInputValue('');
    setLineCount(1);
    setSlashMenuOpen(false);
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setInputValue(value);
    recalcLineCount(value);

    // Show/hide slash command menu based on cursor position.
    const cursorPos = event.target.selectionStart ?? value.length;
    setSlashMenuOpen(shouldShowSlashMenu(value, cursorPos));
    // Reset selection to first item whenever menu (re-)opens.
    setSelectedIndex(0);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Shift+Enter → insert newline (default behaviour, do nothing).
    if (event.key === 'Enter' && event.shiftKey) {
      return;
    }

    // Enter (no Shift) → submit if submittable.
    if (event.key === 'Enter' && !event.shiftKey) {
      if (isSubmittable(inputValue)) {
        event.preventDefault();
        handleSubmit();
      } else {
        // Prevent inserting a newline when there is nothing to submit.
        event.preventDefault();
      }
      return;
    }

    // Escape → close slash menu if open.
    if (event.key === 'Escape' && slashMenuOpen) {
      event.preventDefault();
      setSlashMenuOpen(false);
    }
  }

  function handleSlashSelect(command: string) {
    const cursorPos = textareaRef.current?.selectionStart ?? inputValue.length;
    const newValue = replaceSlashCommand(inputValue, cursorPos, command);
    setInputValue(newValue);
    recalcLineCount(newValue);
    setSlashMenuOpen(false);
    // Return focus to the textarea after selection.
    textareaRef.current?.focus();
  }

  function handleSlashClose() {
    setSlashMenuOpen(false);
    textareaRef.current?.focus();
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const rows = computeRows(lineCount);
  const overflowClass = lineCount > 6 ? 'overflow-y-auto' : 'overflow-y-hidden';

  return (
    /**
     * `relative` so SlashCommandMenu can position itself absolutely above
     * the textarea (bottom-full).
     */
    <div className="relative w-full">
      {/* Slash command menu — rendered above the input bar */}
      <SlashCommandMenu
        isOpen={slashMenuOpen}
        onSelect={handleSlashSelect}
        onClose={handleSlashClose}
        inputRef={textareaRef}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
      />

      {/* Main input container */}
      <div
        className={[
          'flex flex-col gap-2 rounded-xl border border-border bg-background',
          'px-3 py-2 shadow-sm',
          'focus-within:border-indigo-600 dark:focus-within:border-indigo-400',
          'transition-all duration-150',
        ].join(' ')}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          aria-label="Message input"
          rows={rows}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… or / for commands"
          className={[
            'w-full resize-none bg-transparent text-sm text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none',
            overflowClass,
          ].join(' ')}
        />

        {/* Action bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Left actions */}
          <div className="flex items-center gap-1">
            {/* Attachment button */}
            <button
              type="button"
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
              className={[
                'flex h-7 w-7 items-center justify-center rounded-md',
                'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
              ].join(' ')}
            >
              {/* Paperclip SVG icon */}
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
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {/* Web-search toggle */}
            <button
              type="button"
              aria-label={webSearchEnabled ? 'Disable web search' : 'Enable web search'}
              aria-pressed={webSearchEnabled}
              onClick={() => setWebSearchEnabled((prev) => !prev)}
              className={[
                'flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
                webSearchEnabled
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              ].join(' ')}
            >
              {/* Globe SVG icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Web</span>
            </button>
          </div>

          {/* Send button */}
          <button
            type="button"
            aria-label="Send message"
            disabled={!isSubmittable(inputValue)}
            onClick={handleSubmit}
            className={[
              'flex h-7 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white',
              'bg-indigo-600 hover:bg-indigo-700',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1',
            ].join(' ')}
          >
            {/* Send / arrow-up SVG icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* Hidden file input — opened programmatically by the attachment button */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
