import { expect, test } from 'vitest';
import { emails, flatPrices } from '../../../src/viz/datasets';
import { mulberry32, normal } from '../../../src/viz/random';

test('flatPrices is deterministic, 40 points, 20 train', () => {
  expect(flatPrices()).toEqual(flatPrices());
  expect(flatPrices()).toHaveLength(40);
  expect(flatPrices().filter((p) => p.split === 'train')).toHaveLength(20);
  for (const p of flatPrices()) {
    expect(p.size).toBeGreaterThanOrEqual(30);
    expect(p.size).toBeLessThanOrEqual(150);
  }
});
test('flatPrices follow the curved trend', () => {
  const resid = flatPrices().map((p) => p.price - (40 + 3 * p.size - 0.006 * p.size ** 2));
  const mean = resid.reduce((a, b) => a + b, 0) / resid.length;
  expect(Math.abs(mean)).toBeLessThan(15);
});
test('emails: 80 points, 40 spam, values clipped, 60 train', () => {
  const e = emails();
  expect(e).toHaveLength(80);
  expect(e.filter((x) => x.label === 1)).toHaveLength(40);
  expect(e.filter((x) => x.split === 'train')).toHaveLength(60);
  for (const x of e) {
    expect(x.links).toBeGreaterThanOrEqual(0);
    expect(x.links).toBeLessThanOrEqual(10);
    expect(x.capsShare).toBeGreaterThanOrEqual(0);
    expect(x.capsShare).toBeLessThanOrEqual(1);
  }
  expect(emails()).toBe(e); // memoized
});
test('mulberry32 same seed same sequence', () => {
  const a = mulberry32(5);
  const b = mulberry32(5);
  const xs = Array.from({ length: 5 }, () => a());
  expect(Array.from({ length: 5 }, () => b())).toEqual(xs);
  expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  expect(mulberry32(6)()).not.toBe(xs[0]);
});
test('normal draws have about the right mean and spread', () => {
  const r = mulberry32(1);
  const xs = Array.from({ length: 4000 }, () => normal(r, 10, 2));
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  expect(mean).toBeCloseTo(10, 0);
  expect(sd).toBeCloseTo(2, 0);
});
