/** Log base 10: "what power of ten gives x?" */
export function powerOfTen(x: number): number {
  return Math.log10(x);
}

/** Equal-width bins over the values, or over their log10 when `logScale`. Bin edges are in the binned space. */
export function histogram(values: number[], bins: number, logScale: boolean): { x0: number; x1: number; count: number }[] {
  const xs = logScale ? values.map(powerOfTen) : values;
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const width = (hi - lo) / bins || 1;
  const out = Array.from({ length: bins }, (_, i) => ({ x0: lo + i * width, x1: lo + (i + 1) * width, count: 0 }));
  for (const x of xs) out[Math.min(bins - 1, Math.floor((x - lo) / width))].count++;
  return out;
}

/** Sample skewness: positive when a long tail stretches to the right. */
export function skewness(values: number[]): number {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const m2 = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const m3 = values.reduce((a, b) => a + (b - mean) ** 3, 0) / n;
  return m2 === 0 ? 0 : m3 / m2 ** 1.5;
}
