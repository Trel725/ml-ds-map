import { emails } from '../datasets';
import { standardize } from '../knn/model';

export type Point = [number, number];

/** Standardized email features (links, capitals), all 80 emails. */
export function pcaPoints(): Point[] {
  const all = emails();
  return all.map(standardize(all));
}

function moments(points: Point[]) {
  const n = points.length;
  const mx = points.reduce((a, p) => a + p[0], 0) / n;
  const my = points.reduce((a, p) => a + p[1], 0) / n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const [px, py] of points) {
    sxx += (px - mx) ** 2;
    syy += (py - my) ** 2;
    sxy += (px - mx) * (py - my);
  }
  return { mx, my, sxx: sxx / n, syy: syy / n, sxy: sxy / n };
}

/** Variance of the points projected onto the unit vector at `angleDeg` through their mean. */
export function projectionSpread(points: Point[], angleDeg: number): number {
  const { sxx, syy, sxy } = moments(points);
  const t = (angleDeg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return c * c * sxx + 2 * c * s * sxy + s * s * syy;
}

/** Total variance: the spread kept by both directions together. */
export function totalSpread(points: Point[]): number {
  const { sxx, syy } = moments(points);
  return sxx + syy;
}

/** The angle in [0, 180) of the 2×2 covariance matrix's top eigenvector, in closed form. */
export function bestAngle(points: Point[]): number {
  const { sxx, syy, sxy } = moments(points);
  const deg = ((0.5 * Math.atan2(2 * sxy, sxx - syy)) * 180) / Math.PI;
  return ((deg % 180) + 180) % 180;
}

/** The mean of the points, where the projection line passes through. */
export function center(points: Point[]): Point {
  const { mx, my } = moments(points);
  return [mx, my];
}
