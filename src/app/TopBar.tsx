import { Breadcrumb } from './Breadcrumb';
import { LensChips } from './LensChips';
import { Search } from './Search';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  return (
    <header className="topbar">
      <h1>ML Concept Map</h1>
      <Search />
      <Breadcrumb />
      <LensChips />
      <div className="topbar-spacer" />
      <ThemeToggle />
    </header>
  );
}
