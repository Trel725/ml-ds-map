import { useEffect } from 'react';
import { Gallery } from '../gallery/Gallery';
import { MapView } from '../map/MapView';
import { Panel } from '../panel/Panel';
import { TourCard } from '../tours/TourCard';
import { Notice } from './Notice';
import { useApp, useAppStore } from './StoreContext';
import { TopBar } from './TopBar';

export function App() {
  const store = useAppStore();
  const view = useApp((s) => s.view);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') store.getState().escape();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);

  return (
    <div className="app">
      <TopBar />
      {view === 'gallery' ? (
        <Gallery />
      ) : (
        <>
          <div className="map-column">
            <MapView />
            <TourCard />
          </div>
          <Panel />
        </>
      )}
      <Notice />
    </div>
  );
}
