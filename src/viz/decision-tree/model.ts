export type Feature = 'links' | 'capsShare';
export type Label = 0 | 1;
export interface Sample {
  links: number;
  capsShare: number;
  label: Label;
}
export type Tree = { leaf: true; label: Label } | { leaf: false; feature: Feature; threshold: number; left: Tree; right: Tree };
export interface Region {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  label: Label;
}

const FEATURES: Feature[] = ['links', 'capsShare'];

const gini = (pos: number, n: number) => (n === 0 ? 0 : 1 - (pos / n) ** 2 - ((n - pos) / n) ** 2);
const majority = (pts: Sample[]): Label => (pts.filter((p) => p.label === 1).length * 2 >= pts.length ? 1 : 0);

/** CART with Gini impurity: the best yes/no cut at each step, until pure or at `maxDepth`. */
export function growTree(points: Sample[], maxDepth: number): Tree {
  const pos = points.filter((p) => p.label === 1).length;
  if (maxDepth <= 0 || pos === 0 || pos === points.length) return { leaf: true, label: majority(points) };

  const parent = gini(pos, points.length);
  let best: { feature: Feature; threshold: number; score: number } | null = null;
  for (const feature of FEATURES) {
    const sorted = [...points].sort((a, b) => a[feature] - b[feature]);
    let leftPos = 0;
    for (let i = 1; i < sorted.length; i++) {
      leftPos += sorted[i - 1].label;
      if (sorted[i][feature] === sorted[i - 1][feature]) continue;
      const nl = i;
      const nr = sorted.length - i;
      const score = (nl * gini(leftPos, nl) + nr * gini(pos - leftPos, nr)) / sorted.length;
      if (!best || score < best.score - 1e-12) {
        best = { feature, threshold: (sorted[i - 1][feature] + sorted[i][feature]) / 2, score };
      }
    }
  }
  if (!best || best.score >= parent - 1e-12) return { leaf: true, label: majority(points) };

  const { feature, threshold } = best;
  return {
    leaf: false,
    feature,
    threshold,
    left: growTree(
      points.filter((p) => p[feature] <= threshold),
      maxDepth - 1,
    ),
    right: growTree(
      points.filter((p) => p[feature] > threshold),
      maxDepth - 1,
    ),
  };
}

export function depth(t: Tree): number {
  return t.leaf ? 0 : 1 + Math.max(depth(t.left), depth(t.right));
}

export function leafCount(t: Tree): number {
  return t.leaf ? 1 : leafCount(t.left) + leafCount(t.right);
}

export function predict(t: Tree, p: Pick<Sample, Feature>): Label {
  let node = t;
  while (!node.leaf) node = p[node.feature] <= node.threshold ? node.left : node.right;
  return node.label;
}

/** The rectangles the cuts carve out of `bounds` (x is links, y is capsShare), one per leaf. */
export function regions(t: Tree, bounds: Omit<Region, 'label'>): Region[] {
  if (t.leaf) return [{ ...bounds, label: t.label }];
  if (t.feature === 'links') {
    return [...regions(t.left, { ...bounds, x1: t.threshold }), ...regions(t.right, { ...bounds, x0: t.threshold })];
  }
  return [...regions(t.left, { ...bounds, y1: t.threshold }), ...regions(t.right, { ...bounds, y0: t.threshold })];
}

export function accuracy(t: Tree, points: Sample[]): number {
  return points.filter((p) => predict(t, p) === p.label).length / points.length;
}
