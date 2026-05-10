import { useState } from 'react';

/**
 * Finds the position of the active slash trigger before the cursor.
 *
 * A slash trigger is valid when:
 *   - There is a '/' character before the cursor
 *   - That '/' is at position 0 OR immediately preceded by a whitespace character
 *   - There is no whitespace between that '/' and the cursor position
 *     (i.e. the partial text typed after '/' is a single unbroken token)
 *
 * Returns the index of the '/' if a valid trigger is found, or -1 otherwise.
 */
function findSlashTriggerPos(value: string, cursorPos: number): number {
  // Walk backwards from the cursor to find the last '/' before any whitespace.
  for (let i = cursorPos - 1; i >= 0; i--) {
    const ch = value[i];

    if (ch === '/') {
      // Valid trigger: '/' is at the start of the string or preceded by whitespace.
      if (i === 0 || /\s/.test(value[i - 1])) {
        return i;
      }
      // '/' exists but is not at a word boundary — not a valid trigger.
      return -1;
    }

    // If we hit whitespace before finding '/', there is no active trigger.
    if (/\s/.test(ch)) {
      return -1;
    }
  }

  return -1;
}

/**
 * Returns `true` iff there is an active slash trigger immediately before the
 * cursor — meaning the character at `cursorPos - 1` is '/' (or there is a '/'
 * followed by non-whitespace partial text) and that '/' is at position 0 or
 * preceded by a whitespace character.
 *
 * Requirement 5.2: The slash menu is shown when the user types "/" preceded by
 * the start of input or a whitespace character.
 */
export function shouldShowSlashMenu(value: string, cursorPos: number): boolean {
  return findSlashTriggerPos(value, cursorPos) !== -1;
}

/**
 * Replaces the slash trigger and any partial text typed after it (from the
 * trigger position up to `cursorPos`) with the selected `command` string.
 * Content before the trigger and after the cursor is preserved unchanged.
 *
 * Requirement 5.3: Selecting a slash command replaces the slash character and
 * any partial text typed after it with the selected command text.
 */
export function replaceSlashCommand(
  value: string,
  cursorPos: number,
  command: string,
): string {
  const triggerPos = findSlashTriggerPos(value, cursorPos);
  if (triggerPos === -1) {
    // No active trigger — return the original value unchanged.
    return value;
  }

  const before = value.slice(0, triggerPos);
  const after = value.slice(cursorPos);
  return before + command + after;
}

/**
 * Custom hook that manages slash-command menu state for the InputBar.
 *
 * Returns:
 *   - `isOpen`          — whether the slash command menu is currently visible
 *   - `selectedIndex`   — the currently highlighted menu item index
 *   - `setIsOpen`       — setter for `isOpen`
 *   - `setSelectedIndex`— setter for `selectedIndex`
 *   - `shouldShowSlashMenu` — pure helper (re-exported for convenience)
 *   - `replaceSlashCommand` — pure helper (re-exported for convenience)
 */
export function useSlashCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  return {
    isOpen,
    selectedIndex,
    setIsOpen,
    setSelectedIndex,
    shouldShowSlashMenu,
    replaceSlashCommand,
  };
}
