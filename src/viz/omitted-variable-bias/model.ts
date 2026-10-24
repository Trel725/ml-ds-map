import { fitOLS } from '../ols-fit/model';
import { mulberry32, normal } from '../random';

export interface Flat {
  /** Square meters. */
  size: number;
  /** Kilometers to the centre. */
  distance: number;
  /** Thousands. */
  price: number;
}

let cached: Flat[] | null = null;

/** 60 flats where size raises the price, distance lowers it, and bigger flats sit farther out. */
export function ovbFlats(): Flat[] {
  if (cached) return cached;
  const rand = mulberry32(11);
  cached = Array.from({ length: 60 }, () => {
    const size = 30 + rand() * 120;
    const distance = 0.1 * size + normal(rand, 0, 1);
    // A base of 300k keeps every price positive; it moves only the intercept.
    return { size, distance, price: 300 + 2 * size - 25 * distance + normal(rand, 0, 15) };
  });
  return cached;
}

/** Slope of price on size alone. */
export function fitSimple(flats: Flat[]): number {
  return fitOLS(flats.map((f) => ({ x: f.size, y: f.price }))).slope;
}

/** OLS of price on size and distance, closed form via the centred 2×2 normal equations. */
export function fitWithControl(flats: Flat[]): { intercept: number; size: number; distance: number } {
  const n = flats.length;
  const ms = flats.reduce((a, f) => a + f.size, 0) / n;
  const md = flats.reduce((a, f) => a + f.distance, 0) / n;
  const mp = flats.reduce((a, f) => a + f.price, 0) / n;
  let ss = 0;
  let dd = 0;
  let sd = 0;
  let sp = 0;
  let dp = 0;
  for (const f of flats) {
    const s = f.size - ms;
    const d = f.distance - md;
    const p = f.price - mp;
    ss += s * s;
    dd += d * d;
    sd += s * d;
    sp += s * p;
    dp += d * p;
  }
  const det = ss * dd - sd * sd;
  const size = (dd * sp - sd * dp) / det;
  const distance = (ss * dp - sd * sp) / det;
  return { intercept: mp - size * ms - distance * md, size, distance };
}
