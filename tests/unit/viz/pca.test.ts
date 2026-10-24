import { expect, test } from 'vitest';
import { bestAngle, pcaPoints, projectionSpread, totalSpread } from '../../../src/viz/pca/model';

const pts = pcaPoints();

test('bestAngle maximizes the spread over a 1° grid, within 1°', () => {
  const best = bestAngle(pts);
  expect(best).toBeGreaterThanOrEqual(0);
  expect(best).toBeLessThan(180);
  let gridBest = 0;
  for (let a = 0; a < 180; a++) if (projectionSpread(pts, a) > projectionSpread(pts, gridBest)) gridBest = a;
  const gap = Math.min(Math.abs(best - gridBest), 180 - Math.abs(best - gridBest));
  expect(gap).toBeLessThanOrEqual(1);
  expect(projectionSpread(pts, best)).toBeGreaterThanOrEqual(projectionSpread(pts, gridBest) - 1e-9);
});
test('the spread at the best angle plus at 90° from it is the total spread', () => {
  const best = bestAngle(pts);
  expect(projectionSpread(pts, best) + projectionSpread(pts, best + 90)).toBeCloseTo(totalSpread(pts), 9);
});
test('0° and 180° give the same spread', () => expect(projectionSpread(pts, 0)).toBeCloseTo(projectionSpread(pts, 180), 12));
test('points are standardized emails', () => {
  expect(pts).toHaveLength(80);
  expect(totalSpread(pts)).toBeCloseTo(2, 9);
});
