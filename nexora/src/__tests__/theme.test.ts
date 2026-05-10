/**
 * Unit tests for the theme system.
 *
 * @vitest-environment jsdom
 *
 * Validates:
 *   - Requirements 9.1: Theme toggle control
 *   - Requirements 9.2: Dark theme application
 *   - Requirements 9.3: Light theme application
 *   - Requirements 9.4: localStorage persistence and default behaviour
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getInitialTheme } from '../hooks/useTheme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the Zustand store between tests so theme state doesn't bleed across. */
async function resetStore() {
  const { useAppStore } = await import('../store/useAppStore');
  useAppStore.setState({ theme: 'light' });
}

// ---------------------------------------------------------------------------
// getInitialTheme() — pure function tests
// ---------------------------------------------------------------------------

describe('getInitialTheme()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns "dark" when localStorage contains exactly "dark"', () => {
    localStorage.setItem('nexora-theme', 'dark');
    expect(getInitialTheme()).toBe('dark');
  });

  it('returns "light" when localStorage contains exactly "light"', () => {
    localStorage.setItem('nexora-theme', 'light');
    expect(getInitialTheme()).toBe('light');
  });

  it('returns "light" when localStorage has no stored theme (null)', () => {
    // localStorage.clear() already called in beforeEach
    expect(getInitialTheme()).toBe('light');
  });

  it('returns "light" when localStorage contains an arbitrary string', () => {
    localStorage.setItem('nexora-theme', 'system');
    expect(getInitialTheme()).toBe('light');
  });

  it('returns "light" when localStorage contains an empty string', () => {
    localStorage.setItem('nexora-theme', '');
    expect(getInitialTheme()).toBe('light');
  });
});

// ---------------------------------------------------------------------------
// useTheme() hook — DOM and localStorage side-effects
// ---------------------------------------------------------------------------

describe('useTheme() hook', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    await resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds "dark" class to <html> when setTheme("dark") is called', async () => {
    const { useTheme } = await import('../hooks/useTheme');
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes "dark" class from <html> when setTheme("light") is called after dark', async () => {
    const { useTheme } = await import('../hooks/useTheme');

    // Start in dark mode
    document.documentElement.classList.add('dark');
    const { useAppStore } = await import('../store/useAppStore');
    useAppStore.setState({ theme: 'dark' });

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('light');
    });

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists "dark" to localStorage when setTheme("dark") is called', async () => {
    const { useTheme } = await import('../hooks/useTheme');
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(localStorage.getItem('nexora-theme')).toBe('dark');
  });

  it('persists "light" to localStorage when setTheme("light") is called', async () => {
    const { useTheme } = await import('../hooks/useTheme');
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('light');
    });

    expect(localStorage.getItem('nexora-theme')).toBe('light');
  });

  it('does not crash when localStorage.setItem throws (storage unavailable)', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    const { useTheme } = await import('../hooks/useTheme');

    expect(() => {
      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.setTheme('dark');
      });
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

import * as fc from 'fast-check';

// Feature: nexora-command-canvas-ui, Property 23: Theme Initialization from localStorage
describe('Property 23: Theme Initialization from localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it(
    'getInitialTheme returns "dark" iff stored value is exactly "dark"',
    () => {
      // fc.option(fc.string()) generates either null (representing no stored value)
      // or an arbitrary string (representing a stored value).
      fc.assert(
        fc.property(fc.option(fc.string()), (storedValue) => {
          // Arrange: set up localStorage to match the generated value
          localStorage.clear();
          if (storedValue !== null) {
            localStorage.setItem('nexora-theme', storedValue);
          }
          // Act
          const result = getInitialTheme();
          // Assert: 'dark' iff stored value is exactly 'dark'
          const expectedDark = storedValue === 'dark';
          if (expectedDark) {
            return result === 'dark';
          } else {
            return result === 'light';
          }
        }),
        { numRuns: 100 },
      );
    },
  );
});
