import { useCallback, useSyncExternalStore } from 'react';

/** Under 768 px the map gives way to the list view. */
export const SMALL_SCREEN = '(max-width: 767px)';

const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/** Whether the media query matches now; false where `matchMedia` is missing. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!hasMatchMedia()) return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query],
  );
  const get = () => hasMatchMedia() && window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, get, () => false);
}
