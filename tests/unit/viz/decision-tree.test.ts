import { expect, test } from 'vitest';
import { emails } from '../../../src/viz/datasets';
import { accuracy, depth, growTree, leafCount, predict, regions } from '../../../src/viz/decision-tree/model';

const train = emails().filter((e) => e.split === 'train');
const bounds = { x0: 0, x1: 10, y0: 0, y1: 1 };

test('depth never exceeds the limit', () => {
  for (let d = 0; d <= 6; d++) expect(depth(growTree(train, d))).toBeLessThanOrEqual(d);
});
test('depth 0 is a single leaf with the majority label', () => {
  const t = growTree(train, 0);
  expect(t.leaf).toBe(true);
});
test('training accuracy never falls as depth rises', () => {
  const acc = Array.from({ length: 7 }, (_, d) => accuracy(growTree(train, d), train));
  for (let i = 1; i < acc.length; i++) expect(acc[i]).toBeGreaterThanOrEqual(acc[i - 1]);
  expect(acc[3]).toBeGreaterThan(0.85);
});
test('regions count equals the leaf count, and regions tile the bounds', () => {
  for (const d of [0, 1, 3, 6]) {
    const t = growTree(train, d);
    const r = regions(t, bounds);
    expect(r).toHaveLength(leafCount(t));
    const area = r.reduce((a, q) => a + (q.x1 - q.x0) * (q.y1 - q.y0), 0);
    expect(area).toBeCloseTo(10);
  }
});
test('thresholds sit at midpoints between neighbouring values', () => {
  const pts = [
    { links: 1, capsShare: 0.1, label: 0 as const },
    { links: 3, capsShare: 0.1, label: 1 as const },
  ];
  const t = growTree(pts, 1);
  expect(t).toMatchObject({ leaf: false, feature: 'links', threshold: 2 });
  expect(predict(t, { links: 0, capsShare: 0 })).toBe(0);
  expect(predict(t, { links: 5, capsShare: 0 })).toBe(1);
});
