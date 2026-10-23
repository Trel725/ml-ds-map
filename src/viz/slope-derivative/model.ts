export const f = (x: number): number => x * x;

/** Slope of the straight line through (a, f(a)) and (b, f(b)). */
export function secantSlope(fn: (x: number) => number, a: number, b: number): number {
  return (fn(b) - fn(a)) / (b - a);
}

/** Slope at one point: a secant over a vanishing gap (central difference). */
export function derivativeAt(fn: (x: number) => number, x: number, h = 1e-6): number {
  return (fn(x + h) - fn(x - h)) / (2 * h);
}
