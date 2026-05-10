import { useState } from 'react';
import type { ArtifactSection } from '../../store/types';

interface AccordionSectionProps {
  section: ArtifactSection & { type: 'accordion' };
}

/**
 * AccordionSection renders an accordion with `type="multiple"` semantics —
 * all items are open by default and each item can be independently toggled.
 *
 * Requirements: 6.9, 6.10, 11.1, 11.3, 11.6
 */
export function AccordionSection({ section }: AccordionSectionProps) {
  const items = section.accordionItems ?? [];

  // All items open by default (defaultValue = all item IDs)
  const [openItems, setOpenItems] = useState<Set<string>>(
    () => new Set(items.map((i) => i.id)),
  );

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4 text-center">
        No items to display.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border" role="list">
      {items.map((item) => {
        const isOpen = openItems.has(item.id);

        return (
          <div key={item.id} role="listitem" className="py-1">
            {/* Accordion trigger */}
            <button
              type="button"
              role="button"
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
              id={`accordion-trigger-${item.id}`}
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between px-1 py-2 text-sm font-medium text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded transition-all duration-150"
            >
              <span>{item.title}</span>
              {/* Chevron icon rotates on open/close */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={`shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Accordion content */}
            <div
              id={`accordion-content-${item.id}`}
              role="region"
              aria-labelledby={`accordion-trigger-${item.id}`}
              hidden={!isOpen}
              data-state={isOpen ? 'open' : 'closed'}
              className={`overflow-hidden text-sm text-muted-foreground transition-all duration-150 ${
                isOpen
                  ? 'animate-accordion-down'
                  : 'animate-accordion-up'
              }`}
            >
              <p className="px-1 pb-3 pt-1 leading-relaxed">{item.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
