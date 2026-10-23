import { expect, test } from 'vitest';
import { bayesCounts, posterior } from '../../../src/viz/bayes-rule/model';

test('posterior at 1% base rate matches the hand calculation', () =>
  expect(Math.abs(posterior(0.01) - 0.009 / (0.009 + 0.099))).toBeLessThan(1e-4));
test('posterior at 1% is about 0.0833', () => expect(posterior(0.01)).toBeCloseTo(0.0833, 4));
test('posterior at 50% is 0.9', () => expect(posterior(0.5)).toBeCloseTo(0.9));
test('bayesCounts(0.01): 9 true positives, 99 false positives, 1000 in all', () => {
  const c = bayesCounts(0.01);
  expect(c).toMatchObject({ tp: 9, fp: 99 });
  expect(c.tp + c.fp + c.fn + c.tn).toBe(1000);
  expect(c.fn).toBe(1);
});
test('counts are integers that sum to n for many base rates', () => {
  for (const b of [0.001, 0.0137, 0.2, 0.5]) {
    const c = bayesCounts(b);
    expect(Object.values(c).every(Number.isInteger)).toBe(true);
    expect(c.tp + c.fp + c.fn + c.tn).toBe(1000);
  }
});
test('posterior rises with the base rate', () => {
  const ps = [0.001, 0.01, 0.05, 0.1, 0.3, 0.5].map((b) => posterior(b));
  for (let i = 1; i < ps.length; i++) expect(ps[i]).toBeGreaterThan(ps[i - 1]);
});
