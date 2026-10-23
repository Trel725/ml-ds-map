import { beforeAll, expect, test } from 'vitest';
import type { Content } from '../../../src/data/schema';
import { buildGraph } from '../../../src/graph/graph';
import type { Graph } from '../../../src/graph/graph';
import { traceDown } from '../../../src/graph/trace';
import { loadValid } from '../helpers/fixtures';
import { realGraph } from '../helpers/real';

let g: Graph;
beforeAll(async () => {
  g = buildGraph(await loadValid());
});

test('traceDown(ols) order is foundations first', () => {
  const t = traceDown(g, 'ols');
  expect(t.order).toEqual(['slope', 'derivative', 'overfitting']);
  expect(t.nodeIds).toEqual(new Set(['ols', 'overfitting', 'derivative', 'slope']));
  expect(t.edgeIds.size).toBe(3);
});
test('traceDown of a node with no needs returns empty order', () => {
  const t = traceDown(g, 'slope');
  expect(t.order).toEqual([]);
  expect(t.nodeIds).toEqual(new Set(['slope']));
  expect(t.edgeIds.size).toBe(0);
});
test('ties break by layer, then label', () => {
  const node = (id: string, layer: 'foundations' | 'math' | 'core') => ({
    id, label: id, synonyms: [], lenses: [], layer, group: 'g', kind: 'concept' as const,
    oneLiner: 'x', intuition: 'x', source: 's',
  });
  const edge = (from: string, to: string) => ({ id: `${from}--needs--${to}`, from, to, type: 'needs' as const, sentence: 's', signature: false, source: 's' });
  const content: Content = {
    groups: [],
    nodes: [node('x', 'core'), node('b-math', 'math'), node('a-found', 'foundations'), node('c-found', 'foundations')],
    edges: [edge('x', 'b-math'), edge('x', 'a-found'), edge('x', 'c-found')],
    tours: [],
  };
  expect(traceDown(buildGraph(content), 'x').order).toEqual(['a-found', 'c-found', 'b-math']);
});
test('a prerequisite always comes before what needs it, even across layers', () => {
  const node = (id: string, layer: 'foundations' | 'math') => ({
    id, label: id, synonyms: [], lenses: [], layer, group: 'g', kind: 'math' as const,
    oneLiner: 'x', intuition: 'x', source: 's',
  });
  const edge = (from: string, to: string) => ({ id: `${from}--needs--${to}`, from, to, type: 'needs' as const, sentence: 's', signature: false, source: 's' });
  const content: Content = {
    groups: [],
    // a foundation that needs a math node: the math node must still come first
    nodes: [node('top', 'math'), node('f', 'foundations'), node('m', 'math')],
    edges: [edge('top', 'f'), edge('f', 'm')],
    tours: [],
  };
  expect(traceDown(buildGraph(content), 'top').order).toEqual(['m', 'f']);
});
test('real content: traceDown(gradient-descent) starts with a foundation and contains slope and derivative', async () => {
  const real = await realGraph();
  const t = traceDown(real, 'gradient-descent');
  expect(real.nodesById.get(t.order[0])!.layer).toBe('foundations');
  expect(t.order).toContain('derivative');
  expect(t.order.indexOf('slope')).toBeLessThan(t.order.indexOf('derivative'));
});
