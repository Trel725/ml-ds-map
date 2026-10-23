import { expect, test } from 'vitest';
import { histogram, powerOfTen, skewness } from '../../../src/viz/logarithms/model';
import { mulberry32, normal } from '../../../src/viz/random';

const rand = mulberry32(1);
const skewed = Array.from({ length: 500 }, () => Math.exp(normal(rand, 3, 1)));

test('histogram counts sum to n, in linear and log space', () => {
  for (const log of [false, true]) {
    const h = histogram(skewed, 12, log);
    expect(h).toHaveLength(12);
    expect(h.reduce((a, b) => a + b.count, 0)).toBe(skewed.length);
  }
});
test('histogram bins are equal width in the binned space', () => {
  const h = histogram([1, 10, 100, 1000], 3, true);
  expect(h[0].x0).toBeCloseTo(0);
  expect(h.at(-1)!.x1).toBeCloseTo(3);
  expect(h[1].x1 - h[1].x0).toBeCloseTo(h[0].x1 - h[0].x0);
  expect(h.map((b) => b.count)).toEqual([1, 1, 2]);
});
test('skewness of log10 values is smaller than skewness of the values', () => {
  expect(skewness(skewed)).toBeGreaterThan(1);
  expect(skewness(skewed.map(Math.log10))).toBeLessThan(skewness(skewed));
});
test('skewness of a symmetric sample is about 0', () => expect(skewness([1, 2, 3, 4, 5])).toBeCloseTo(0));
test('logs turn multiplying into adding', () => {
  for (const [a, b] of [[2, 50], [10, 1000], [3.5, 7]]) expect(powerOfTen(a * b)).toBeCloseTo(powerOfTen(a) + powerOfTen(b));
  expect(powerOfTen(1000)).toBeCloseTo(3);
});
