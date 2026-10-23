export const VIZ_IDS = [
  'logarithms',
  'slope-derivative',
  'gradient-descent',
  'ols-fit',
  'overfitting',
  'decision-tree',
  'classification-threshold',
  'bayes-rule',
] as const;
export type VizId = (typeof VIZ_IDS)[number];
