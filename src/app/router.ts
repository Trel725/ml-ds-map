import type { Graph } from '../graph/graph';
import type { AppStore, Selection, View } from './store';

const HASH = /^#\/([ne])\/([a-z0-9]+(?:-{1,2}[a-z0-9]+)*)$/;

const GALLERY = '#/gallery';

/** `''`/`'#'`/`'#/'` → null; `#/gallery` → 'gallery'; `#/n/<id>` or `#/e/<id>` → selection; anything else → 'invalid'. */
export function parseHash(hash: string): Selection | 'gallery' | null | 'invalid' {
  if (hash === '' || hash === '#' || hash === '#/') return null;
  if (hash === GALLERY) return 'gallery';
  const m = HASH.exec(hash);
  if (!m) return 'invalid';
  return { kind: m[1] === 'n' ? 'node' : 'edge', id: m[2] };
}

export function formatHash(sel: Selection | null, view: View = 'map'): string {
  if (view === 'gallery') return GALLERY;
  if (!sel) return '';
  return `#/${sel.kind === 'node' ? 'n' : 'e'}/${sel.id}`;
}

const exists = (g: Graph, sel: Selection) => (sel.kind === 'node' ? g.nodesById.has(sel.id) : g.edgesById.has(sel.id));
const same = (a: Selection | null, b: Selection | null) => a?.kind === b?.kind && a?.id === b?.id;

/** Keeps the store's selection and view and the URL hash in sync. Returns a stop function. */
export function startHashSync(store: AppStore, graph: Graph, win: Window): () => void {
  const urlWith = (hash: string) => `${win.location.pathname}${win.location.search}${hash}`;

  const apply = () => {
    const parsed = parseHash(win.location.hash);
    const state = store.getState();
    if (parsed === 'gallery') {
      if (state.view !== 'gallery') state.openGallery();
      return;
    }
    if (parsed === null) {
      if (state.view === 'gallery') state.closeGallery();
      if (state.selection) state.clearSelection();
      return;
    }
    if (parsed === 'invalid' || !exists(graph, parsed)) {
      if (state.view === 'gallery') state.closeGallery();
      state.clearSelection();
      win.history.replaceState(win.history.state, '', urlWith(''));
      state.showNotice('Not found');
      return;
    }
    if (!same(parsed, state.selection) || state.view === 'gallery') state.select(parsed, { reveal: true });
  };

  const unsubscribe = store.subscribe((s, prev) => {
    const hash = formatHash(s.selection, s.view);
    if (hash === formatHash(prev.selection, prev.view)) return;
    if (hash === win.location.hash) return;
    if (s.view !== prev.view || s.selection?.id !== prev.selection?.id) win.history.pushState(null, '', urlWith(hash));
    else win.history.replaceState(win.history.state, '', urlWith(hash));
  });

  win.addEventListener('hashchange', apply);
  apply();
  return () => {
    unsubscribe();
    win.removeEventListener('hashchange', apply);
  };
}
