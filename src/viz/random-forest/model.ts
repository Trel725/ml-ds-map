import { FEATURES, growTree, predict } from '../decision-tree/model';
import type { Sample, Tree } from '../decision-tree/model';
import { mulberry32 } from '../random';

export const FOREST_DEPTH = 6;

/** Bootstrap-sampled trees of depth 6, each split choosing from one random feature. */
export function growForest(points: Sample[], nTrees: number, seed: number): Tree[] {
  if (!Number.isInteger(nTrees) || nTrees < 1) throw new RangeError(`a forest needs at least one tree, got ${nTrees}`);
  const rand = mulberry32(seed);
  const oneFeature = () => [FEATURES[Math.floor(rand() * FEATURES.length)]];
  return Array.from({ length: nTrees }, () => {
    const sample = points.map(() => points[Math.floor(rand() * points.length)]);
    return growTree(sample, FOREST_DEPTH, { featuresAt: oneFeature });
  });
}

/** The share of trees voting spam (1) for this email. */
export function forestVote(forest: Tree[], p: Pick<Sample, 'links' | 'capsShare'>): number {
  return forest.filter((t) => predict(t, p) === 1).length / forest.length;
}
