import { Breadcrumb } from './Breadcrumb';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  return (
    <header className="topbar">
      <h1>ML Concept Map</h1>
      <Breadcrumb />
      <div className="topbar-spacer" />
      <ThemeToggle />
    </header>
  );
}
