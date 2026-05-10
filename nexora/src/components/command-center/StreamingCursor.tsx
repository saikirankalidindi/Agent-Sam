import { useAppStore } from '../../store/useAppStore';

interface StreamingCursorProps {
  messageId: string;
}

export function StreamingCursor({ messageId }: StreamingCursorProps) {
  const isStreaming = useAppStore((state) => state.isStreaming);
  const streamingMessageId = useAppStore((state) => state.streamingMessageId);

  if (!isStreaming || streamingMessageId !== messageId) {
    return null;
  }

  return (
    <span
      className="animate-pulse inline-block w-2 h-4 bg-current ml-1"
      aria-hidden="true"
    />
  );
}
