import { expect, test } from 'vitest';
import { fitSimple, fitWithControl, ovbFlats } from '../../../src/viz/omitted-variable-bias/model';

const flats = ovbFlats();

test('60 seeded flats where bigger flats sit farther out', () => {
  expect(flats).toHaveLength(60);
  expect(ovbFlats()).toEqual(flats);
  for (const f of flats) {
    expect(f.size).toBeGreaterThanOrEqual(30);
    expect(f.size).toBeLessThanOrEqual(150);
  }
});
test('leaving out distance makes size look harmful', () => expect(fitSimple(flats)).toBeLessThan(0));
test('controlling for distance recovers the size effect', () => {
  const c = fitWithControl(flats);
  expect(Math.abs(c.size - 2)).toBeLessThan(0.3);
  expect(Math.abs(c.distance + 25)).toBeLessThan(3);
  expect(Number.isFinite(c.intercept)).toBe(true);
});
