import { expect, test } from 'vitest';
import { decompose, makeSeries, seasonalSwing } from '../../../src/viz/time-series-decomposition/model';

test('makeSeries is seeded and 48 months long', () => {
  expect(makeSeries(1, 10)).toHaveLength(48);
  expect(makeSeries(1, 10)).toEqual(makeSeries(1, 10));
});
test('on a noise-free series the interior trend sits within 0.5 of the true line', () => {
  const s = makeSeries(1.5, 12, 48, 5, 0);
  const { trend } = decompose(s);
  let defined = 0;
  trend.forEach((v, t) => {
    if (v === null) return;
    defined++;
    expect(Math.abs(v - (100 + 1.5 * t))).toBeLessThan(0.5);
  });
  expect(defined).toBe(48 - 12);
});
test('trend + seasonal + residual rebuilds the series wherever the trend exists', () => {
  const s = makeSeries(-0.7, 15);
  const { trend, seasonal, residual } = decompose(s);
  expect(seasonal).toHaveLength(48);
  s.forEach((y, t) => {
    if (trend[t] === null) {
      expect(residual[t]).toBeNull();
      return;
    }
    expect(trend[t]! + seasonal[t] + residual[t]!).toBeCloseTo(y, 9);
  });
  const twelve = seasonal.slice(0, 12).reduce((a, b) => a + b, 0);
  expect(twelve).toBeCloseTo(0, 9);
});
test('no trend and no season leaves a seasonal swing under 3', () => {
  const { seasonal } = decompose(makeSeries(0, 0));
  expect(seasonalSwing(seasonal)).toBeLessThan(3);
  for (const v of seasonal) expect(Number.isFinite(v)).toBe(true);
});
