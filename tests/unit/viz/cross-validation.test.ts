import { expect, test } from 'vitest';
import { foldErrors, foldOf } from '../../../src/viz/cross-validation/model';
import { flatPrices } from '../../../src/viz/datasets';

const points = flatPrices().map((p) => ({ x: p.size, y: p.price }));
const sizes = (folds: number[], k: number) => Array.from({ length: k }, (_, f) => folds.filter((v) => v === f).length);

test('every index lands in exactly one fold', () => {
  const folds = foldOf(40, 5, 1);
  expect(folds).toHaveLength(40);
  for (const f of folds) expect(f >= 0 && f < 5 && Number.isInteger(f)).toBe(true);
});
test('40 points into 5 folds gives 8 each', () => expect(sizes(foldOf(40, 5, 1), 5)).toEqual([8, 8, 8, 8, 8]));
test('41 points: fold sizes differ by at most 1', () => {
  const s = sizes(foldOf(41, 5, 1), 5);
  expect(Math.max(...s) - Math.min(...s)).toBeLessThanOrEqual(1);
  expect(s.reduce((a, b) => a + b, 0)).toBe(41);
});
test('the same seed gives the same folds; the order is shuffled', () => {
  expect(foldOf(40, 5, 3)).toEqual(foldOf(40, 5, 3));
  expect(foldOf(40, 5, 3)).not.toEqual(Array.from({ length: 40 }, (_, i) => Math.floor(i / 8)));
});
test('foldErrors has one finite, positive error per fold', () => {
  const errs = foldErrors(points, 5, 1);
  expect(errs).toHaveLength(5);
  for (const e of errs) expect(Number.isFinite(e) && e > 0).toBe(true);
});
