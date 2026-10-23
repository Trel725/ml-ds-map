import { useEffect } from 'react';
import { MapView } from '../map/MapView';
import { Notice } from './Notice';
import { useAppStore } from './StoreContext';
import { TopBar } from './TopBar';

export function App() {
  const store = useAppStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') store.getState().clearSelection();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);

  return (
    <div className="app">
      <TopBar />
      <MapView />
      <aside className="panel-area" aria-label="Details" />
      <Notice />
    </div>
  );
}
