import { beforeAll, expect, test } from 'vitest';
import type { Content } from '../../../src/data/schema';
import { buildGraph } from '../../../src/graph/graph';
import type { Graph } from '../../../src/graph/graph';
import { recipeSet, traceDown, traceUp } from '../../../src/graph/trace';
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

test('traceUp(slope) reaches every node that needs it transitively, and nothing else', () => {
  const t = traceUp(g, 'slope');
  expect(t.nodeIds).toEqual(new Set(['slope', 'derivative', 'overfitting', 'ols', 'ridge']));
  expect(t.edgeIds).toEqual(new Set(['derivative--needs--slope', 'overfitting--needs--derivative', 'ols--needs--overfitting', 'ridge--needs--derivative']));
});
test('traceUp from a node nobody needs returns an empty order', () => {
  const t = traceUp(g, 'ols');
  expect(t.order).toEqual([]);
  expect(t.nodeIds).toEqual(new Set(['ols']));
  expect(t.edgeIds.size).toBe(0);
});
test('traceUp order puts lower layers first', () =>
  expect(traceUp(g, 'slope').order).toEqual(['derivative', 'overfitting', 'ols', 'ridge']));
test('traceDown keeps working after sharing the search', () =>
  expect(traceDown(g, 'ridge').order).toEqual(['slope', 'derivative']));
test('recipeSet holds the node, its slot nodes and the edges between them', () => {
  const r = recipeSet(g, 'ridge');
  expect(r.nodeIds).toEqual(new Set(['ridge', 'regression', 'derivative']));
  expect(r.edgeIds).toEqual(new Set(['ridge--needs--derivative']));
});
test('recipeSet of a node without a recipe is just that node', () => {
  const r = recipeSet(g, 'slope');
  expect(r.nodeIds).toEqual(new Set(['slope']));
  expect(r.edgeIds.size).toBe(0);
});
test('recipeSet skips a slot node missing from the graph', () => {
  const c = g.content;
  const nodes = c.nodes.map((n) =>
    n.id === 'ridge' ? { ...n, recipe: { ...n.recipe!, evaluation: { text: 'Test error.', node: 'ghost' } } } : n,
  );
  const r = recipeSet(buildGraph({ ...c, nodes }), 'ridge');
  expect(r.nodeIds.has('ghost')).toBe(false);
  expect(r.nodeIds).toEqual(new Set(['ridge', 'regression', 'derivative']));
});
test('real content: traceUp(slope) reaches gradient descent and backpropagation', async () => {
  const t = traceUp(await realGraph(), 'slope');
  expect(t.nodeIds.has('gradient-descent')).toBe(true);
  expect(t.nodeIds.has('backpropagation')).toBe(true);
});
