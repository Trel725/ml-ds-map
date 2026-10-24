import { useApp } from '../app/StoreContext';
import { Panel } from '../panel/Panel';
import { TourCard } from '../tours/TourCard';
import { ListView } from './ListView';

/** The layout under 768 px: the list, or one full-screen panel with a way back. */
export function SmallScreen() {
  const selection = useApp((s) => s.selection);
  const clearSelection = useApp((s) => s.clearSelection);

  return (
    <div className="small-screen">
      <ListView hidden={selection !== null} />
      {selection && (
        <>
          <button type="button" className="button list-back" onClick={clearSelection}>
            Back to list
          </button>
          <Panel />
        </>
      )}
      <TourCard />
    </div>
  );
}
