import { expect, test } from 'vitest';
import { bootstrapPrices, percentileInterval, resample } from '../../../src/viz/bootstrap/model';
import { mulberry32 } from '../../../src/viz/random';

const prices = bootstrapPrices();
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;

test('the data are the 20 training prices', () => expect(prices).toHaveLength(20));
test('a resample keeps the length and uses only original values', () => {
  const r = resample(prices, mulberry32(1));
  expect(r).toHaveLength(prices.length);
  for (const v of r) expect(prices).toContain(v);
});
test('with seed 1, at least one value repeats', () => {
  const r = resample(prices, mulberry32(1));
  expect(new Set(r).size).toBeLessThan(r.length);
});
test('the middle 95% of 1000 bootstrap means contains the sample mean', () => {
  const rand = mulberry32(2);
  const means = Array.from({ length: 1000 }, () => mean(resample(prices, rand)));
  const [lo, hi] = percentileInterval(means);
  expect(lo).toBeLessThan(mean(prices));
  expect(hi).toBeGreaterThan(mean(prices));
});
test('an interval of one value is that value twice', () => expect(percentileInterval([7])).toEqual([7, 7]));
