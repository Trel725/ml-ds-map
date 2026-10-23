import { expect, test } from 'vitest';
import { L1, L2, gdPath1D, gdPath2D, grad1, grad2 } from '../../../src/viz/gradient-descent/model';

test('losses', () => {
  expect(L1(3)).toBe(9);
  expect(L2(1, 1)).toBe(5);
});
test('path starts at x0 and has steps + 1 points', () => {
  const p = gdPath1D(grad1, 3, 0.1, 5);
  expect(p).toHaveLength(6);
  expect(p[0]).toBe(3);
});
test('lr 0.1 converges in 50 steps', () => expect(Math.abs(gdPath1D(grad1, 3, 0.1, 50).at(-1)!)).toBeLessThan(0.01));
test('lr 1.1 diverges', () => {
  const p = gdPath1D(grad1, 3, 1.1, 20);
  expect(Math.abs(p[20])).toBeGreaterThan(Math.abs(p[0]));
});
test('lr 0.01 is slow', () => expect(Math.abs(gdPath1D(grad1, 3, 0.01, 50).at(-1)!)).toBeGreaterThan(1));
test('2D path with lr 0.1 converges toward [0, 0]', () => {
  const [x, y] = gdPath2D(grad2, [2.5, 1.5], 0.1, 100).at(-1)!;
  expect(Math.hypot(x, y)).toBeLessThan(0.01);
});
test('2D lr 0.3 overshoots on y: its sign alternates', () => {
  const ys = gdPath2D(grad2, [2.5, 1.5], 0.3, 6).map((p) => p[1]);
  for (let i = 1; i < ys.length; i++) expect(Math.sign(ys[i])).toBe(-Math.sign(ys[i - 1]));
});
