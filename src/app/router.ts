import type { Graph } from '../graph/graph';
import type { AppStore, Selection } from './store';

const HASH = /^#\/([ne])\/([a-z0-9]+(?:-{1,2}[a-z0-9]+)*)$/;

/** `''`/`'#'`/`'#/'` → null; `#/n/<id>` or `#/e/<id>` → selection; anything else → 'invalid'. */
export function parseHash(hash: string): Selection | null | 'invalid' {
  if (hash === '' || hash === '#' || hash === '#/') return null;
  const m = HASH.exec(hash);
  if (!m) return 'invalid';
  return { kind: m[1] === 'n' ? 'node' : 'edge', id: m[2] };
}

export function formatHash(sel: Selection | null): string {
  if (!sel) return '';
  return `#/${sel.kind === 'node' ? 'n' : 'e'}/${sel.id}`;
}

const exists = (g: Graph, sel: Selection) => (sel.kind === 'node' ? g.nodesById.has(sel.id) : g.edgesById.has(sel.id));
const same = (a: Selection | null, b: Selection | null) => a?.kind === b?.kind && a?.id === b?.id;

/** Keeps the store's selection and the URL hash in sync. Returns a stop function. */
export function startHashSync(store: AppStore, graph: Graph, win: Window): () => void {
  const urlWith = (hash: string) => `${win.location.pathname}${win.location.search}${hash}`;

  const apply = () => {
    const parsed = parseHash(win.location.hash);
    const state = store.getState();
    if (parsed === null) {
      if (state.selection) state.clearSelection();
      return;
    }
    if (parsed === 'invalid' || !exists(graph, parsed)) {
      state.clearSelection();
      win.history.replaceState(win.history.state, '', urlWith(''));
      state.showNotice('Not found');
      return;
    }
    if (!same(parsed, state.selection)) state.select(parsed, { reveal: true });
  };

  const unsubscribe = store.subscribe((s, prev) => {
    if (same(s.selection, prev.selection)) return;
    const hash = formatHash(s.selection);
    if (hash === win.location.hash) return;
    if (s.selection?.id !== prev.selection?.id) win.history.pushState(null, '', urlWith(hash));
    else win.history.replaceState(win.history.state, '', urlWith(hash));
  });

  win.addEventListener('hashchange', apply);
  apply();
  return () => {
    unsubscribe();
    win.removeEventListener('hashchange', apply);
  };
}
