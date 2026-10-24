import { leastSquares, toScaled } from '../overfitting/model';
import type { Pt } from '../overfitting/model';

/** Feature rows [s, s², …, s^degree] for scaled x; the intercept column is added by the fits. */
export function polyFeatures(xs: number[], degree: number): number[][] {
  return xs.map((x) => Array.from({ length: degree }, (_, j) => toScaled(x) ** (j + 1)));
}

/**
 * Ridge: minimizes mean squared error + strength · Σ wⱼ², intercept unpenalized.
 * Solved as least squares on rows augmented with √(n · strength) · I.
 * Returns [intercept, w₁ … w_degree] in scaled x, like fitPolynomial.
 */
export function fitRidge(points: Pt[], degree: number, strength: number): number[] {
  const n = points.length;
  const rows = polyFeatures(points.map((p) => p.x), degree).map((r) => [1, ...r]);
  const rhs = points.map((p) => p.y);
  const k = Math.sqrt(n * strength);
  for (let j = 1; j <= degree; j++) {
    rows.push(Array.from({ length: degree + 1 }, (_, c) => (c === j ? k : 0)));
    rhs.push(0);
  }
  return leastSquares(rows, rhs);
}

const softThreshold = (v: number, t: number) => (v > t ? v - t : v < -t ? v + t : 0);

/**
 * Lasso: minimizes (1 / 2n) · squared error + strength · Σ |wⱼ|, intercept unpenalized.
 * Coordinate descent with soft-thresholding. Returns [intercept, w₁ … w_degree].
 */
export function fitLasso(points: Pt[], degree: number, strength: number, iters = 2000): number[] {
  const n = points.length;
  const X = polyFeatures(points.map((p) => p.x), degree);
  const y = points.map((p) => p.y);
  const w = new Array<number>(degree).fill(0);
  const colSq = Array.from({ length: degree }, (_, j) => X.reduce((a, r) => a + r[j] ** 2, 0) / n);
  let b = y.reduce((a, v) => a + v, 0) / n;
  const resid = y.map((v) => v - b);

  for (let it = 0; it < iters; it++) {
    // Intercept: the mean residual, since it carries no penalty.
    const shift = resid.reduce((a, v) => a + v, 0) / n;
    b += shift;
    for (let i = 0; i < n; i++) resid[i] -= shift;
    for (let j = 0; j < degree; j++) {
      if (colSq[j] === 0) continue;
      let rho = 0;
      for (let i = 0; i < n; i++) rho += X[i][j] * (resid[i] + X[i][j] * w[j]);
      const next = softThreshold(rho / n, strength) / colSq[j];
      const delta = next - w[j];
      if (delta !== 0) {
        for (let i = 0; i < n; i++) resid[i] -= X[i][j] * delta;
        w[j] = next;
      }
    }
  }
  return [b, ...w];
}
