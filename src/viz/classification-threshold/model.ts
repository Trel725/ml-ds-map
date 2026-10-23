export interface Confusion {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** A fixed logistic model of "spam" from links and the share of capital letters. */
export function probability(e: { links: number; capsShare: number }): number {
  return sigmoid(-6 + 0.8 * e.links + 5 * e.capsShare);
}

/** Predict spam when p ≥ threshold, then count the four outcomes. */
export function confusion(probs: number[], labels: (0 | 1)[], threshold: number): Confusion {
  const c = { tp: 0, fp: 0, tn: 0, fn: 0 };
  probs.forEach((p, i) => {
    const yes = p >= threshold;
    if (yes && labels[i] === 1) c.tp++;
    else if (yes) c.fp++;
    else if (labels[i] === 1) c.fn++;
    else c.tn++;
  });
  return c;
}

/** Of the emails flagged, the share that really are spam. 1 when nothing is flagged. */
export function precision(c: Confusion): number {
  return c.tp + c.fp === 0 ? 1 : c.tp / (c.tp + c.fp);
}

/** Of the real spam, the share that got flagged. */
export function recall(c: Confusion): number {
  return c.tp + c.fn === 0 ? 1 : c.tp / (c.tp + c.fn);
}
