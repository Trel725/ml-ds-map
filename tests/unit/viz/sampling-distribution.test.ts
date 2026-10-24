import { expect, test } from 'vitest';
import { flatPrices, skewedPrices } from '../../../src/viz/datasets';
import { skewness } from '../../../src/viz/logarithms/model';
import { mulberry32 } from '../../../src/viz/random';
import { sampleMeans } from '../../../src/viz/sampling-distribution/model';

const pop = skewedPrices();
const sd = (v: number[]) => {
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
};

test('skewedPrices is shared, memoized and right-skewed', () => {
  expect(skewedPrices()).toBe(pop);
  expect(pop).toHaveLength(flatPrices().length);
  expect(skewness(pop)).toBeGreaterThan(0.5);
});
test('means of samples of 30 are less skewed than the population', () =>
  expect(skewness(sampleMeans(pop, 30, 2000, mulberry32(1)))).toBeLessThan(skewness(pop)));
test('the spread of the means shrinks like σ/√n', () => {
  const sigma = sd(pop);
  let prev = Infinity;
  for (const n of [2, 10, 30]) {
    const s = sd(sampleMeans(pop, n, 2000, mulberry32(2)));
    expect(s).toBeLessThan(prev);
    expect(Math.abs(s - sigma / Math.sqrt(n)) / (sigma / Math.sqrt(n))).toBeLessThan(0.25);
    prev = s;
  }
});
test('the same seed draws the same means', () =>
  expect(sampleMeans(pop, 5, 50, mulberry32(9))).toEqual(sampleMeans(pop, 5, 50, mulberry32(9))));
test('sample size 1 and count 0 are well-formed', () => {
  expect(sampleMeans(pop, 1, 10, mulberry32(3)).every((m) => pop.includes(m))).toBe(true);
  expect(sampleMeans(pop, 10, 0, mulberry32(3))).toEqual([]);
});
