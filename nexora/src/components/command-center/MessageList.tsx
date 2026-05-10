import { useAppStore } from '../../store/useAppStore';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { MessageBubble } from './MessageBubble';

export function MessageList() {
  const activeConversation = useAppStore((s) => s.activeConversation);

  const messages = activeConversation
    ? [...activeConversation.messages].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      )
    : [];

  const { sentinelRef } = useAutoScroll([messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Start a conversation to get started.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={sentinelRef} />
    </div>
  );
}
