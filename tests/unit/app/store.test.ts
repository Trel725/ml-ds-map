import { beforeAll, expect, test } from 'vitest';
import { createAppStore } from '../../../src/app/store';
import type { Graph } from '../../../src/graph/graph';
import { mem } from '../helpers/kv';
import { realGraph } from '../helpers/real';

let g: Graph;
beforeAll(async () => {
  g = await realGraph();
});

test('first visit starts at layers; explore sets visited and groups', () => {
  const kv = mem();
  const s = createAppStore(g, kv);
  expect(s.getState().zoomLevel).toBe('layers');
  s.getState().explore();
  expect(s.getState().zoomLevel).toBe('groups');
  expect(kv.data['mlmap.visited']).toBe('1');
  expect(createAppStore(g, kv).getState().zoomLevel).toBe('groups');
});
test('stale group ids in storage are dropped', () => {
  const s = createAppStore(g, mem({ 'mlmap.visited': '1', 'mlmap.expandedGroups': '["calculus","gone-group"]' }));
  expect([...s.getState().expandedGroups]).toEqual(['calculus']);
  expect(s.getState().zoomLevel).toBe('nodes');
});
test('non-JSON expandedGroups is ignored', () => {
  const s = createAppStore(g, mem({ 'mlmap.visited': '1', 'mlmap.expandedGroups': '{oops' }));
  expect(s.getState().expandedGroups.size).toBe(0);
  expect(s.getState().zoomLevel).toBe('groups');
});
test('unknown theme string falls back to system', () => {
  expect(createAppStore(g, mem({ 'mlmap.theme': '"neon"' })).getState().theme).toBe('system');
  expect(createAppStore(g, mem({ 'mlmap.theme': 'dark' })).getState().theme).toBe('system');
  expect(createAppStore(g, mem({ 'mlmap.theme': '"dark"' })).getState().theme).toBe('dark');
});
test('expandedGroups and theme are persisted on change', () => {
  const kv = mem();
  const s = createAppStore(g, kv);
  s.getState().toggleGroup('calculus');
  s.getState().setTheme('light');
  expect(JSON.parse(kv.data['mlmap.expandedGroups'])).toEqual(['calculus']);
  expect(JSON.parse(kv.data['mlmap.theme'])).toBe('light');
});
test('works with null storage', () => expect(() => createAppStore(g, null).getState().toggleGroup('calculus')).not.toThrow());
test('toggleGroup switches between nodes and groups zoom', () => {
  const s = createAppStore(g, mem({ 'mlmap.visited': '1' }));
  s.getState().toggleGroup('calculus');
  expect(s.getState().zoomLevel).toBe('nodes');
  s.getState().toggleGroup('calculus');
  expect(s.getState().zoomLevel).toBe('groups');
});
test('breadcrumb keeps the last 5 distinct nodes', () => {
  const s = createAppStore(g, null);
  for (const id of ['slope', 'derivative', 'gradient', 'slope', 'ols', 'pca', 'knn', 'svm']) s.getState().select({ kind: 'node', id });
  expect(s.getState().breadcrumb).toEqual(['slope', 'ols', 'pca', 'knn', 'svm']);
});
test('select leaves layers zoom and resets highlight', () => {
  const s = createAppStore(g, mem());
  s.getState().traceDown('gradient-descent');
  s.getState().select({ kind: 'node', id: 'slope' });
  expect(s.getState().zoomLevel).not.toBe('layers');
  expect(s.getState().highlight.mode).toBe('none');
});
test('select with reveal expands the group and bumps focusRequest.nonce', () => {
  const s = createAppStore(g, null);
  s.getState().select({ kind: 'node', id: 'gradient' }, { reveal: true });
  const first = s.getState().focusRequest!;
  expect(s.getState().expandedGroups.has('calculus')).toBe(true);
  expect(first.id).toBe('gradient');
  s.getState().select({ kind: 'node', id: 'gradient' }, { reveal: true });
  expect(s.getState().focusRequest!.nonce).toBeGreaterThan(first.nonce);
});
test('select without reveal does not expand', () => {
  const s = createAppStore(g, null);
  s.getState().select({ kind: 'node', id: 'gradient' });
  expect(s.getState().expandedGroups.has('calculus')).toBe(false);
});
test('traceDown(gradient-descent) expands calculus and algebra-basics and fills highlight with nodes and edges', () => {
  const s = createAppStore(g, null);
  s.getState().traceDown('gradient-descent');
  const st = s.getState();
  expect(st.expandedGroups.has('calculus')).toBe(true);
  expect(st.expandedGroups.has('algebra-basics')).toBe(true);
  expect(st.highlight.mode).toBe('trace-down');
  expect(st.highlight.ids.has('slope')).toBe(true);
  expect(st.highlight.ids.has('derivative--needs--slope')).toBe(true);
  expect(st.zoomLevel).toBe('nodes');
});
test('clearSelection clears selection and highlight', () => {
  const s = createAppStore(g, null);
  s.getState().select({ kind: 'node', id: 'gradient-descent' });
  s.getState().traceDown('gradient-descent');
  s.getState().clearSelection();
  expect(s.getState().selection).toBeNull();
  expect(s.getState().highlight.mode).toBe('none');
});
test('tour: start, step through, past last ends tour and clears highlight', () => {
  const content = { ...g.content, tours: [{ id: 'tt', title: 'T', source: 's', stops: ['slope', 'derivative', 'gradient', 'gradient-descent', 'ols'].map((node) => ({ node, caption: 'c' })) }] };
  const s = createAppStore({ ...g, content }, null);
  s.getState().startTour('tt');
  expect(s.getState().tour).toEqual({ id: 'tt', step: 0 });
  expect(s.getState().selection).toEqual({ kind: 'node', id: 'slope' });
  expect(s.getState().expandedGroups.has('algebra-basics')).toBe(true);
  s.getState().tourStep(1);
  expect(s.getState().highlight).toEqual({ mode: 'tour', ids: new Set(['slope', 'derivative']) });
  s.getState().tourStep(-1);
  s.getState().tourStep(-1);
  expect(s.getState().tour!.step).toBe(0);
  for (let i = 0; i < 4; i++) s.getState().tourStep(1);
  expect(s.getState().tour!.step).toBe(4);
  s.getState().tourStep(1);
  expect(s.getState().tour).toBeNull();
  expect(s.getState().highlight.mode).toBe('none');
});
test('startTour with an unknown id is a no-op', () => {
  const s = createAppStore(g, null);
  s.getState().startTour('nope');
  expect(s.getState().tour).toBeNull();
});
test('notice shows and dismisses', () => {
  const s = createAppStore(g, null);
  s.getState().showNotice('Not found');
  expect(s.getState().notice).toBe('Not found');
  s.getState().dismissNotice();
  expect(s.getState().notice).toBeNull();
});
