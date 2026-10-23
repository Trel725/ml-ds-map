export type Vec2 = [number, number];

/** A one-dimensional bowl. */
export const L1 = (x: number): number => x * x;
export const grad1 = (x: number): number => 2 * x;

/** An elongated bowl: much steeper along y than along x. */
export const L2 = (x: number, y: number): number => x * x + 4 * y * y;
export const grad2 = ([x, y]: Vec2): Vec2 => [2 * x, 8 * y];

/** Positions visited by gradient descent: x0, then `steps` updates. */
export function gdPath1D(grad: (x: number) => number, x0: number, lr: number, steps: number): number[] {
  const path = [x0];
  let x = x0;
  for (let i = 0; i < steps; i++) {
    x -= lr * grad(x);
    path.push(x);
  }
  return path;
}

export function gdPath2D(grad: (p: Vec2) => Vec2, p0: Vec2, lr: number, steps: number): Vec2[] {
  const path: Vec2[] = [p0];
  let p = p0;
  for (let i = 0; i < steps; i++) {
    const g = grad(p);
    p = [p[0] - lr * g[0], p[1] - lr * g[1]];
    path.push(p);
  }
  return path;
}
