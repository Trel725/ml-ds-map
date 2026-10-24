import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import type { LensId } from '../data/schema';
import type { Graph } from '../graph/graph';
import { lensSet } from '../graph/lens';
import { traceDown as computeTrace, recipeSet, traceUp as computeTraceUp } from '../graph/trace';
import type { Selection } from '../graph/visibleEdges';
import { KEYS, readJson, readString, writeJson, writeString } from './storage';
import type { KV } from './storage';

export type { Selection };
export type Theme = 'system' | 'light' | 'dark';
export type ZoomLevel = 'layers' | 'groups' | 'nodes';
export type View = 'map' | 'gallery';
export type HighlightMode = 'none' | 'trace-down' | 'trace-up' | 'recipe' | 'lens' | 'tour';

export interface AppState {
  /** The gallery replaces the map and panel; the selection is kept for the way back. */
  view: View;
  selection: Selection | null;
  expandedGroups: Set<string>;
  zoomLevel: ZoomLevel;
  /** Node ids and edge ids. */
  highlight: { mode: HighlightMode; ids: Set<string> };
  activeLens: LensId | null;
  tour: { id: string; step: number } | null;
  breadcrumb: string[];
  theme: Theme;
  notice: string | null;
  /** The map centers on this node or group whenever `nonce` changes. */
  focusRequest: { id: string; nonce: number } | null;
}

export interface AppActions {
  /** `reveal` expands the node's group and requests focus. Always returns to the map. */
  select(sel: Selection, opts?: { reveal?: boolean }): void;
  /** Also clears the highlight unless a tour or lens fills it. */
  clearSelection(): void;
  toggleGroup(id: string): void;
  expandGroups(ids: Iterable<string>): void;
  /** Leave the first-visit layers view. */
  explore(): void;
  traceDown(nodeId: string): void;
  /** Highlights everything that needs the node; expands no groups. */
  traceUp(nodeId: string): void;
  /** Highlights the node's recipe slot nodes and expands their groups. */
  traceRecipe(nodeId: string): void;
  /** One lens at a time: switches to `lens`, or turns it off if it is already on. Ends a tour. */
  toggleLens(lens: LensId): void;
  /** Steps back one layer: closes the gallery, else ends the tour, else clears the selection, else turns off the lens. */
  escape(): void;
  /** Ends any tour; keeps the selection. */
  openGallery(): void;
  closeGallery(): void;
  startTour(id: string): void;
  tourStep(delta: 1 | -1): void;
  endTour(): void;
  setTheme(t: Theme): void;
  showNotice(text: string): void;
  dismissNotice(): void;
}

export type AppStore = StoreApi<AppState & AppActions>;

const THEMES: Theme[] = ['system', 'light', 'dark'];
const BREADCRUMB_MAX = 5;
const NO_HIGHLIGHT = { mode: 'none' as const, ids: new Set<string>() };
/** Highlight modes that outlive a change of selection. */
const STICKY: HighlightMode[] = ['tour', 'lens'];

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isTheme = (v: unknown): v is Theme => THEMES.includes(v as Theme);

export function createAppStore(graph: Graph, kv: KV | null): AppStore {
  const visited = readString(kv, KEYS.visited) !== null;
  const expandedGroups = new Set((readJson(kv, KEYS.expandedGroups, isStringArray) ?? []).filter((id) => graph.groupsById.has(id)));
  const theme = readJson(kv, KEYS.theme, isTheme) ?? 'system';
  let nonce = 0;

  const zoomFor = (expanded: Set<string>, current: ZoomLevel): ZoomLevel =>
    current === 'layers' && expanded.size === 0 ? 'layers' : expanded.size > 0 ? 'nodes' : 'groups';

  /** Groups to open so these node ids are visible (tools have no group box). */
  const groupsOf = (ids: Iterable<string>) => {
    const out: string[] = [];
    for (const id of ids) {
      const n = graph.nodesById.get(id);
      if (n && n.kind !== 'tool' && graph.groupsById.has(n.group)) out.push(n.group);
    }
    return out;
  };

  const lensHighlight = (lens: LensId) => ({ mode: 'lens' as const, ids: lensSet(graph, lens) });

  const store = createStore<AppState & AppActions>()((set, get) => {
    const expand = (ids: Iterable<string>) => {
      const next = new Set(get().expandedGroups);
      for (const id of ids) next.add(id);
      return next;
    };

    const goToStop = (tourId: string, step: number) => {
      const t = graph.content.tours.find((x) => x.id === tourId);
      if (!t) return;
      set({ tour: { id: tourId, step } });
      get().select({ kind: 'node', id: t.stops[step].node }, { reveal: true });
      set({ highlight: { mode: 'tour', ids: new Set(t.stops.slice(0, step + 1).map((s) => s.node)) } });
    };

    return {
      view: 'map',
      selection: null,
      expandedGroups,
      zoomLevel: !visited ? 'layers' : expandedGroups.size > 0 ? 'nodes' : 'groups',
      highlight: NO_HIGHLIGHT,
      activeLens: null,
      tour: null,
      breadcrumb: [],
      theme,
      notice: null,
      focusRequest: null,

      select(sel, opts = {}) {
        const s = get();
        let breadcrumb = s.breadcrumb;
        if (sel.kind === 'node') breadcrumb = [...s.breadcrumb.filter((id) => id !== sel.id), sel.id].slice(-BREADCRUMB_MAX);
        let expanded = s.expandedGroups;
        let focusRequest = s.focusRequest;
        if (opts.reveal) {
          const edge = sel.kind === 'edge' ? graph.edgesById.get(sel.id) : undefined;
          const ids = edge ? [edge.from, edge.to] : [sel.id];
          expanded = expand(groupsOf(ids));
          focusRequest = { id: ids[0], nonce: ++nonce };
        }
        set({
          view: 'map',
          selection: sel,
          breadcrumb,
          expandedGroups: expanded,
          focusRequest,
          zoomLevel: s.zoomLevel === 'layers' ? (expanded.size > 0 ? 'nodes' : 'groups') : zoomFor(expanded, s.zoomLevel),
          highlight: STICKY.includes(s.highlight.mode) ? s.highlight : NO_HIGHLIGHT,
        });
      },

      clearSelection() {
        const s = get();
        set({ selection: null, highlight: STICKY.includes(s.highlight.mode) ? s.highlight : NO_HIGHLIGHT });
      },

      toggleGroup(id) {
        const next = new Set(get().expandedGroups);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        set({ expandedGroups: next, zoomLevel: next.size > 0 ? 'nodes' : 'groups' });
      },

      expandGroups(ids) {
        const next = expand(ids);
        set({ expandedGroups: next, zoomLevel: next.size > 0 ? 'nodes' : 'groups' });
      },

      explore() {
        writeString(kv, KEYS.visited, '1');
        set({ zoomLevel: get().expandedGroups.size > 0 ? 'nodes' : 'groups' });
      },

      traceDown(nodeId) {
        const t = computeTrace(graph, nodeId);
        const next = expand(groupsOf(t.nodeIds));
        set({
          expandedGroups: next,
          zoomLevel: next.size > 0 ? 'nodes' : 'groups',
          highlight: { mode: 'trace-down', ids: new Set([...t.nodeIds, ...t.edgeIds]) },
          activeLens: null,
        });
      },

      traceUp(nodeId) {
        const t = computeTraceUp(graph, nodeId);
        set({ highlight: { mode: 'trace-up', ids: new Set([...t.nodeIds, ...t.edgeIds]) }, activeLens: null });
      },

      traceRecipe(nodeId) {
        const r = recipeSet(graph, nodeId);
        const next = expand(groupsOf(r.nodeIds));
        set({
          expandedGroups: next,
          zoomLevel: next.size > 0 ? 'nodes' : 'groups',
          highlight: { mode: 'recipe', ids: new Set([...r.nodeIds, ...r.edgeIds]) },
          activeLens: null,
        });
      },

      toggleLens(lens) {
        if (get().activeLens === lens) set({ activeLens: null, highlight: NO_HIGHLIGHT });
        else set({ activeLens: lens, highlight: lensHighlight(lens), tour: null });
      },

      escape() {
        const s = get();
        if (s.view === 'gallery') s.closeGallery();
        else if (s.tour) s.endTour();
        else if (s.selection) s.clearSelection();
        else if (s.activeLens) s.toggleLens(s.activeLens);
      },

      startTour(id) {
        if (!graph.content.tours.some((t) => t.id === id)) return;
        set({ activeLens: null });
        goToStop(id, 0);
      },

      tourStep(delta) {
        const tour = get().tour;
        if (!tour) return;
        const t = graph.content.tours.find((x) => x.id === tour.id);
        if (!t) return get().endTour();
        const step = tour.step + delta;
        if (step >= t.stops.length) return get().endTour();
        goToStop(tour.id, Math.max(0, step));
      },

      openGallery() {
        get().endTour();
        set({ view: 'gallery' });
      },

      closeGallery() {
        set({ view: 'map' });
      },

      endTour() {
        const lens = get().activeLens;
        set({ tour: null, highlight: lens ? lensHighlight(lens) : NO_HIGHLIGHT });
      },

      setTheme(t) {
        set({ theme: t });
      },

      showNotice(text) {
        set({ notice: text });
      },

      dismissNotice() {
        set({ notice: null });
      },
    };
  });

  store.subscribe((s, prev) => {
    if (s.expandedGroups !== prev.expandedGroups) writeJson(kv, KEYS.expandedGroups, [...s.expandedGroups]);
    if (s.theme !== prev.theme) writeJson(kv, KEYS.theme, s.theme);
  });

  return store;
}
