import { expect, test } from 'vitest';
import { flatPrices } from '../../../src/viz/datasets';
import { fitOLS, totalSquareArea } from '../../../src/viz/ols-fit/model';

test('(0,1), (1,3), (2,5) give slope 2 and intercept 1', () => {
  const l = fitOLS([{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }]);
  expect(l.slope).toBeCloseTo(2);
  expect(l.intercept).toBeCloseTo(1);
});

test('matches the normal equations on flatPrices train', () => {
  const pts = flatPrices().filter((p) => p.split === 'train').map((p) => ({ x: p.size, y: p.price }));
  // (XᵀX)⁻¹Xᵀy with X = [1, x], solved by hand for the 2×2 case
  const n = pts.length;
  const sx = pts.reduce((a, p) => a + p.x, 0);
  const sxx = pts.reduce((a, p) => a + p.x * p.x, 0);
  const sy = pts.reduce((a, p) => a + p.y, 0);
  const sxy = pts.reduce((a, p) => a + p.x * p.y, 0);
  const det = n * sxx - sx * sx;
  const intercept = (sxx * sy - sx * sxy) / det;
  const slope = (n * sxy - sx * sy) / det;
  const l = fitOLS(pts);
  expect(Math.abs(l.slope - slope)).toBeLessThan(1e-6);
  expect(Math.abs(l.intercept - intercept)).toBeLessThan(1e-6);
});

test('nudging the slope increases the total square area', () => {
  const pts = flatPrices().slice(0, 12).map((p) => ({ x: p.size, y: p.price }));
  const best = fitOLS(pts);
  const area = totalSquareArea(pts, best);
  expect(totalSquareArea(pts, { ...best, slope: best.slope + 0.01 })).toBeGreaterThan(area);
  expect(totalSquareArea(pts, { ...best, slope: best.slope - 0.01 })).toBeGreaterThan(area);
});

test('total square area of a perfect fit is 0', () =>
  expect(totalSquareArea([{ x: 0, y: 1 }, { x: 1, y: 3 }], { slope: 2, intercept: 1 })).toBe(0));
