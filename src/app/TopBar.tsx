import { Breadcrumb } from './Breadcrumb';
import { useApp } from './StoreContext';
import { LensChips } from './LensChips';
import { Search } from './Search';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  const view = useApp((s) => s.view);
  const openGallery = useApp((s) => s.openGallery);
  const closeGallery = useApp((s) => s.closeGallery);
  return (
    <header className="topbar">
      <h1>ML Concept Map</h1>
      <Search />
      <Breadcrumb />
      <LensChips />
      <button
        type="button"
        className="button"
        aria-pressed={view === 'gallery'}
        onClick={() => (view === 'gallery' ? closeGallery() : openGallery())}
      >
        Gallery
      </button>
      <div className="topbar-spacer" />
      <ThemeToggle />
    </header>
  );
}
