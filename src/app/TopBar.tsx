import { useEffect, useRef } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { useApp } from './StoreContext';
import { LensChips } from './LensChips';
import { Search } from './Search';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  const view = useApp((s) => s.view);
  const openGallery = useApp((s) => s.openGallery);
  const closeGallery = useApp((s) => s.closeGallery);
  const galleryRef = useRef<HTMLButtonElement>(null);
  const prevView = useRef(view);

  // Leaving the gallery unmounts whatever had focus there; land on the button that opens it again.
  useEffect(() => {
    const left = prevView.current === 'gallery' && view === 'map';
    prevView.current = view;
    if (left && (!document.activeElement || document.activeElement === document.body)) galleryRef.current?.focus();
  }, [view]);
  return (
    <header className="topbar">
      <h1>ML Concept Map</h1>
      <Search />
      <Breadcrumb />
      <LensChips />
      <button
        type="button"
        className="button"
        ref={galleryRef}
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
