import { emails } from '../datasets';
import { standardize } from '../knn/model';
import { mulberry32 } from '../random';

export type Point = [number, number];
export type Centroid = [number, number];

export const K = 3;

const dist2 = (a: Point, b: Point) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

/** Each point's nearest centroid (ties go to the lower index). */
export function assign(points: Point[], centroids: Centroid[]): number[] {
  return points.map((p) => {
    let best = 0;
    for (let k = 1; k < centroids.length; k++) if (dist2(p, centroids[k]) < dist2(p, centroids[best])) best = k;
    return best;
  });
}

/** Each centroid moves to the mean of its points; an empty cluster keeps its centroid. */
export function move(points: Point[], labels: number[], centroids: Centroid[]): Centroid[] {
  return centroids.map((c, k) => {
    const mine = points.filter((_, i) => labels[i] === k);
    if (mine.length === 0) return c;
    return [mine.reduce((a, p) => a + p[0], 0) / mine.length, mine.reduce((a, p) => a + p[1], 0) / mine.length];
  });
}

/** Total squared distance from each point to its assigned centroid. */
export function inertia(points: Point[], labels: number[], centroids: Centroid[]): number {
  return points.reduce((a, p, i) => a + dist2(p, centroids[labels[i]]), 0);
}

/** Standardized email features and K seeded starting centroids placed on random points. */
export function kMeansStart(seed = 4): { points: Point[]; centroids: Centroid[] } {
  const all = emails();
  const z = standardize(all);
  const points = all.map(z);
  const rand = mulberry32(seed);
  const picked = new Set<number>();
  while (picked.size < K) picked.add(Math.floor(rand() * points.length));
  return { points, centroids: [...picked].map((i) => [...points[i]] as Centroid) };
}
