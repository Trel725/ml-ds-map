import { expect, test } from 'vitest';
import { fit1D, logLoss, logisticPoints, predict, sigmoid } from '../../../src/viz/logistic-regression/model';

const pts = logisticPoints();

test('sigmoid(0) is one half, and predict squashes into (0, 1)', () => {
  expect(sigmoid(0)).toBe(0.5);
  expect(predict(1, -2, 2)).toBeCloseTo(0.5, 12);
  expect(predict(3, 0, 100)).toBeLessThanOrEqual(1);
  expect(predict(3, 0, -100)).toBeGreaterThanOrEqual(0);
});
test('the fitted weight and bias sit at a minimum of log loss', () => {
  const { w, b } = fit1D(pts);
  const best = logLoss(pts, w, b);
  for (const [dw, db] of [[0.1, 0], [-0.1, 0], [0, 0.1], [0, -0.1]]) {
    expect(best).toBeLessThanOrEqual(logLoss(pts, w + dw, b + db));
  }
});
test('the loss stays finite at extreme weights', () => {
  for (const w of [-20, 20]) expect(Number.isFinite(logLoss(pts, w, 0))).toBe(true);
});
test('data are training emails: links against spam or not', () => {
  expect(pts).toHaveLength(60);
  for (const p of pts) expect([0, 1]).toContain(p.y);
});
