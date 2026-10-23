import type { LensId } from '../data/schema';
import type { Graph } from './graph';

/** Ids of the nodes tagged with `lens`. */
export function lensSet(g: Graph, lens: LensId): Set<string> {
  return new Set(g.content.nodes.filter((n) => n.lenses.includes(lens)).map((n) => n.id));
}
