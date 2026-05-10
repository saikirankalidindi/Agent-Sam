/**
 * Unit tests for Library sidebar components.
 * Requirements: 2.3, 2.4, 2.5, 2.6, 2.8
 *
 * Uses the real Zustand store with test-controlled state (no mocking).
 * State is reset before each test via useAppStore.setState(…).
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RecentConversations } from '../components/library/RecentConversations';
import { PinnedDocuments } from '../components/library/PinnedDocuments';
import { UserProfile } from '../components/library/UserProfile';
import { useAppStore } from '../store/useAppStore';
import type { Artifact, Conversation } from '../store/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  const id = overrides.id ?? `conv-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    title: overrides.title ?? `Conversation ${id}`,
    messages: overrides.messages ?? [],
    createdAt: overrides.createdAt ?? new Date('2025-01-01T00:00:00Z'),
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01T00:00:00Z'),
  };
}

function makeArtifact(overrides: Partial<Artifact> = {}): Artifact {
  const id = overrides.id ?? `artifact-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    title: overrides.title ?? `Artifact ${id}`,
    sections: overrides.sections ?? [],
    generatedAt: overrides.generatedAt ?? new Date('2025-01-01T00:00:00Z'),
    isPinned: overrides.isPinned ?? true,
  };
}

// ---------------------------------------------------------------------------
// Reset store state before each test so mock seed data doesn't bleed through
// ---------------------------------------------------------------------------

beforeEach(() => {
  useAppStore.setState({
    conversations: [],
    activeConversation: null,
    pinnedArtifacts: [],
    user: null,
  });
});

afterEach(() => {
  // Clean up any DOM side-effects
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// RecentConversations
// ---------------------------------------------------------------------------

describe('RecentConversations', () => {
  it('renders empty state when conversations array is empty (Req 2.3)', () => {
    render(<RecentConversations />);
    expect(screen.getByText('No recent conversations.')).toBeInTheDocument();
  });

  it('renders conversation titles when conversations exist (Req 2.3)', () => {
    const convs = [makeConversation({ title: 'Alpha' }), makeConversation({ title: 'Beta' })];
    useAppStore.setState({ conversations: convs });

    render(<RecentConversations />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders at most 10 conversations when given more than 10 (Req 2.3)', () => {
    const convs = Array.from({ length: 15 }, (_, i) =>
      makeConversation({
        id: `conv-${i}`,
        title: `Conversation ${i}`,
        updatedAt: new Date(Date.now() - i * 1000),
      }),
    );
    useAppStore.setState({ conversations: convs });

    render(<RecentConversations />);

    // Each conversation renders as a button; count them
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeLessThanOrEqual(10);
  });

  it('clicking a conversation calls store.loadConversation with the correct id (Req 2.4)', async () => {
    const user = userEvent.setup();
    const conv = makeConversation({ id: 'target-conv', title: 'Target Conversation' });
    useAppStore.setState({ conversations: [conv] });

    render(<RecentConversations />);

    await user.click(screen.getByText('Target Conversation'));

    // After clicking, the store's activeConversation should be set to the clicked conversation
    const { activeConversation } = useAppStore.getState();
    expect(activeConversation?.id).toBe('target-conv');
  });

  it('does not show an error message when load succeeds (Req 2.4)', async () => {
    const user = userEvent.setup();
    const conv = makeConversation({ id: 'ok-conv', title: 'OK Conversation' });
    useAppStore.setState({ conversations: [conv] });

    render(<RecentConversations />);

    await user.click(screen.getByText('OK Conversation'));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PinnedDocuments
// ---------------------------------------------------------------------------

describe('PinnedDocuments', () => {
  it('renders empty state when pinnedArtifacts array is empty (Req 2.5)', () => {
    render(<PinnedDocuments />);
    expect(screen.getByText('No pinned documents.')).toBeInTheDocument();
  });

  it('renders artifact titles when pinnedArtifacts exist (Req 2.5)', () => {
    const artifacts = [
      makeArtifact({ title: 'Design Doc' }),
      makeArtifact({ title: 'Meeting Notes' }),
    ];
    useAppStore.setState({ pinnedArtifacts: artifacts });

    render(<PinnedDocuments />);

    expect(screen.getByText('Design Doc')).toBeInTheDocument();
    expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
  });

  it('clicking a pinned document calls store.openArtifact with the artifact (Req 2.6)', async () => {
    const user = userEvent.setup();
    const artifact = makeArtifact({ id: 'pinned-1', title: 'My Pinned Doc' });
    useAppStore.setState({ pinnedArtifacts: [artifact] });

    render(<PinnedDocuments />);

    await user.click(screen.getByText('My Pinned Doc'));

    // openArtifact sets isCanvasOpen = true and activeArtifact = artifact
    const { isCanvasOpen, activeArtifact } = useAppStore.getState();
    expect(isCanvasOpen).toBe(true);
    expect(activeArtifact?.id).toBe('pinned-1');
  });

  it('renders all pinned artifacts, not just the first one (Req 2.5)', () => {
    const artifacts = Array.from({ length: 5 }, (_, i) =>
      makeArtifact({ id: `art-${i}`, title: `Doc ${i}` }),
    );
    useAppStore.setState({ pinnedArtifacts: artifacts });

    render(<PinnedDocuments />);

    artifacts.forEach((a) => {
      expect(screen.getByText(a.title)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// UserProfile
// ---------------------------------------------------------------------------

describe('UserProfile', () => {
  it('renders nothing when user is null', () => {
    useAppStore.setState({ user: null });
    const { container } = render(<UserProfile />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an <img> when avatarUrl is present (Req 2.7)', () => {
    useAppStore.setState({
      user: { id: 'u1', name: 'Alex Johnson', avatarUrl: 'https://example.com/avatar.png' },
    });

    render(<UserProfile />);

    const img = screen.getAllByRole('img')[0];
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');
  });

  it('renders initials fallback when avatarUrl is absent (Req 2.7)', () => {
    useAppStore.setState({
      user: { id: 'u2', name: 'Alex Johnson' },
    });

    render(<UserProfile />);

    // No img element should be present in the profile row
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    // Initials "AJ" should be visible
    expect(screen.getByText('AJ')).toBeInTheDocument();
  });

  it('renders single-word name initials correctly (Req 2.7)', () => {
    useAppStore.setState({
      user: { id: 'u3', name: 'Cher' },
    });

    render(<UserProfile />);

    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('settings icon button is present and opens settings panel on click (Req 2.8)', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      user: { id: 'u4', name: 'Sam Lee' },
    });

    render(<UserProfile />);

    const settingsBtn = screen.getByRole('button', { name: /open settings/i });
    expect(settingsBtn).toBeInTheDocument();

    await user.click(settingsBtn);

    // After clicking, the settings dialog/panel should be visible
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument();
  });

  it('settings panel can be closed via the close button (Req 2.8)', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      user: { id: 'u5', name: 'Sam Lee' },
    });

    render(<UserProfile />);

    // Open settings
    await user.click(screen.getByRole('button', { name: /open settings/i }));
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument();

    // Close settings
    await user.click(screen.getByRole('button', { name: /close settings/i }));
    expect(screen.queryByRole('dialog', { name: /settings/i })).not.toBeInTheDocument();
  });
});
