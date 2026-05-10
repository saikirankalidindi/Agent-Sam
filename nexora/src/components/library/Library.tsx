// Library.tsx — Left sidebar container
// Composes QuickLinks, RecentConversations, PinnedDocuments, UserProfile
// Requirements: 2.1–2.8

import { QuickLinks } from './QuickLinks';
import { RecentConversations } from './RecentConversations';
import { PinnedDocuments } from './PinnedDocuments';
import { UserProfile } from './UserProfile';

export function Library() {
  return (
    <aside
      className="flex flex-col h-full overflow-y-auto border-r border-border bg-background"
      style={{ width: 'var(--library-width)' }}
    >
      {/* Quick links grid at the top */}
      <QuickLinks />

      <hr className="border-border" />

      {/* Recent conversations — takes remaining vertical space */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <RecentConversations />
      </div>

      <hr className="border-border" />

      {/* Pinned documents */}
      <PinnedDocuments />

      <hr className="border-border" />

      {/* User profile pinned to the bottom */}
      <div className="mt-auto">
        <UserProfile />
      </div>
    </aside>
  );
}
