import { useEffect, useRef } from 'react';
import { useApp } from '../app/StoreContext';
import { Panel } from '../panel/Panel';
import { TourCard } from '../tours/TourCard';
import { ListView } from './ListView';

/** The layout under 768 px: the list, or one full-screen panel with a way back. */
export function SmallScreen() {
  const selection = useApp((s) => s.selection);
  const clearSelection = useApp((s) => s.clearSelection);
  const open = selection !== null;
  const backRef = useRef<HTMLButtonElement>(null);

  // The tapped item is hidden with the list, so focus moves to the way back instead of dropping to the page.
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    if (!active || active === document.body || active.closest('[data-testid="list-view"]')) backRef.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <div className="small-screen">
      <ListView hidden={selection !== null} />
      {selection && (
        <>
          <button type="button" className="button list-back" onClick={clearSelection} ref={backRef}>
            Back to list
          </button>
          <Panel />
        </>
      )}
      <TourCard />
    </div>
  );
}
