import { expect, test } from 'vitest';
import { EXAMPLE, NET, backward, forward, loss, steps } from '../../../src/viz/backpropagation/model';
import type { Net } from '../../../src/viz/backpropagation/model';

const H = 1e-6;
const { x, y } = EXAMPLE;

/** Every weight as a path into the net, so each can be nudged for a finite difference. */
const params: [string, (n: Net) => number, (n: Net, v: number) => void][] = [
  ...[0, 1].flatMap((j) =>
    [0, 1].map((i): [string, (n: Net) => number, (n: Net, v: number) => void] => [
      `W1[${j}][${i}]`,
      (n) => n.W1[j][i],
      (n, v) => (n.W1[j][i] = v),
    ]),
  ),
  ...[0, 1].map((j): [string, (n: Net) => number, (n: Net, v: number) => void] => [`b1[${j}]`, (n) => n.b1[j], (n, v) => (n.b1[j] = v)]),
  ...[0, 1].map((j): [string, (n: Net) => number, (n: Net, v: number) => void] => [`w2[${j}]`, (n) => n.w2[j], (n, v) => (n.w2[j] = v)]),
  ['b2', (n) => n.b2, (n, v) => (n.b2 = v)],
];
const clone = (n: Net): Net => structuredClone(n);
const gradOf = (name: string, g: ReturnType<typeof backward>) => {
  const m = name.match(/^(\w+)(?:\[(\d)\])?(?:\[(\d)\])?$/)!;
  const v = (g as unknown as Record<string, number | number[] | number[][]>)[m[1]];
  if (m[3] !== undefined) return (v as number[][])[Number(m[2])][Number(m[3])];
  if (m[2] !== undefined) return (v as number[])[Number(m[2])];
  return v as number;
};

test('forward gives hidden values and an output between 0 and 1', () => {
  const f = forward(NET, x);
  expect(f.h).toHaveLength(2);
  expect(f.out).toBeGreaterThan(0);
  expect(f.out).toBeLessThan(1);
});
test.each(params.map((p) => [p[0], p] as const))('backward matches a finite difference for %s', (name, [, get, set]) => {
  const plus = clone(NET);
  set(plus, get(plus) + H);
  const minus = clone(NET);
  set(minus, get(minus) - H);
  const numeric = (loss(plus, x, y) - loss(minus, x, y)) / (2 * H);
  expect(Math.abs(gradOf(name, backward(NET, x, y)) - numeric)).toBeLessThan(1e-6);
});
test('steps has six phases in order', () => {
  expect(steps(NET, x, y).map((p) => p.name)).toEqual([
    'forward: hidden units',
    'forward: output',
    'loss',
    'backward: output gradient',
    'backward: hidden gradients',
    'backward: weight gradients',
  ]);
  for (const p of steps(NET, x, y)) for (const v of p.values) expect(Number.isFinite(v.value)).toBe(true);
});
