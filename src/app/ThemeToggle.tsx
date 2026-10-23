import { useEffect } from 'react';
import type { Theme } from './store';
import { useApp } from './StoreContext';

const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const NAMES: Record<Theme, string> = { system: 'system', light: 'light', dark: 'dark' };

/** Applies the theme to <html> and cycles system → light → dark. */
export function ThemeToggle() {
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  return (
    <button type="button" className="button" onClick={() => setTheme(NEXT[theme])} title={`Switch to ${NAMES[NEXT[theme]]} theme`}>
      Theme: {NAMES[theme]}
    </button>
  );
}
