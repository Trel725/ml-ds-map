import { mulberry32, normal, shuffledIndices } from './random';

export type Split = 'train' | 'test';
export interface FlatPrice {
  /** Square meters. */
  size: number;
  /** Thousands. */
  price: number;
  split: Split;
}
export interface Email {
  links: number;
  capsShare: number;
  label: 0 | 1;
  split: Split;
}

const clip = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function withSplits<T extends object>(rows: T[], rand: () => number, trainCount: number): (T & { split: Split })[] {
  const order = shuffledIndices(rand, rows.length);
  const train = new Set(order.slice(0, trainCount));
  return rows.map((r, i) => ({ ...r, split: train.has(i) ? 'train' : 'test' }));
}

let prices: FlatPrice[] | null = null;
let mail: Email[] | null = null;

/** Shared regression data: 40 flats, size → price, 20 train and 20 test. */
export function flatPrices(): FlatPrice[] {
  if (prices) return prices;
  const rand = mulberry32(42);
  const rows = Array.from({ length: 40 }, () => {
    const size = 30 + rand() * 120;
    return { size, price: 40 + 3 * size - 0.006 * size * size + normal(rand, 0, 20) };
  });
  prices = withSplits(rows, rand, 20);
  return prices;
}

/** Shared classification data: 80 emails, half spam, 60 train and 20 test. */
export function emails(): Email[] {
  if (mail) return mail;
  const rand = mulberry32(7);
  const rows: Omit<Email, 'split'>[] = [];
  for (let i = 0; i < 40; i++) {
    rows.push({ links: clip(normal(rand, 6, 2), 0, 10), capsShare: clip(normal(rand, 0.6, 0.15), 0, 1), label: 1 });
  }
  for (let i = 0; i < 40; i++) {
    rows.push({ links: clip(normal(rand, 2, 1.5), 0, 10), capsShare: clip(normal(rand, 0.25, 0.12), 0, 1), label: 0 });
  }
  mail = withSplits(rows, rand, 60);
  return mail;
}

let skewed: number[] | null = null;

/** The flat prices pushed through an exponential: a long right tail, for logs and sampling. */
export function skewedPrices(): number[] {
  skewed ??= flatPrices().map((p) => 1000 * 10 ** (p.price / 100));
  return skewed;
}
