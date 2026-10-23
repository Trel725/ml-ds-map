import { useEffect } from 'react';
import { MapView } from '../map/MapView';
import { Panel } from '../panel/Panel';
import { TourCard } from '../tours/TourCard';
import { Notice } from './Notice';
import { useAppStore } from './StoreContext';
import { TopBar } from './TopBar';

export function App() {
  const store = useAppStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Escape closes the tour first, then clears the selection.
      const s = store.getState();
      if (s.tour) s.endTour();
      else s.clearSelection();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);

  return (
    <div className="app">
      <TopBar />
      <div className="map-column">
        <MapView />
        <TourCard />
      </div>
      <Panel />
      <Notice />
    </div>
  );
}
