import { mulberry32, normal } from '../random';

/** Monthly values: 100 + trend·t + season·sin(2πt/12) + noise. Same seed, same noise. */
export function makeSeries(trend: number, season: number, n = 48, seed = 5, noise = 3): number[] {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, (_, t) => 100 + trend * t + season * Math.sin((2 * Math.PI * t) / 12) + normal(rand, 0, noise));
}

export interface Decomposition {
  /** Centred 2×period moving average; null within half a period of either end. */
  trend: (number | null)[];
  /** The repeating pattern, centred so one period sums to 0. */
  seasonal: number[];
  /** What is left; null where the trend is. */
  residual: (number | null)[];
}

/** Classical additive decomposition. */
export function decompose(series: number[], period = 12): Decomposition {
  const half = period / 2;
  const trend = series.map((_, t) => {
    if (t < half || t + half >= series.length) return null;
    let sum = 0.5 * series[t - half] + 0.5 * series[t + half];
    for (let k = t - half + 1; k < t + half; k++) sum += series[k];
    return sum / period;
  });

  const sums = new Array<number>(period).fill(0);
  const counts = new Array<number>(period).fill(0);
  trend.forEach((v, t) => {
    if (v === null) return;
    sums[t % period] += series[t] - v;
    counts[t % period]++;
  });
  const means = sums.map((s, k) => (counts[k] ? s / counts[k] : 0));
  const centre = means.reduce((a, b) => a + b, 0) / period;
  const pattern = means.map((m) => m - centre);

  const seasonal = series.map((_, t) => pattern[t % period]);
  const residual = series.map((y, t) => (trend[t] === null ? null : y - trend[t]! - seasonal[t]));
  return { trend, seasonal, residual };
}

/** The largest distance of the seasonal pattern from zero. */
export function seasonalSwing(seasonal: number[]): number {
  return seasonal.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
}
