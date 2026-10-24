import { flatPrices } from '../datasets';

/** The 20 training flats' prices, in thousands. */
export function bootstrapPrices(): number[] {
  return flatPrices()
    .filter((p) => p.split === 'train')
    .map((p) => p.price);
}

/** Same length, drawn with replacement: some values repeat, others drop out. */
export function resample(values: number[], rand: () => number): number[] {
  return values.map(() => values[Math.floor(rand() * values.length)]);
}

/** The middle `level` share of the values, by linear-interpolated percentiles. */
export function percentileInterval(values: number[], level = 0.95): [number, number] {
  const s = [...values].sort((a, b) => a - b);
  const q = (p: number) => {
    const pos = p * (s.length - 1);
    const i = Math.floor(pos);
    return i + 1 < s.length ? s[i] + (pos - i) * (s[i + 1] - s[i]) : s[i];
  };
  const tail = (1 - level) / 2;
  return [q(tail), q(1 - tail)];
}
