import { useState } from 'react';
import type { Artifact, ArtifactSection } from '../../store/types';
import { ChecklistRenderer } from './ChecklistRenderer';
import { MarkdownSection } from './MarkdownSection';
import { AccordionSection } from './AccordionSection';

// ---------------------------------------------------------------------------
// Section content renderer
// ---------------------------------------------------------------------------

function SectionContent({ section }: { section: ArtifactSection }) {
  switch (section.type) {
    case 'checklist':
      return (
        <ChecklistRenderer section={section as ArtifactSection & { type: 'checklist' }} />
      );
    case 'markdown':
      return <MarkdownSection section={section} />;
    case 'accordion':
      return (
        <AccordionSection section={section as ArtifactSection & { type: 'accordion' }} />
      );
    default:
      return (
        <p className="text-muted-foreground text-sm py-4 text-center">
          Unknown section type.
        </p>
      );
  }
}

// ---------------------------------------------------------------------------
// ArtifactTabs
// ---------------------------------------------------------------------------

interface ArtifactTabsProps {
  artifact: Artifact;
}

/**
 * ArtifactTabs renders one tab per artifact section.
 * Active tab is highlighted with indigo accent styling.
 * Tab content is rendered based on section.type.
 *
 * Requirements: 6.2, 6.3, 11.1, 11.3, 11.6
 */
export function ArtifactTabs({ artifact }: ArtifactTabsProps) {
  const { sections } = artifact;

  const [activeTab, setActiveTab] = useState<string>(
    () => sections[0]?.id ?? '',
  );

  if (sections.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4 text-center">
        No sections available.
      </p>
    );
  }

  const activeSection = sections.find((s) => s.id === activeTab) ?? sections[0];

  return (
    <div className="flex flex-col h-full">
      {/* Tab list */}
      <div
        role="tablist"
        aria-label={`${artifact.title} sections`}
        className="flex border-b border-border overflow-x-auto shrink-0"
      >
        {sections.map((section) => {
          const isActive = section.id === activeTab;

          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              id={`tab-${section.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${section.id}`}
              onClick={() => setActiveTab(section.id)}
              className={[
                'px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-t',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                  : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent',
              ].join(' ')}
            >
              {section.title}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {sections.map((section) => {
        const isActive = section.id === activeTab;

        return (
          <div
            key={section.id}
            role="tabpanel"
            id={`tabpanel-${section.id}`}
            aria-labelledby={`tab-${section.id}`}
            hidden={!isActive}
            className="flex-1 overflow-y-auto transition-all duration-150"
          >
            {isActive && <SectionContent section={activeSection} />}
          </div>
        );
      })}
    </div>
  );
}
