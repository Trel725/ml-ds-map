import { fitOLS } from '../ols-fit/model';
import type { Line, Pt } from '../ols-fit/model';
import { mulberry32, shuffledIndices } from '../random';

/** The fold (0..k-1) of each of n points: a seeded shuffle dealt round-robin, so sizes differ by at most 1. */
export function foldOf(n: number, k: number, seed: number): number[] {
  const folds = new Array<number>(n);
  shuffledIndices(mulberry32(seed), n).forEach((idx, i) => (folds[idx] = i % k));
  return folds;
}

/** The OLS line trained on every fold but `fold`. */
export function fitWithout(points: Pt[], folds: number[], fold: number): Line {
  return fitOLS(points.filter((_, i) => folds[i] !== fold));
}

/** Mean squared error on each held-out fold, with OLS trained on the others. */
export function foldErrors(points: Pt[], k: number, seed: number): number[] {
  const folds = foldOf(points.length, k, seed);
  return Array.from({ length: k }, (_, f) => {
    const line = fitWithout(points, folds, f);
    const held = points.filter((_, i) => folds[i] === f);
    return held.reduce((a, p) => a + (p.y - (line.intercept + line.slope * p.x)) ** 2, 0) / held.length;
  });
}
