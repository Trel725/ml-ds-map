export interface Pt {
  x: number;
  y: number;
}
export interface Line {
  slope: number;
  intercept: number;
}

/** Least squares line, closed form: slope = cov(x, y) / var(x). */
export function fitOLS(points: Pt[]): Line {
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.x, 0) / n;
  const my = points.reduce((a, p) => a + p.y, 0) / n;
  let cov = 0;
  let varx = 0;
  for (const p of points) {
    cov += (p.x - mx) * (p.y - my);
    varx += (p.x - mx) ** 2;
  }
  const slope = varx === 0 ? 0 : cov / varx;
  return { slope, intercept: my - slope * mx };
}

/** Sum of squared vertical misses: the total area of the squares drawn on each residual. */
export function totalSquareArea(points: Pt[], line: Line): number {
  return points.reduce((a, p) => a + (p.y - (line.intercept + line.slope * p.x)) ** 2, 0);
}
