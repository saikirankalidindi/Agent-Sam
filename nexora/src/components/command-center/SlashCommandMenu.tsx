import { useEffect, useRef } from 'react';

/**
 * The four available slash commands.
 */
const SLASH_COMMANDS = ['/task', '/note', '/link', '/search'] as const;

export interface SlashCommandMenuProps {
  /** Whether the menu is currently visible. */
  isOpen: boolean;
  /** Called with the selected command string when the user picks an item. */
  onSelect: (command: string) => void;
  /** Called when the menu should be dismissed (Escape key or outside click). */
  onClose: () => void;
  /** Ref to the InputBar textarea so focus can be returned on dismiss. */
  inputRef: React.RefObject<HTMLTextAreaElement>;
  /** The currently highlighted item index (0-based). */
  selectedIndex: number;
  /** Setter for the highlighted item index. */
  setSelectedIndex: (index: number) => void;
}

/**
 * SlashCommandMenu
 *
 * A keyboard-navigable listbox that appears above the InputBar when the user
 * types a "/" trigger. It lists the four available slash commands and supports:
 *
 * - ArrowDown / ArrowUp  — move the highlighted item
 * - Enter                — select the highlighted item
 * - Escape               — dismiss the menu and return focus to the InputBar
 * - Click outside        — dismiss the menu
 *
 * Accessibility:
 *   - Container: role="listbox" aria-label="Slash commands"
 *   - Items:     role="option"  aria-selected={index === selectedIndex}
 *
 * Requirements: 5.2, 5.3, 11.1, 11.5
 */
export function SlashCommandMenu({
  isOpen,
  onSelect,
  onClose,
  inputRef,
  selectedIndex,
  setSelectedIndex,
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Focus the highlighted item whenever selectedIndex changes while the menu
  // is open, so keyboard users get a visible focus indicator.
  useEffect(() => {
    if (!isOpen) return;
    itemRefs.current[selectedIndex]?.focus();
  }, [isOpen, selectedIndex]);

  // Dismiss the menu when the user clicks outside of it.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onClose]);

  // Handle keyboard navigation within the menu.
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        setSelectedIndex((selectedIndex + 1) % SLASH_COMMANDS.length);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        setSelectedIndex(
          (selectedIndex - 1 + SLASH_COMMANDS.length) % SLASH_COMMANDS.length,
        );
        break;
      }
      case 'Enter': {
        event.preventDefault();
        onSelect(SLASH_COMMANDS[selectedIndex]);
        break;
      }
      case 'Escape': {
        event.preventDefault();
        onClose();
        // Return focus to the InputBar (Requirement 11.5).
        inputRef.current?.focus();
        break;
      }
      default:
        break;
    }
  }

  if (!isOpen) return null;

  return (
    /**
     * Positioned absolutely so the parent (InputBar wrapper) can anchor it
     * above the textarea. The parent must have `position: relative`.
     *
     * `transition-all duration-150` is applied on hover/focus states of items
     * per Requirement 1.5 / 10.2.
     */
    <div
      ref={menuRef}
      role="listbox"
      aria-label="Slash commands"
      onKeyDown={handleKeyDown}
      className={[
        'absolute bottom-full left-0 z-50 mb-1',
        'w-48 rounded-lg border border-border bg-background shadow-lg',
        'overflow-hidden',
        'focus-within:ring-2 focus-within:ring-indigo-600 dark:focus-within:ring-indigo-400',
      ].join(' ')}
    >
      {SLASH_COMMANDS.map((command, index) => {
        const isSelected = index === selectedIndex;

        return (
          <button
            key={command}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(command)}
            className={[
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
              'transition-all duration-150',
              'focus:outline-none',
              isSelected
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
              'focus-visible:bg-indigo-50 focus-visible:text-indigo-700',
              'dark:focus-visible:bg-indigo-900/40 dark:focus-visible:text-indigo-300',
            ].join(' ')}
          >
            {/* Slash icon */}
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400"
            >
              /
            </span>
            {/* Command label — strip the leading "/" for display */}
            <span className="font-medium">{command.slice(1)}</span>
          </button>
        );
      })}
    </div>
  );
}
