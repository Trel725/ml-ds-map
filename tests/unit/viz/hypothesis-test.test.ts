import { expect, test } from 'vitest';
import { diffInMeans, linksByLabel, pValue, shuffledDiffs } from '../../../src/viz/hypothesis-test/model';
import { mulberry32 } from '../../../src/viz/random';

const { values, labels } = linksByLabel();

test('the data are links for all 80 emails, by label', () => {
  expect(values).toHaveLength(80);
  expect(labels.filter((l) => l === 1)).toHaveLength(40);
});
test('the real gap is spam links minus normal links', () => expect(diffInMeans(values, labels)).toBeGreaterThan(2));
test('shuffled gaps average near zero', () => {
  const d = shuffledDiffs(values, labels, 1000, mulberry32(1));
  expect(Math.abs(d.reduce((a, b) => a + b, 0) / d.length)).toBeLessThan(0.3);
});
test('with the real labels, p < 0.01 after 1000 shuffles', () => {
  const p = pValue(diffInMeans(values, labels), shuffledDiffs(values, labels, 1000, mulberry32(2)));
  expect(p).toBeGreaterThanOrEqual(0);
  expect(p).toBeLessThan(0.01);
});
test('with labels unrelated to links, p > 0.05', () => {
  const rand = mulberry32(3);
  const noise = values.map(() => (rand() < 0.5 ? 1 : 0) as 0 | 1);
  const p = pValue(diffInMeans(values, noise), shuffledDiffs(values, noise, 1000, mulberry32(4)));
  expect(p).toBeGreaterThan(0.05);
  expect(p).toBeLessThanOrEqual(1);
});
test('no shuffles yet gives p = 1', () => expect(pValue(1.5, [])).toBe(1));
