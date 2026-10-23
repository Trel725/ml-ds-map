import type { VizId } from './ids';
import type { VizModule } from './types';

/** Lazy loaders, so a visualization's code loads only when its panel opens. */
export const registry: Partial<Record<VizId, () => Promise<{ default: VizModule }>>> = {
  logarithms: () => import('./logarithms'),
  'slope-derivative': () => import('./slope-derivative'),
  'gradient-descent': () => import('./gradient-descent'),
  'ols-fit': () => import('./ols-fit'),
  overfitting: () => import('./overfitting'),
  'decision-tree': () => import('./decision-tree'),
};
