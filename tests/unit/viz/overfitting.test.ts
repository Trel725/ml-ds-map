import { expect, test } from 'vitest';
import { flatPrices } from '../../../src/viz/datasets';
import { fitOLS } from '../../../src/viz/ols-fit/model';
import { X_HALF, X_MID, evalPoly, fitPolynomial, mse, toScaled } from '../../../src/viz/overfitting/model';

const pts = (split: 'train' | 'test') => flatPrices().filter((p) => p.split === split).map((p) => ({ x: p.size, y: p.price }));
const train = pts('train');
const test_ = pts('test');

test('fitPolynomial recovers an exact cubic', () => {
  const cubic = (s: number) => 1 - 2 * s + 0.5 * s ** 3;
  const points = [-1, -0.6, -0.2, 0.1, 0.4, 0.8, 1].map((s) => ({ x: X_MID + s * X_HALF, y: cubic(s) }));
  const c = fitPolynomial(points, 3);
  expect(c).toHaveLength(4);
  [1, -2, 0, 0.5].forEach((v, i) => expect(c[i]).toBeCloseTo(v, 8));
  expect(evalPoly(c, toScaled(X_MID))).toBeCloseTo(1, 8);
});
test('train MSE never rises as degree rises (1 → 9)', () => {
  const errs = Array.from({ length: 9 }, (_, i) => mse(train, fitPolynomial(train, i + 1)));
  for (let i = 1; i < errs.length; i++) expect(errs[i]).toBeLessThanOrEqual(errs[i - 1] + 1e-9);
});
test('degree-1 coefficients match fitOLS after rescaling', () => {
  const [c0, c1] = fitPolynomial(train, 1);
  const ols = fitOLS(train);
  expect(c1 / X_HALF).toBeCloseTo(ols.slope, 8);
  expect(c0 - (c1 * X_MID) / X_HALF).toBeCloseTo(ols.intercept, 6);
});
test('degree 9 does worse on test data than degree 2', () =>
  expect(mse(test_, fitPolynomial(train, 9))).toBeGreaterThan(mse(test_, fitPolynomial(train, 2))));
