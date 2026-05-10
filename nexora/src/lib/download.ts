import type { Artifact, ArtifactSection } from '../store/types';

/**
 * Renders a single artifact section's content as a Markdown string.
 */
function renderSectionContent(section: ArtifactSection): string {
  switch (section.type) {
    case 'checklist': {
      const items = section.checklistItems ?? [];
      return items
        .map((item) => `- [${item.checked ? 'x' : ' '}] ${item.text}`)
        .join('\n');
    }
    case 'markdown': {
      return section.markdownContent ?? '';
    }
    case 'accordion': {
      const items = section.accordionItems ?? [];
      return items
        .map((item) => `### ${item.title}\n\n${item.content}`)
        .join('\n\n');
    }
    default: {
      return '';
    }
  }
}

/**
 * Assembles a full Markdown document from an Artifact.
 *
 * Format:
 *   # {artifact.title}
 *
 *   ## {section.title}
 *
 *   {section content}
 *
 *   ---
 *
 */
export function generateMarkdown(artifact: Artifact): string {
  const sectionBlocks = artifact.sections
    .map((section) => {
      const content = renderSectionContent(section);
      return `## ${section.title}\n\n${content}\n\n---`;
    })
    .join('\n\n');

  return `# ${artifact.title}\n\n${sectionBlocks}\n`;
}

/**
 * Derives a safe filename from an artifact title.
 * e.g. "My Cool Artifact" → "my-cool-artifact.md"
 */
function deriveFilename(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-') + '.md';
}

/**
 * Triggers a browser download of the artifact as a Markdown file.
 * On failure, dispatches a `downloadError` CustomEvent on `window`.
 */
export function downloadArtifact(artifact: Artifact): void {
  try {
    const markdown = generateMarkdown(artifact);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = deriveFilename(artifact.title);

    // Append to body, click, then remove — required in some browsers
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  } catch (error) {
    window.dispatchEvent(
      new CustomEvent('downloadError', {
        detail: { error, artifact },
      }),
    );
  }
}
