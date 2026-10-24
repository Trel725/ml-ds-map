import { expect, test } from 'vitest';
import { losses } from '../../../src/viz/loss-functions/model';

test('a confident right answer costs almost nothing in every loss', () => {
  const l = losses(0.99);
  expect(l.squared).toBeLessThan(0.02);
  expect(l.absolute).toBeLessThan(0.02);
  expect(l.log).toBeLessThan(0.02);
});
test('a confident wrong answer costs log loss the most', () => {
  const l = losses(0.01);
  expect(l.log).toBeGreaterThan(l.squared);
  expect(l.log).toBeGreaterThan(l.absolute);
});
test('every loss is non-increasing in the prediction', () => {
  let prev = losses(0.01);
  for (let i = 2; i <= 99; i++) {
    const l = losses(i / 100);
    expect(l.squared).toBeLessThanOrEqual(prev.squared);
    expect(l.absolute).toBeLessThanOrEqual(prev.absolute);
    expect(l.log).toBeLessThanOrEqual(prev.log);
    prev = l;
  }
});
test('p = 0 and p = 1 are clamped and finite', () => {
  expect(losses(0)).toEqual(losses(0.01));
  expect(losses(1)).toEqual(losses(0.99));
  for (const v of Object.values(losses(0))) expect(Number.isFinite(v)).toBe(true);
});
