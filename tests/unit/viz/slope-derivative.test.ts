import { expect, test } from 'vitest';
import { derivativeAt, f, secantSlope } from '../../../src/viz/slope-derivative/model';

test('f is x squared', () => expect(f(3)).toBe(9));
test('secant slope between 1 and 3 is 4', () => expect(secantSlope(f, 1, 3)).toBe(4));
test('derivative at 1 is about 2', () => expect(Math.abs(derivativeAt(f, 1) - 2)).toBeLessThan(1e-4));
test('secant slope approaches the derivative as the points close in', () => {
  const gaps = [2, 1.5, 1.1, 1.01].map((b) => Math.abs(secantSlope(f, 1, b) - 2));
  for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeLessThan(gaps[i - 1]);
});
