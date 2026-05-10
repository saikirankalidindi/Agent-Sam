import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Theme } from '../store/types';

const STORAGE_KEY = 'nexora-theme';

/**
 * Reads the persisted theme from localStorage.
 * Returns 'dark' only when the stored value is exactly 'dark'.
 * Defaults to 'light' for any other value (including null, undefined, or
 * arbitrary strings). Wrapped in try/catch for private-browsing safety.
 */
export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    // localStorage unavailable (e.g. private browsing, security restrictions)
    return 'light';
  }
}

/**
 * Custom hook that provides theme read/write functionality.
 *
 * - Reads from and writes to the Zustand store.
 * - Syncs `document.documentElement.classList` ('dark' class) on every theme change.
 * - Persists the current theme to localStorage on every theme change.
 * - On first render, initialises the store's theme from localStorage if it
 *   hasn't already been set to 'dark' by the blocking pre-load script.
 *
 * Returns { theme, setTheme, toggleTheme }.
 */
export function useTheme() {
  const theme = useAppStore((state) => state.theme);
  const setThemeInStore = useAppStore((state) => state.setTheme);

  // On first render, sync the store with the persisted value so that the
  // Zustand state matches whatever the pre-load script applied to <html>.
  useEffect(() => {
    const initial = getInitialTheme();
    if (initial !== theme) {
      setThemeInStore(initial);
    }
    // Only run once on mount — intentionally omitting `theme` from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync document class and localStorage whenever theme changes.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable — silently ignore.
    }
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeInStore(next);
  };

  const toggleTheme = () => {
    setThemeInStore(theme === 'dark' ? 'light' : 'dark');
  };

  return { theme, setTheme, toggleTheme };
}
