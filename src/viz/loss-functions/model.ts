export const P_MIN = 0.01;
export const P_MAX = 0.99;

export const clampP = (p: number): number => Math.min(P_MAX, Math.max(P_MIN, p));

/** Three losses for a true answer of 1 and predicted probability `p` (clamped so the log stays finite). */
export function losses(p: number): { squared: number; absolute: number; log: number } {
  const q = clampP(p);
  return { squared: (1 - q) ** 2, absolute: Math.abs(1 - q), log: -Math.log(q) };
}
