// ---------------------------------------------------------------------------
// QuickLinks — 3×2 grid of external service shortcuts
// Requirements: 2.1, 2.2, 11.1
// ---------------------------------------------------------------------------

interface QuickLink {
  id: string;
  label: string;
  url: string;
  emoji: string;
}

const QUICK_LINKS: QuickLink[] = [
  { id: 'github',   label: 'Open GitHub',          url: 'https://github.com',              emoji: '🐙' },
  { id: 'calendar', label: 'Open Google Calendar',  url: 'https://calendar.google.com',     emoji: '📅' },
  { id: 'gmail',    label: 'Open Gmail',            url: 'https://mail.google.com',         emoji: '📧' },
  { id: 'drive',    label: 'Open Google Drive',     url: 'https://drive.google.com',        emoji: '📁' },
  { id: 'notion',   label: 'Open Notion',           url: 'https://notion.so',               emoji: '📝' },
  { id: 'slack',    label: 'Open Slack',            url: 'https://slack.com',               emoji: '💬' },
];

// ---------------------------------------------------------------------------
// QuickLinkItem
// ---------------------------------------------------------------------------

interface QuickLinkItemProps {
  link: QuickLink;
}

function QuickLinkItem({ link }: QuickLinkItemProps) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={link.label}
      className="flex items-center justify-center"
    >
      <div className="hover:bg-accent rounded-md p-2 flex items-center justify-center transition-all duration-150 focus-within:ring-2 focus-within:ring-ring w-full h-full">
        <span aria-hidden="true" className="text-lg leading-none">
          {link.emoji}
        </span>
      </div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// QuickLinks
// ---------------------------------------------------------------------------

export function QuickLinks() {
  return (
    <section aria-label="Quick links">
      <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Quick Links
      </h2>

      <div className="grid grid-cols-3 gap-1 px-2 pb-2">
        {QUICK_LINKS.map((link) => (
          <QuickLinkItem key={link.id} link={link} />
        ))}
      </div>
    </section>
  );
}
