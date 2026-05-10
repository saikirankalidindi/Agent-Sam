import type { Message } from '../../store/types';
import { StreamingCursor } from './StreamingCursor';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={isAssistant ? 'flex justify-start' : 'flex justify-end'}>
      <div
        className={
          isAssistant
            ? 'bg-slate-50 dark:bg-slate-800 rounded-xl p-3 max-w-[80%] transition-all duration-150'
            : 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl p-3 max-w-[80%] transition-all duration-150'
        }
      >
        <span>{message.content}</span>
        {isAssistant && <StreamingCursor messageId={message.id} />}
      </div>
    </div>
  );
}
