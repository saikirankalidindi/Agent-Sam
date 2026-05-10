/**
 * Unit tests for Canvas components
 * Requirements: 6.1, 6.3, 6.7, 6.8, 7.1, 7.6, 8.1, 8.2
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Canvas } from '../components/canvas/Canvas';
import { ArtifactTabs } from '../components/canvas/ArtifactTabs';
import { MarkdownSection } from '../components/canvas/MarkdownSection';
import { useAppStore } from '../store/useAppStore';
import type { Artifact, ArtifactSection } from '../store/types';

// ---------------------------------------------------------------------------
// Helper: mockArtifact factory
// ---------------------------------------------------------------------------

let _artifactCounter = 0;

function mockArtifact(overrides: Partial<Artifact> = {}): Artifact {
  _artifactCounter += 1;
  return {
    id: `test-artifact-${_artifactCounter}`,
    title: `Test Artifact ${_artifactCounter}`,
    isPinned: false,
    generatedAt: new Date('2025-01-01T00:00:00Z'),
    sections: [
      {
        id: `section-md-${_artifactCounter}`,
        title: 'Overview',
        type: 'markdown',
        markdownContent: '## Hello\n\nThis is **markdown** content.',
      },
      {
        id: `section-checklist-${_artifactCounter}`,
        title: 'Tasks',
        type: 'checklist',
        checklistItems: [
          { id: 'item-1', text: 'First task', checked: false },
          { id: 'item-2', text: 'Second task', checked: true },
        ],
      },
    ],
    ...overrides,
  };
}

function mockMarkdownSection(overrides: Partial<ArtifactSection> = {}): ArtifactSection {
  return {
    id: 'md-section-1',
    title: 'Overview',
    type: 'markdown',
    markdownContent: '## Hello\n\nThis is **markdown** content.',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset store state before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  useAppStore.setState({
    isCanvasOpen: false,
    activeArtifact: null,
    pinnedArtifacts: [],
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Canvas — open / close behaviour (Requirements 6.1, 8.1, 8.2)
// ---------------------------------------------------------------------------

describe('Canvas — open/close behaviour', () => {
  it('renders with width 0 (not visible) when isCanvasOpen is false', () => {
    useAppStore.setState({ isCanvasOpen: false, activeArtifact: null });
    render(<Canvas />);

    const aside = screen.getByRole('complementary', { hidden: true });
    expect(aside).toHaveStyle({ width: '0px' });
  });

  it('renders artifact content when isCanvasOpen is true and activeArtifact is set', () => {
    const artifact = mockArtifact();
    useAppStore.setState({ isCanvasOpen: true, activeArtifact: artifact });
    render(<Canvas />);

    expect(screen.getByText(artifact.title)).toBeInTheDocument();
  });

  it('close button click calls store.closeCanvas (sets isCanvasOpen to false)', async () => {
    const artifact = mockArtifact();
    useAppStore.setState({ isCanvasOpen: true, activeArtifact: artifact });
    render(<Canvas />);

    const closeBtn = screen.getByRole('button', { name: /close canvas/i });
    await userEvent.click(closeBtn);

    expect(useAppStore.getState().isCanvasOpen).toBe(false);
  });

  it('slides open (width 420px) when isCanvasOpen is true', () => {
    const artifact = mockArtifact();
    useAppStore.setState({ isCanvasOpen: true, activeArtifact: artifact });
    render(<Canvas />);

    const aside = screen.getByRole('complementary');
    expect(aside).toHaveStyle({ width: '420px' });
  });
});

// ---------------------------------------------------------------------------
// ArtifactTabs — tab rendering and active tab accent (Requirement 6.3)
// ---------------------------------------------------------------------------

describe('ArtifactTabs — tab rendering', () => {
  it('renders one tab per section', () => {
    const artifact = mockArtifact();
    render(<ArtifactTabs artifact={artifact} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(artifact.sections.length);
  });

  it('renders tab labels matching section titles', () => {
    const artifact = mockArtifact();
    render(<ArtifactTabs artifact={artifact} />);

    for (const section of artifact.sections) {
      expect(screen.getByRole('tab', { name: section.title })).toBeInTheDocument();
    }
  });

  it('first tab is active by default (aria-selected=true)', () => {
    const artifact = mockArtifact();
    render(<ArtifactTabs artifact={artifact} />);

    const firstTab = screen.getByRole('tab', { name: artifact.sections[0].title });
    expect(firstTab).toHaveAttribute('aria-selected', 'true');
  });

  it('active tab has indigo accent class', () => {
    const artifact = mockArtifact();
    render(<ArtifactTabs artifact={artifact} />);

    const firstTab = screen.getByRole('tab', { name: artifact.sections[0].title });
    expect(firstTab.className).toMatch(/text-indigo-600/);
    expect(firstTab.className).toMatch(/border-indigo-600/);
  });

  it('inactive tabs do not have indigo accent class', () => {
    const artifact = mockArtifact();
    render(<ArtifactTabs artifact={artifact} />);

    const secondTab = screen.getByRole('tab', { name: artifact.sections[1].title });
    expect(secondTab).toHaveAttribute('aria-selected', 'false');
    expect(secondTab.className).not.toMatch(/text-indigo-600/);
  });

  it('clicking a tab switches the active content', async () => {
    const artifact = mockArtifact();
    render(<ArtifactTabs artifact={artifact} />);

    const secondTab = screen.getByRole('tab', { name: artifact.sections[1].title });
    await userEvent.click(secondTab);

    expect(secondTab).toHaveAttribute('aria-selected', 'true');

    const firstTab = screen.getByRole('tab', { name: artifact.sections[0].title });
    expect(firstTab).toHaveAttribute('aria-selected', 'false');
  });

  it('renders "No sections available." when artifact has no sections', () => {
    const artifact = mockArtifact({ sections: [] });
    render(<ArtifactTabs artifact={artifact} />);

    expect(screen.getByText('No sections available.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MarkdownSection — render / edit mode (Requirements 6.7, 6.8)
// ---------------------------------------------------------------------------

describe('MarkdownSection — render and edit mode', () => {
  beforeEach(() => {
    // Ensure store has an active artifact so updateArtifactSection works
    const artifact: Artifact = {
      id: 'artifact-md-test',
      title: 'MD Test Artifact',
      isPinned: false,
      generatedAt: new Date(),
      sections: [mockMarkdownSection()],
    };
    useAppStore.setState({ isCanvasOpen: true, activeArtifact: artifact });
  });

  it('renders markdown content in render mode (no textarea visible)', () => {
    const section = mockMarkdownSection();
    render(<MarkdownSection section={section} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    // The rendered HTML should contain the heading text
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('clicking the rendered area switches to edit mode (textarea appears)', async () => {
    const section = mockMarkdownSection();
    render(<MarkdownSection section={section} />);

    // Click the rendered div to enter edit mode
    const renderedDiv = screen.getByText('Hello').closest('div');
    expect(renderedDiv).not.toBeNull();
    await userEvent.click(renderedDiv!);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('blurring the textarea returns to render mode', async () => {
    const section = mockMarkdownSection();
    render(<MarkdownSection section={section} />);

    // Enter edit mode
    const renderedDiv = screen.getByText('Hello').closest('div');
    await userEvent.click(renderedDiv!);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();

    // Blur the textarea to exit edit mode
    fireEvent.blur(textarea);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('textarea contains the original markdown content when in edit mode', async () => {
    const section = mockMarkdownSection({
      markdownContent: '## Hello\n\nThis is **markdown** content.',
    });
    render(<MarkdownSection section={section} />);

    const renderedDiv = screen.getByText('Hello').closest('div');
    await userEvent.click(renderedDiv!);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('## Hello\n\nThis is **markdown** content.');
  });
});

// ---------------------------------------------------------------------------
// Canvas — Pin button icon toggle (Requirement 7.1)
// ---------------------------------------------------------------------------

describe('Canvas — pin button icon', () => {
  it('shows outline pin icon (aria-label "Pin artifact") when artifact is not pinned', () => {
    const artifact = mockArtifact({ isPinned: false });
    useAppStore.setState({ isCanvasOpen: true, activeArtifact: artifact });
    render(<Canvas />);

    const pinBtn = screen.getByRole('button', { name: /pin artifact/i });
    expect(pinBtn).toBeInTheDocument();
    // The SVG inside should have fill="none" (outline icon)
    const svg = pinBtn.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
  });

  it('shows filled pin icon (aria-label "Unpin artifact") when artifact is pinned', () => {
    const artifact = mockArtifact({ isPinned: true });
    useAppStore.setState({
      isCanvasOpen: true,
      activeArtifact: artifact,
      pinnedArtifacts: [artifact],
    });
    render(<Canvas />);

    const pinBtn = screen.getByRole('button', { name: /unpin artifact/i });
    expect(pinBtn).toBeInTheDocument();
    // The SVG inside should have fill="currentColor" (filled icon)
    const svg = pinBtn.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'currentColor');
  });

  it('clicking pin button on unpinned artifact updates to pinned state', async () => {
    const artifact = mockArtifact({ isPinned: false });
    useAppStore.setState({ isCanvasOpen: true, activeArtifact: artifact });
    render(<Canvas />);

    const pinBtn = screen.getByRole('button', { name: /pin artifact/i });
    await userEvent.click(pinBtn);

    expect(useAppStore.getState().activeArtifact?.isPinned).toBe(true);
    expect(useAppStore.getState().pinnedArtifacts).toHaveLength(1);
  });

  it('clicking pin button on pinned artifact updates to unpinned state', async () => {
    const artifact = mockArtifact({ isPinned: true });
    useAppStore.setState({
      isCanvasOpen: true,
      activeArtifact: artifact,
      pinnedArtifacts: [artifact],
    });
    render(<Canvas />);

    const pinBtn = screen.getByRole('button', { name: /unpin artifact/i });
    await userEvent.click(pinBtn);

    expect(useAppStore.getState().activeArtifact?.isPinned).toBe(false);
    expect(useAppStore.getState().pinnedArtifacts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Canvas — Download failure toast (Requirement 7.6)
// ---------------------------------------------------------------------------

describe('Canvas — download failure toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows error banner when downloadError event is dispatched', async () => {
    const artifact = mockArtifact();
    useAppStore.setState({ isCanvasOpen: true, activeArtifact: artifact });
    render(<Canvas />);

    act(() => {
      window.dispatchEvent(new CustomEvent('downloadError'));
    });

    expect(
      screen.getByText('Download could not be completed.'),
    ).toBeInTheDocument();
  });

  it('error banner has role="alert" for accessibility', async () => {
    const artifact = mockArtifact();
    useAppStore.setState({ isCanvasOpen: true, activeArtifact: artifact });
    render(<Canvas />);

    act(() => {
      window.dispatchEvent(new CustomEvent('downloadError'));
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('error banner auto-dismisses after 5 seconds', async () => {
    const artifact = mockArtifact();
    useAppStore.setState({ isCanvasOpen: true, activeArtifact: artifact });
    render(<Canvas />);

    act(() => {
      window.dispatchEvent(new CustomEvent('downloadError'));
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('error banner is still visible before 5 seconds elapse', async () => {
    const artifact = mockArtifact();
    useAppStore.setState({ isCanvasOpen: true, activeArtifact: artifact });
    render(<Canvas />);

    act(() => {
      window.dispatchEvent(new CustomEvent('downloadError'));
    });

    act(() => {
      vi.advanceTimersByTime(4999);
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('dismiss button manually closes the error banner', async () => {
    const artifact = mockArtifact();
    useAppStore.setState({ isCanvasOpen: true, activeArtifact: artifact });
    render(<Canvas />);

    act(() => {
      window.dispatchEvent(new CustomEvent('downloadError'));
    });

    const dismissBtn = screen.getByRole('button', { name: /dismiss error/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
