import { emails } from '../datasets';

export interface Pt {
  x: number;
  y: 0 | 1;
}

const EPS = 1e-9;

export const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));

/** Predicted chance of spam for x links. */
export const predict = (w: number, b: number, x: number): number => sigmoid(w * x + b);

/** Mean log loss, with probabilities clipped to [1e-9, 1 − 1e-9] so it stays finite. */
export function logLoss(points: Pt[], w: number, b: number): number {
  return (
    points.reduce((a, p) => {
      const q = Math.min(1 - EPS, Math.max(EPS, predict(w, b, p.x)));
      return a - (p.y === 1 ? Math.log(q) : Math.log(1 - q));
    }, 0) / points.length
  );
}

/** Plain gradient descent on mean log loss, from w = b = 0, for a fixed number of steps. */
export function fit1D(points: Pt[], iters = 20000, rate = 0.1): { w: number; b: number } {
  let w = 0;
  let b = 0;
  for (let i = 0; i < iters; i++) {
    let gw = 0;
    let gb = 0;
    for (const p of points) {
      const err = predict(w, b, p.x) - p.y;
      gw += err * p.x;
      gb += err;
    }
    w -= (rate * gw) / points.length;
    b -= (rate * gb) / points.length;
  }
  return { w, b };
}

/** Training emails as (links, spam or not). */
export function logisticPoints(): Pt[] {
  return emails()
    .filter((e) => e.split === 'train')
    .map((e) => ({ x: e.links, y: e.label }));
}
