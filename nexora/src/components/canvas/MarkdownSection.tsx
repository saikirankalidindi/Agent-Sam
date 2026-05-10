import React, { Component, useState } from 'react';
import { renderMarkdown } from '../../lib/markdown';
import { useAppStore } from '../../store/useAppStore';
import type { ArtifactSection } from '../../store/types';

// ---------------------------------------------------------------------------
// Error Boundary
// ---------------------------------------------------------------------------

interface MarkdownErrorBoundaryProps {
  rawContent: string;
  children: React.ReactNode;
}

interface MarkdownErrorBoundaryState {
  hasError: boolean;
}

class MarkdownErrorBoundary extends Component<
  MarkdownErrorBoundaryProps,
  MarkdownErrorBoundaryState
> {
  constructor(props: MarkdownErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): MarkdownErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return <pre>{this.props.rawContent}</pre>;
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// MarkdownSection
// ---------------------------------------------------------------------------

interface MarkdownSectionProps {
  section: ArtifactSection;
}

export function MarkdownSection({ section }: MarkdownSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const store = useAppStore();

  if (isEditing) {
    return (
      <textarea
        className="w-full min-h-[200px] p-2 font-mono text-sm border rounded focus:ring-2 focus:ring-indigo-600 transition-all duration-150"
        defaultValue={section.markdownContent ?? ''}
        onBlur={(e) => {
          store.updateArtifactSection(section.id, { markdownContent: e.target.value });
          setIsEditing(false);
        }}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
      />
    );
  }

  return (
    <MarkdownErrorBoundary rawContent={section.markdownContent ?? ''}>
      <div
        className="prose dark:prose-invert max-w-none cursor-pointer p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-150"
        onClick={() => setIsEditing(true)}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(section.markdownContent ?? '') }}
      />
    </MarkdownErrorBoundary>
  );
}
