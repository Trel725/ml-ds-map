import { beforeAll, expect, test } from 'vitest';
import type { Content } from '../../../src/data/schema';
import { buildGraph } from '../../../src/graph/graph';
import type { Graph } from '../../../src/graph/graph';
import { traceDown } from '../../../src/graph/trace';
import { visibleEdges, visualId } from '../../../src/graph/visibleEdges';
import { realGraph } from '../helpers/real';

let g: Graph;
beforeAll(async () => {
  g = await realGraph();
});

test('visualId maps collapsed members to their group, tools and groups to themselves', () => {
  expect(visualId(g, 'gradient', new Set())).toBe('calculus');
  expect(visualId(g, 'gradient', new Set(['calculus']))).toBe('gradient');
  expect(visualId(g, 'calculus', new Set())).toBe('calculus');
  expect(visualId(g, 'scikit-learn', new Set())).toBe('scikit-learn');
});
test('null selection → no edges, empty related', () => {
  const { edges, related } = visibleEdges(g, null, new Set());
  expect(edges).toEqual([]);
  expect(related.size).toBe(0);
});
test('selecting gradient-descent with nothing expanded attaches neighbors to their groups', () => {
  const { edges, related } = visibleEdges(g, { kind: 'node', id: 'gradient-descent' }, new Set());
  expect(related.has('optimization')).toBe(true);
  expect(related.has('calculus')).toBe(true);
  expect(edges.every((e) => e.from !== e.to)).toBe(true);
  expect(edges.find((e) => e.from === 'optimization' && e.to === 'calculus')).toBeTruthy();
});
test('three edges from one collapsed group merge with count 3', () => {
  const { edges } = visibleEdges(g, { kind: 'node', id: 'bayes-rule' }, new Set(['probability']));
  const merged = edges.find((e) => e.from === 'probabilistic-models' && e.to === 'bayes-rule')!;
  expect(merged.key).toBe('probabilistic-models->bayes-rule');
  expect(merged.count).toBe(3);
  expect(merged.edgeIds).toHaveLength(3);
});
test('edges with different types into the same group merge and keep the earliest EDGE_TYPES type', () => {
  const node = (id: string, group: string) => ({
    id, label: id, synonyms: [], lenses: [], layer: 'algorithms' as const, group, kind: 'algorithm' as const,
    oneLiner: 'x', intuition: 'x', source: 's',
  });
  const content: Content = {
    groups: [
      { id: 'ga', label: 'A', layer: 'algorithms', order: 1, source: 's' },
      { id: 'gb', label: 'B', layer: 'algorithms', order: 2, source: 's' },
    ],
    nodes: [node('a', 'ga'), node('b1', 'gb'), node('b2', 'gb')],
    edges: [
      { id: 'e1', from: 'b1', to: 'a', type: 'fixes-weakness-of', sentence: 's1', signature: false, source: 's' },
      { id: 'e2', from: 'b2', to: 'a', type: 'is-trained-by', sentence: 's2', signature: false, source: 's' },
    ],
    tours: [],
  };
  const { edges } = visibleEdges(buildGraph(content), { kind: 'node', id: 'a' }, new Set(['ga']));
  expect(edges).toEqual([{ key: 'gb->a', from: 'gb', to: 'a', edgeIds: ['e1', 'e2'], type: 'is-trained-by', count: 2 }]);
});
test('group endpoint stays the group id when that group is expanded', () => {
  const { edges } = visibleEdges(g, { kind: 'node', id: 'scikit-learn' }, new Set(['linear-models']));
  expect(edges.map((e) => e.key)).toContain('linear-models->scikit-learn');
});
test('selecting an edge shows only it; related = its two ends', () => {
  const { edges, related } = visibleEdges(g, { kind: 'edge', id: 'derivative--needs--slope' }, new Set(['calculus']));
  expect(edges).toEqual([
    { key: 'derivative->algebra-basics', from: 'derivative', to: 'algebra-basics', edgeIds: ['derivative--needs--slope'], type: 'needs', count: 1 },
  ]);
  expect(related).toEqual(new Set(['derivative', 'algebra-basics']));
});
test('extraEdgeIds are drawn in addition to the selection', () => {
  const t = traceDown(g, 'gradient-descent');
  const expanded = new Set(['optimization', 'calculus', 'algebra-basics']);
  const plain = visibleEdges(g, { kind: 'node', id: 'gradient-descent' }, expanded);
  const traced = visibleEdges(g, { kind: 'node', id: 'gradient-descent' }, expanded, t.edgeIds);
  expect(traced.edges.map((e) => e.key)).toContain('derivative->slope');
  expect(plain.edges.map((e) => e.key)).not.toContain('derivative->slope');
  expect(traced.related.has('slope')).toBe(true);
});
