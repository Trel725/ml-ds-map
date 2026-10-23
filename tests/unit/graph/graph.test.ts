import { beforeAll, expect, test } from 'vitest';
import { buildGraph, directEdges, neededBy, needsOf } from '../../../src/graph/graph';
import type { Graph } from '../../../src/graph/graph';
import { loadValid } from '../helpers/fixtures';

let g: Graph;
beforeAll(async () => {
  g = buildGraph(await loadValid());
});

test('indexes nodes, groups and edges by id', () => {
  expect(g.nodesById.get('ols')!.label).toBe('OLS');
  expect(g.groupsById.get('g-alg')!.layer).toBe('algorithms');
  expect(g.edgesById.has('derivative--needs--slope')).toBe(true);
});
test('membersByGroup keeps file order', () => expect(g.membersByGroup.get('g-alg')!.map((n) => n.id)).toEqual(['ols']));
test('out and in are [] when there are none', () => {
  expect(g.out.get('slope')).toEqual([]);
  expect(g.in.get('ols')).toEqual([]);
});
test('needsOf(ols) is [overfitting]', () => expect(needsOf(g, 'ols').map((n) => n.id)).toEqual(['overfitting']));
test('neededBy(slope) is [derivative]', () => expect(neededBy(g, 'slope').map((n) => n.id)).toEqual(['derivative']));
test('directEdges(ols) has needs, solves and implemented-in', () =>
  expect(directEdges(g, 'ols').map((e) => e.type).sort()).toEqual(['implemented-in', 'needs', 'solves']));
test('directEdges(derivative) has in and out', () =>
  expect(directEdges(g, 'derivative').map((e) => e.id).sort()).toEqual(['derivative--needs--slope', 'overfitting--needs--derivative']));
