import { beforeAll, expect, test } from 'vitest';
import type { Graph } from '../../../src/graph/graph';
import type { Box } from '../../../src/layout/layout';
import { navCandidates, navNeighbors, pickInDirection } from '../../../src/map/edgeNav';
import { realGraph } from '../helpers/real';

let g: Graph;
beforeAll(async () => {
  g = await realGraph();
});

const box = (x: number, y: number): Box => ({ x, y, w: 20, h: 20 });
const C = [
  { id: 'sel', box: box(100, 100) },
  { id: 'up-near', box: box(130, 40) },
  { id: 'up-far', box: box(400, 40) },
  { id: 'down', box: box(90, 200) },
  { id: 'same-row', box: box(300, 103) }, // |dy| < 8: not above or below
];

test('up picks the nearest candidate above', () => expect(pickInDirection('sel', C, 'up')).toBe('up-near'));
test('down picks the candidate below', () => expect(pickInDirection('sel', C, 'down')).toBe('down'));
test('nothing below the lowest candidate', () => expect(pickInDirection('down', C, 'down')).toBeNull());
test('a same-row candidate is not above or below', () => {
  expect(pickInDirection('same-row', C.filter((c) => c.id !== 'up-near' && c.id !== 'up-far' && c.id !== 'down'), 'up')).toBeNull();
});
test('left/right walk reading order and wrap', () => {
  // reading order: up-near, up-far, sel, same-row, down
  expect(pickInDirection('sel', C, 'right')).toBe('same-row');
  expect(pickInDirection('down', C, 'right')).toBe('up-near');
  expect(pickInDirection('up-near', C, 'left')).toBe('down');
});
test('ties go to the smaller id', () => {
  expect(pickInDirection('s', [{ id: 's', box: box(0, 100) }, { id: 'b', box: box(-30, 0) }, { id: 'a', box: box(30, 0) }], 'up')).toBe('a');
});
test('unknown fromId returns null', () => expect(pickInDirection('nope', C, 'up')).toBeNull());

test('navNeighbors(gradient-descent) lists each neighbor once with its edge', () => {
  const n = navNeighbors(g, 'gradient-descent');
  expect(n.map((x) => x.nodeId)).toEqual(expect.arrayContaining(['gradient', 'loss-landscape', 'learning-rate', 'logistic-regression', 'backpropagation']));
  expect(new Set(n.map((x) => x.nodeId)).size).toBe(n.length);
  expect(n.find((x) => x.nodeId === 'gradient')!.edgeId).toBe('gradient-descent--needs--gradient');
});
test('navNeighbors of an unknown id is empty', () => expect(navNeighbors(g, 'nope')).toEqual([]));
test('navCandidates opens every neighbor group and boxes every candidate', () => {
  const { candidates, groupsToOpen } = navCandidates(g, 'gradient-descent', new Set());
  expect(groupsToOpen).toEqual(expect.arrayContaining(['optimization', 'calculus']));
  expect(candidates.map((c) => c.id)).toContain('gradient-descent');
  expect(candidates).toHaveLength(navNeighbors(g, 'gradient-descent').length + 1);
  // distinct positions, so every candidate can be told apart
  expect(new Set(candidates.map((c) => `${c.box.x},${c.box.y}`)).size).toBe(candidates.length);
});
test('already-expanded groups are not reopened', () => {
  expect(navCandidates(g, 'gradient-descent', new Set(['calculus'])).groupsToOpen).not.toContain('calculus');
});
test('left/right from the selected node reach every neighbor of every node', () => {
  for (const n of g.content.nodes) {
    const { candidates } = navCandidates(g, n.id, new Set());
    const seen = new Set([n.id]);
    let at = n.id;
    for (let i = 0; i < candidates.length; i++) seen.add((at = pickInDirection(at, candidates, 'right')!));
    expect(seen.size, n.id).toBe(candidates.length);
  }
});
