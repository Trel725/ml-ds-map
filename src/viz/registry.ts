import type { VizId } from './ids';
import type { VizModule } from './types';

export type VizLoader = () => Promise<{ default: VizModule }>;
export type VizLoaders = Partial<Record<VizId, VizLoader>>;

/** Lazy loaders, so a visualization's code loads only when its panel opens. */
export const registry: Record<VizId, VizLoader> = {
  logarithms: () => import('./logarithms'),
  'slope-derivative': () => import('./slope-derivative'),
  'gradient-descent': () => import('./gradient-descent'),
  'ols-fit': () => import('./ols-fit'),
  overfitting: () => import('./overfitting'),
  'decision-tree': () => import('./decision-tree'),
  'classification-threshold': () => import('./classification-threshold'),
  'bayes-rule': () => import('./bayes-rule'),
  'loss-functions': () => import('./loss-functions'),
  regularization: () => import('./regularization'),
  'cross-validation': () => import('./cross-validation'),
  'random-forest': () => import('./random-forest'),
  'gradient-boosting': () => import('./gradient-boosting'),
  knn: () => import('./knn'),
  'k-means': () => import('./k-means'),
  pca: () => import('./pca'),
  'logistic-regression': () => import('./logistic-regression'),
  'neuron-to-network': () => import('./neuron-to-network'),
  backpropagation: () => import('./backpropagation'),
  'sampling-distribution': () => import('./sampling-distribution'),
  bootstrap: () => import('./bootstrap'),
  'hypothesis-test': () => import('./hypothesis-test'),
};
