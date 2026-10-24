import { expect, test } from 'vitest';
import { flatPrices } from '../../../src/viz/datasets';
import { fitPolynomial, toScaled } from '../../../src/viz/overfitting/model';
import { fitLasso, fitRidge, polyFeatures } from '../../../src/viz/regularization/model';

const train = flatPrices().filter((p) => p.split === 'train').map((p) => ({ x: p.size, y: p.price }));
const weights = (c: number[]) => c.slice(1); // the intercept is not penalized
const l2 = (c: number[]) => Math.hypot(...weights(c));
const l1 = (c: number[]) => weights(c).reduce((a, w) => a + Math.abs(w), 0);

test('polyFeatures gives scaled powers 1..degree', () => {
  const rows = polyFeatures([30, 90, 150], 3);
  expect(rows).toHaveLength(3);
  rows[0].forEach((v, j) => expect(v).toBeCloseTo(toScaled(30) ** (j + 1), 12));
  expect(rows[1]).toEqual([0, 0, 0]);
});
test('ridge with no penalty matches the plain polynomial fit', () => {
  const r = fitRidge(train, 9, 0);
  const p = fitPolynomial(train, 9);
  r.forEach((v, i) => expect(Math.abs(v - p[i])).toBeLessThan(1e-6));
});
test('ridge weights shrink as the penalty grows', () => {
  const norms = [0.001, 0.01, 0.1, 1, 10].map((s) => l2(fitRidge(train, 9, s)));
  for (let i = 1; i < norms.length; i++) expect(norms[i]).toBeLessThanOrEqual(norms[i - 1] + 1e-9);
});
test('lasso weights shrink as the penalty grows', () => {
  const norms = [0.001, 0.01, 0.1, 1, 10].map((s) => l1(fitLasso(train, 9, s)));
  for (let i = 1; i < norms.length; i++) expect(norms[i]).toBeLessThanOrEqual(norms[i - 1] * 1.001 + 1e-6);
});
test('lasso at strength 10 sets at least 5 of 9 weights exactly to zero; ridge sets none', () => {
  expect(weights(fitLasso(train, 9, 10)).filter((w) => w === 0).length).toBeGreaterThanOrEqual(5);
  expect(weights(fitRidge(train, 9, 10)).filter((w) => w === 0).length).toBe(0);
});
test('both stay finite at strength 1000', () => {
  for (const c of [fitRidge(train, 9, 1000), fitLasso(train, 9, 1000)]) {
    expect(c).toHaveLength(10);
    for (const v of c) expect(Number.isFinite(v)).toBe(true);
  }
});
