import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Conversation } from '../../store/types';

// ---------------------------------------------------------------------------
// Relative timestamp helper using Intl.RelativeTimeFormat
// ---------------------------------------------------------------------------

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSeconds) < 60) {
    return rtf.format(diffSeconds, 'second');
  } else if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, 'minute');
  } else if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  } else if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, 'day');
  } else if (Math.abs(diffWeeks) < 5) {
    return rtf.format(diffWeeks, 'week');
  } else if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, 'month');
  } else {
    return rtf.format(diffYears, 'year');
  }
}

// ---------------------------------------------------------------------------
// ConversationItem
// ---------------------------------------------------------------------------

interface ConversationItemProps {
  conversation: Conversation;
  onSelect: (id: string) => void;
}

function ConversationItem({ conversation, onSelect }: ConversationItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent focus:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-150 cursor-pointer"
    >
      <p className="text-sm font-medium text-foreground truncate">{conversation.title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {getRelativeTime(conversation.updatedAt)}
      </p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// RecentConversations
// ---------------------------------------------------------------------------

export function RecentConversations() {
  const conversations = useAppStore((state) => state.conversations);
  const loadConversation = useAppStore((state) => state.loadConversation);

  const [error, setError] = useState<string | null>(null);

  // Sort by updatedAt descending, take first 10
  const recentConversations = [...conversations]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 10);

  async function handleSelect(id: string) {
    setError(null);
    try {
      loadConversation(id);
    } catch {
      setError('Failed to load conversation. Please try again.');
    }
  }

  return (
    <section aria-label="Recent conversations">
      <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recent
      </h2>

      {error && (
        <p role="alert" className="mx-3 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {recentConversations.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">No recent conversations.</p>
      ) : (
        <ul className="flex flex-col gap-0.5 px-1">
          {recentConversations.map((conversation) => (
            <li key={conversation.id}>
              <ConversationItem conversation={conversation} onSelect={handleSelect} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
