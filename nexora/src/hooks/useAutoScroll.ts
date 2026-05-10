import { useEffect, useRef } from 'react';

/**
 * Pure function that determines whether the scroll container is at or near
 * the bottom.
 *
 * Returns `true` iff `(scrollHeight - clientHeight - scrollTop) <= threshold`,
 * meaning the user is within `threshold` pixels of the bottom.
 *
 * @param scrollTop    - Current vertical scroll offset of the container.
 * @param scrollHeight - Total scrollable height of the container.
 * @param clientHeight - Visible height of the container.
 * @param threshold    - Distance from the bottom (in px) that still counts as
 *                       "at the bottom". Defaults to 50.
 */
export function shouldAutoScroll(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  threshold = 50,
): boolean {
  return scrollHeight - clientHeight - scrollTop <= threshold;
}

/**
 * Hook that provides smart auto-scrolling behaviour for a message list.
 *
 * Strategy (sentinel / Intersection Observer approach):
 * - A sentinel `<div>` is placed at the very bottom of the message list.
 * - An `IntersectionObserver` watches the sentinel. When it is visible, the
 *   user is at (or near) the bottom of the list.
 * - Whenever `deps` change (e.g. a new message arrives), if the sentinel was
 *   visible at that moment, the hook scrolls it back into view so the user
 *   always sees the latest message.
 * - If the user has scrolled up (sentinel not visible), no auto-scroll occurs,
 *   preserving their reading position.
 *
 * @param deps - React dependency list. Typically the messages array or its
 *               length. When any dep changes the hook re-evaluates whether to
 *               scroll.
 *
 * @returns `{ sentinelRef }` — attach this ref to a `<div>` placed at the
 *          bottom of the message list.
 *
 * @example
 * ```tsx
 * const { sentinelRef } = useAutoScroll([messages]);
 *
 * return (
 *   <div className="overflow-y-auto flex-1">
 *     {messages.map(m => <MessageBubble key={m.id} message={m} />)}
 *     <div ref={sentinelRef} />
 *   </div>
 * );
 * ```
 */
export function useAutoScroll(deps: React.DependencyList): {
  sentinelRef: React.RefObject<HTMLDivElement>;
} {
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Tracks whether the sentinel is currently intersecting the viewport.
  const isAtBottomRef = useRef<boolean>(true);

  // Set up the IntersectionObserver once on mount.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isAtBottomRef.current = entry.isIntersecting;
      },
      {
        // Use the nearest scrollable ancestor as the root so the sentinel is
        // observed relative to the message list container, not the viewport.
        root: null,
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []); // Only run once — the observer persists for the component lifetime.

  // Scroll to the sentinel whenever deps change, but only if the user was
  // already at the bottom.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isAtBottomRef.current && sentinelRef.current) {
      sentinelRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, deps); // deps is intentionally spread here — this is the caller's list.

  return { sentinelRef };
}
