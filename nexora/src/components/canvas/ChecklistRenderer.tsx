import { useAppStore } from '../../store/useAppStore';
import type { ArtifactSection } from '../../store/types';

interface ChecklistRendererProps {
  section: ArtifactSection & { type: 'checklist' };
}

export function ChecklistRenderer({ section }: ChecklistRendererProps) {
  const toggleChecklistItem = useAppStore((state) => state.toggleChecklistItem);

  return (
    <ul className="flex flex-col gap-1 py-2" role="list">
      {(section.checklistItems ?? []).map((item) => (
        <li key={item.id}>
          <label className="flex items-center gap-2 cursor-pointer transition-all duration-150">
            <input
              type="checkbox"
              role="checkbox"
              aria-checked={item.checked}
              checked={item.checked}
              onChange={() => toggleChecklistItem(section.id, item.id)}
              className="accent-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-150"
            />
            <span
              className={
                item.checked
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground'
              }
            >
              {item.text}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
