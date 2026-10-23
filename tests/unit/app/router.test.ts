// @vitest-environment jsdom
import { beforeAll, expect, test } from 'vitest';
import { formatHash, parseHash, startHashSync } from '../../../src/app/router';
import { createAppStore } from '../../../src/app/store';
import type { Graph } from '../../../src/graph/graph';
import { realGraph } from '../helpers/real';

let g: Graph;
beforeAll(async () => {
  g = await realGraph();
});

test.each([
  ['#/n/gradient-descent', { kind: 'node', id: 'gradient-descent' }],
  ['#/e/derivative--needs--slope', { kind: 'edge', id: 'derivative--needs--slope' }],
  ['', null], ['#/', null], ['#/n/', 'invalid'], ['#/x/foo', 'invalid'], ['#/n/Gradient%20Descent', 'invalid'], ['#garbage', 'invalid'],
])('parseHash(%s)', (h, want) => expect(parseHash(h)).toEqual(want));

test('formatHash round-trips', () => {
  for (const sel of [{ kind: 'node' as const, id: 'ols' }, { kind: 'edge' as const, id: 'derivative--needs--slope' }]) {
    expect(parseHash(formatHash(sel))).toEqual(sel);
  }
  expect(formatHash(null)).toBe('');
});

const at = (hash: string) => window.history.replaceState(null, '', `/${hash}`);

test('a valid hash selects and reveals the node', () => {
  at('#/n/gradient');
  const s = createAppStore(g, null);
  const stop = startHashSync(s, g, window);
  expect(s.getState().selection).toEqual({ kind: 'node', id: 'gradient' });
  expect(s.getState().expandedGroups.has('calculus')).toBe(true);
  stop();
});
test.each(['#/n/no-such-node', '#/n/', '#/x/foo', '#/n/derivative--needs--slope', '#/e/slope'])(
  'bad hash %s falls back with a notice and never throws',
  (hash) => {
    at(hash);
    const s = createAppStore(g, null);
    const stop = startHashSync(s, g, window);
    expect(s.getState().selection).toBeNull();
    expect(s.getState().notice).toBe('Not found');
    expect(window.location.hash).toBe('');
    stop();
  },
);
test('selection changes write the hash', () => {
  at('');
  const s = createAppStore(g, null);
  const stop = startHashSync(s, g, window);
  const before = window.history.length;
  s.getState().select({ kind: 'node', id: 'ols' });
  expect(window.location.hash).toBe('#/n/ols');
  expect(window.history.length).toBe(before + 1);
  s.getState().select({ kind: 'node', id: 'ols' });
  expect(window.history.length).toBe(before + 1);
  stop();
});
test('hashchange selects the new node', () => {
  at('');
  const s = createAppStore(g, null);
  const stop = startHashSync(s, g, window);
  at('#/n/pca');
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  expect(s.getState().selection).toEqual({ kind: 'node', id: 'pca' });
  stop();
});
