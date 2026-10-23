export interface Pt {
  x: number;
  y: number;
}

/** Flat sizes span 30–150 m²; polynomials work on x scaled to [-1, 1] to stay well conditioned. */
export const X_MID = 90;
export const X_HALF = 60;
export const toScaled = (x: number): number => (x - X_MID) / X_HALF;

/** Polynomial value at scaled x (Horner's rule). coeffs[i] multiplies s^i. */
export function evalPoly(coeffs: number[], s: number): number {
  let v = 0;
  for (let i = coeffs.length - 1; i >= 0; i--) v = v * s + coeffs[i];
  return v;
}

/** Least squares polynomial fit via Householder QR. Returns coefficients in scaled x. */
export function fitPolynomial(points: Pt[], degree: number): number[] {
  const n = points.length;
  const m = degree + 1;
  const A = points.map((p) => Array.from({ length: m }, (_, j) => toScaled(p.x) ** j));
  const b = points.map((p) => p.y);

  for (let k = 0; k < m; k++) {
    let norm = 0;
    for (let i = k; i < n; i++) norm += A[i][k] ** 2;
    norm = Math.sqrt(norm);
    if (norm === 0) continue;
    const alpha = A[k][k] > 0 ? -norm : norm;
    const v = Array.from({ length: n - k }, (_, i) => A[k + i][k]);
    v[0] -= alpha;
    const vv = v.reduce((a, x) => a + x * x, 0);
    if (vv === 0) continue;
    const reflect = (col: (i: number) => number, set: (i: number, val: number) => void) => {
      let dot = 0;
      for (let i = 0; i < v.length; i++) dot += v[i] * col(k + i);
      const f = (2 * dot) / vv;
      for (let i = 0; i < v.length; i++) set(k + i, col(k + i) - f * v[i]);
    };
    for (let j = k; j < m; j++) reflect((i) => A[i][j], (i, val) => (A[i][j] = val));
    reflect((i) => b[i], (i, val) => (b[i] = val));
  }

  const c = new Array<number>(m).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < m; j++) s -= A[i][j] * c[j];
    c[i] = A[i][i] === 0 ? 0 : s / A[i][i];
  }
  return c;
}

/** Mean squared error of the polynomial on points given in original x. */
export function mse(points: Pt[], coeffs: number[]): number {
  return points.reduce((a, p) => a + (p.y - evalPoly(coeffs, toScaled(p.x))) ** 2, 0) / points.length;
}
