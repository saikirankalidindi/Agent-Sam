import { useAppStore } from '../../store/useAppStore';
import type { Artifact } from '../../store/types';

// ---------------------------------------------------------------------------
// PinnedDocumentItem
// ---------------------------------------------------------------------------

interface PinnedDocumentItemProps {
  artifact: Artifact;
  onOpen: (artifact: Artifact) => void;
}

function PinnedDocumentItem({ artifact, onOpen }: PinnedDocumentItemProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(artifact)}
      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent focus:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-150 cursor-pointer"
    >
      <span className="flex items-center gap-2">
        <span aria-hidden="true">📌</span>
        <span className="text-sm font-medium text-foreground truncate">{artifact.title}</span>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// PinnedDocuments
// ---------------------------------------------------------------------------

export function PinnedDocuments() {
  const pinnedArtifacts = useAppStore((state) => state.pinnedArtifacts);
  const openArtifact = useAppStore((state) => state.openArtifact);

  return (
    <section aria-label="Pinned documents">
      <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Pinned
      </h2>

      {pinnedArtifacts.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">No pinned documents.</p>
      ) : (
        <ul className="flex flex-col gap-0.5 px-1">
          {pinnedArtifacts.map((artifact) => (
            <li key={artifact.id}>
              <PinnedDocumentItem artifact={artifact} onOpen={openArtifact} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
