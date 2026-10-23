import type { VizId } from './ids';
import type { VizModule } from './types';

/** Lazy loaders, so a visualization's code loads only when its panel opens. */
export const registry: Partial<Record<VizId, () => Promise<{ default: VizModule }>>> = {
  logarithms: () => import('./logarithms'),
};
