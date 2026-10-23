import { expect, test } from 'vitest';
import { findCycles } from '../../../src/graph/cycles';

test('no cycles in a DAG', () =>
  expect(findCycles(['a', 'b', 'c'], [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }])).toEqual([]));
test('reports a 3-cycle once, starting at smallest id', () =>
  expect(
    findCycles(['a', 'b', 'c'], [{ from: 'b', to: 'c' }, { from: 'c', to: 'a' }, { from: 'a', to: 'b' }]),
  ).toEqual([['a', 'b', 'c', 'a']]));
test('reports two disjoint cycles', () => {
  const cycles = findCycles(
    ['a', 'b', 'x', 'y', 'z'],
    [{ from: 'b', to: 'a' }, { from: 'a', to: 'b' }, { from: 'z', to: 'x' }, { from: 'x', to: 'y' }, { from: 'y', to: 'z' }],
  );
  expect(cycles).toHaveLength(2);
  expect(cycles).toContainEqual(['a', 'b', 'a']);
  expect(cycles).toContainEqual(['x', 'y', 'z', 'x']);
});
test('self-loop is a cycle', () => expect(findCycles(['a'], [{ from: 'a', to: 'a' }])).toEqual([['a', 'a']]));
