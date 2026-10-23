import { expect, test } from 'vitest';
import { confusion, precision, probability, recall } from '../../../src/viz/classification-threshold/model';
import { emails } from '../../../src/viz/datasets';

const all = emails();
const probs = all.map(probability);
const labels = all.map((e) => e.label);
const thresholds = Array.from({ length: 11 }, (_, i) => i / 10);

test('probability is a sigmoid of links and capitals', () => {
  expect(probability({ links: 0, capsShare: 0 })).toBeCloseTo(1 / (1 + Math.exp(6)));
  expect(probability({ links: 7.5, capsShare: 0 })).toBeCloseTo(0.5);
});
test('confusion matrix sums to n at every threshold', () => {
  for (const t of thresholds) {
    const c = confusion(probs, labels, t);
    expect(c.tp + c.fp + c.tn + c.fn).toBe(all.length);
  }
});
test('recall never rises as the threshold rises', () => {
  const r = thresholds.map((t) => recall(confusion(probs, labels, t)));
  for (let i = 1; i < r.length; i++) expect(r[i]).toBeLessThanOrEqual(r[i - 1]);
});
test('threshold 0 catches everything', () => expect(recall(confusion(probs, labels, 0))).toBe(1));
test('threshold above 1 predicts nothing; precision is defined as 1', () => {
  const c = confusion(probs, labels, 1.01);
  expect(c.tp).toBe(0);
  expect(precision(c)).toBe(1);
});
test('predict 1 when p ≥ threshold', () => expect(confusion([0.5], [1], 0.5)).toEqual({ tp: 1, fp: 0, tn: 0, fn: 0 }));
