import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

/**
 * Derives initials from a display name.
 * Takes the first letter of each word, uppercased, capped at 2 characters.
 */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('');
}

export function UserProfile() {
  const user = useAppStore((state) => state.user);
  const [avatarError, setAvatarError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!user) return null;

  const initials = getInitials(user.name);
  const showAvatar = !avatarError && Boolean(user.avatarUrl);

  return (
    <>
      {/* Settings overlay/modal */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-all duration-150"
            onClick={() => setSettingsOpen(false)}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-6 transition-all duration-150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Settings
              </h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {showAvatar ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage your account
                  </p>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-700" />

              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Settings panel — coming soon
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User profile row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Avatar */}
        {showAvatar ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full flex-shrink-0"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-medium flex-shrink-0"
            aria-label={`Avatar for ${user.name}`}
          >
            {initials}
          </div>
        )}

        {/* Name */}
        <span className="flex-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
          {user.name}
        </span>

        {/* Settings button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="rounded-md p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
          aria-label="Open settings"
          title="Settings"
        >
          ⚙️
        </button>
      </div>
    </>
  );
}
