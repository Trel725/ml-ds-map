import { expect, test } from 'vitest';
import { assign, inertia, kMeansStart, move } from '../../../src/viz/k-means/model';

const { points, centroids: start } = kMeansStart();

test('the start is 3 seeded centroids over standardized emails', () => {
  expect(start).toHaveLength(3);
  expect(kMeansStart()).toEqual(kMeansStart());
  const mean = points.reduce((a, p) => a + p[0], 0) / points.length;
  expect(mean).toBeCloseTo(0, 9);
});
test('total distance never rises over alternating assign and move steps', () => {
  let c = start;
  let labels = assign(points, c);
  let prev = inertia(points, labels, c);
  for (let i = 0; i < 20; i++) {
    c = move(points, labels, c);
    const afterMove = inertia(points, labels, c);
    expect(afterMove).toBeLessThanOrEqual(prev + 1e-9);
    labels = assign(points, c);
    const afterAssign = inertia(points, labels, c);
    expect(afterAssign).toBeLessThanOrEqual(afterMove + 1e-9);
    prev = afterAssign;
  }
});
test('after convergence, a further step changes nothing', () => {
  let c = start;
  let labels = assign(points, c);
  for (let i = 0; i < 100; i++) {
    c = move(points, labels, c);
    labels = assign(points, c);
  }
  expect(move(points, labels, c)).toEqual(c);
  expect(assign(points, c)).toEqual(labels);
});
test('an empty cluster keeps its centroid and stays finite', () => {
  const far: [number, number][] = [[0, 0], [10, 10], [100, 100]];
  const pts: [number, number][] = [[0, 0.1], [0.1, 0], [10, 10.2]];
  const labels = assign(pts, far);
  expect(labels).toEqual([0, 0, 1]);
  const next = move(pts, labels, far);
  expect(next[2]).toEqual([100, 100]);
  for (const c of next) for (const v of c) expect(Number.isFinite(v)).toBe(true);
  expect(Number.isFinite(inertia(pts, labels, next))).toBe(true);
});
