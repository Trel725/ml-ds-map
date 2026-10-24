import { expect, test } from 'vitest';
import { emails } from '../../../src/viz/datasets';
import { neighbors, standardize, vote } from '../../../src/viz/knn/model';

const train = emails().filter((e) => e.split === 'train');
const query = { links: 4, capsShare: 0.9 };

test('scaling changes who the neighbors are, since links dominate unscaled distance', () => {
  const raw = neighbors(train, query, 5, false);
  const scaled = neighbors(train, query, 5, true);
  expect(new Set(raw)).not.toEqual(new Set(scaled));
  // Unscaled, every neighbor sits within one link of the query.
  for (const i of raw) expect(Math.abs(train[i].links - query.links)).toBeLessThan(1);
});
test('k = 5 gives 5 distinct indices', () => {
  for (const scaled of [false, true]) {
    const idx = neighbors(train, query, 5, scaled);
    expect(idx).toHaveLength(5);
    expect(new Set(idx).size).toBe(5);
  }
});
test('standardize gives train features mean 0 and spread 1', () => {
  const z = standardize(train);
  const cols = train.map(z);
  for (const c of [0, 1]) {
    const m = cols.reduce((a, r) => a + r[c], 0) / cols.length;
    const sd = Math.sqrt(cols.reduce((a, r) => a + (r[c] - m) ** 2, 0) / cols.length);
    expect(m).toBeCloseTo(0, 9);
    expect(sd).toBeCloseTo(1, 9);
  }
});
test('a tied vote goes to spam, as in the decision tree', () => {
  const pts = [
    { links: 0, capsShare: 0, label: 1 as const },
    { links: 1, capsShare: 0, label: 0 as const },
  ];
  expect(vote(pts, [0, 1])).toBe(1);
  expect(vote(pts, [1])).toBe(0);
});
