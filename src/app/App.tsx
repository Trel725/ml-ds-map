import { useEffect } from 'react';
import { Gallery } from '../gallery/Gallery';
import { SmallScreen } from '../list/SmallScreen';
import { MapView } from '../map/MapView';
import { Panel } from '../panel/Panel';
import { TourCard } from '../tours/TourCard';
import { Notice } from './Notice';
import { useApp, useAppStore } from './StoreContext';
import { TopBar } from './TopBar';
import { SMALL_SCREEN, useMediaQuery } from './useMediaQuery';

export function App() {
  const store = useAppStore();
  const view = useApp((s) => s.view);
  const small = useMediaQuery(SMALL_SCREEN) && view === 'map';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') store.getState().escape();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);

  return (
    <div className={small ? 'app app-small' : 'app'}>
      <TopBar />
      {view === 'gallery' ? (
        <Gallery />
      ) : small ? (
        <SmallScreen />
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
