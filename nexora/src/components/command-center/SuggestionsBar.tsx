import React from 'react';
import { useAppStore } from '../../store/useAppStore';

// Suggestion pill data
const PILLS = [
  { label: 'Summarize my day', prompt: 'Summarize my day' },
  { label: 'Review pending tasks', prompt: 'Review my pending tasks and suggest priorities' },
  { label: 'Search my links', prompt: 'Search my saved links' },
  { label: 'Draft an email', prompt: 'Help me draft a professional email' },
  { label: 'Plan my week', prompt: 'Help me plan my week' },
];

interface SuggestionsBarProps {
  /** Optional ref to the InputBar textarea, used to focus it after a pill click */
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

export function SuggestionsBar({ inputRef }: SuggestionsBarProps) {
  const setInputValue = useAppStore((state) => state.setInputValue);

  const handlePillClick = (prompt: string) => {
    setInputValue(prompt);
    inputRef?.current?.focus();
  };

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-border">
      {PILLS.map((pill) => (
        <button
          key={pill.label}
          type="button"
          onClick={() => handlePillClick(pill.prompt)}
          className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:border-indigo-600 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition-all duration-150 whitespace-nowrap"
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}

export default SuggestionsBar;
