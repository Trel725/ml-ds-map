import { expect, test } from 'vitest';
import { flatPrices } from '../../../src/viz/datasets';
import { boost, fitStump } from '../../../src/viz/gradient-boosting/model';

const train = flatPrices().filter((p) => p.split === 'train').map((p) => ({ x: p.size, y: p.price }));
const trainMse = (preds: number[]) => preds.reduce((a, p, i) => a + (train[i].y - p) ** 2, 0) / train.length;

test('a stump fitted to a step function finds the step', () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8];
  const ys = [0, 0, 0, 0, 10, 10, 10, 10];
  const s = fitStump(xs, ys);
  expect(s.split).toBeGreaterThan(4);
  expect(s.split).toBeLessThan(5);
  expect(s.left).toBeCloseTo(0);
  expect(s.right).toBeCloseTo(10);
});
test('before any tree, every prediction is the mean', () => {
  const mean = train.reduce((a, p) => a + p.y, 0) / train.length;
  for (const v of boost(train, 0)[0]) expect(v).toBeCloseTo(mean, 9);
});
test('training error never rises over 0..30 trees', () => {
  const steps = boost(train, 30);
  expect(steps).toHaveLength(31);
  for (let i = 1; i < steps.length; i++) expect(trainMse(steps[i])).toBeLessThanOrEqual(trainMse(steps[i - 1]) + 1e-9);
});
test('200 trees stay finite', () => {
  for (const v of boost(train, 200).at(-1)!) expect(Number.isFinite(v)).toBe(true);
});
