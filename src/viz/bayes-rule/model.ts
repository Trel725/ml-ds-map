export interface Counts {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

/** Whole-person counts out of `n` for a test with the given sensitivity and specificity. */
export function bayesCounts(baseRate: number, sensitivity = 0.9, specificity = 0.9, n = 1000): Counts {
  const sick = Math.round(n * baseRate);
  const tp = Math.round(sick * sensitivity);
  const fp = Math.round((n - sick) * (1 - specificity));
  const fn = sick - tp;
  return { tp, fp, fn, tn: n - tp - fp - fn };
}

/** Chance of having the condition after a positive test (Bayes' rule). */
export function posterior(baseRate: number, sensitivity = 0.9, specificity = 0.9): number {
  const truePos = baseRate * sensitivity;
  const falsePos = (1 - baseRate) * (1 - specificity);
  return truePos / (truePos + falsePos);
}
