import { expect, test } from 'vitest';
import { emails } from '../../../src/viz/datasets';
import { SEED, trainMLP } from '../../../src/viz/neuron-to-network/model';

// All 80 emails: the 60 training emails alone are separable by one line, so extra units could not help.
const train = emails();

test('the same seed trains the same network', () => {
  const a = trainMLP(train, 2, SEED);
  const b = trainMLP(train, 2, SEED);
  expect(a.loss).toBe(b.loss);
  expect(a.predict({ links: 3, capsShare: 0.4 })).toBe(b.predict({ links: 3, capsShare: 0.4 }));
});
test('training lowers the loss for 1 to 4 hidden units', () => {
  for (let h = 1; h <= 4; h++) {
    const net = trainMLP(train, h, SEED);
    expect(net.loss, `${h} hidden`).toBeLessThan(net.initialLoss);
  }
});
test('3 hidden units fit at least as well as 1', () =>
  expect(trainMLP(train, 3, SEED).loss).toBeLessThanOrEqual(trainMLP(train, 1, SEED).loss + 1e-6));
test('predictions are probabilities strictly between 0 and 1', () => {
  const net = trainMLP(train, 4, SEED);
  for (const p of [...train, { links: 0, capsShare: 0 }, { links: 10, capsShare: 1 }]) {
    const v = net.predict(p);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(1);
  }
});
test('each hidden unit exposes its own line in feature space', () => {
  const net = trainMLP(train, 3, SEED);
  expect(net.hiddenLines).toHaveLength(3);
  for (const l of net.hiddenLines) for (const v of [l.a, l.b, l.c]) expect(Number.isFinite(v)).toBe(true);
});
