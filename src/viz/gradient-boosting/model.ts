import type { Pt } from '../ols-fit/model';

export interface Stump {
  split: number;
  left: number;
  right: number;
}

const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);

/** The single cut on x (midway between neighbours) with the smallest squared error; each side predicts its mean. */
export function fitStump(xs: number[], ys: number[]): Stump {
  const order = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
  const sx = order.map((i) => xs[i]);
  const sy = order.map((i) => ys[i]);
  const total = sy.reduce((a, b) => a + b, 0);
  const totalSq = sy.reduce((a, b) => a + b * b, 0);
  let best: Stump = { split: Infinity, left: mean(sy), right: mean(sy) };
  let bestSse = totalSq - (total * total) / Math.max(1, sy.length);
  let leftSum = 0;
  let leftSq = 0;
  for (let i = 1; i < sx.length; i++) {
    leftSum += sy[i - 1];
    leftSq += sy[i - 1] ** 2;
    if (sx[i] === sx[i - 1]) continue;
    const nl = i;
    const nr = sx.length - i;
    const rightSum = total - leftSum;
    const sse = leftSq - leftSum ** 2 / nl + (totalSq - leftSq) - rightSum ** 2 / nr;
    if (sse < bestSse - 1e-9) {
      bestSse = sse;
      best = { split: (sx[i - 1] + sx[i]) / 2, left: leftSum / nl, right: rightSum / nr };
    }
  }
  return best;
}

export const stumpAt = (s: Stump, x: number): number => (x <= s.split ? s.left : s.right);

/** Gradient boosting with squared error: start at the mean, then add `rate` × a stump fitted to the residuals. */
export function boostStumps(points: Pt[], nTrees: number, rate = 0.3): { base: number; stumps: Stump[] } {
  const base = mean(points.map((p) => p.y));
  const preds = points.map(() => base);
  const stumps: Stump[] = [];
  for (let t = 0; t < nTrees; t++) {
    const s = fitStump(
      points.map((p) => p.x),
      points.map((p, i) => p.y - preds[i]),
    );
    const scaled = { split: s.split, left: rate * s.left, right: rate * s.right };
    stumps.push(scaled);
    points.forEach((p, i) => (preds[i] += stumpAt(scaled, p.x)));
  }
  return { base, stumps };
}

/** Prediction at x after the first `n` stumps. */
export function predictAt(model: { base: number; stumps: Stump[] }, n: number, x: number): number {
  let v = model.base;
  for (let i = 0; i < n; i++) v += stumpAt(model.stumps[i], x);
  return v;
}

/** Predictions on the points after 0, 1, …, nTrees trees. */
export function boost(points: Pt[], nTrees: number, rate = 0.3): number[][] {
  const model = boostStumps(points, nTrees, rate);
  return Array.from({ length: nTrees + 1 }, (_, n) => points.map((p) => predictAt(model, n, p.x)));
}
