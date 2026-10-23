import { EDGE_TYPES } from '../data/schema';
import type { EdgeType } from '../data/schema';
import type { Graph } from './graph';
import { directEdges } from './graph';

export type Selection = { kind: 'node' | 'edge'; id: string };

export interface VisibleEdge {
  key: string;
  from: string;
  to: string;
  edgeIds: string[];
  type: EdgeType;
  count: number;
}

/** The id an item is drawn as: itself, or its group while that group is collapsed. Tools are always themselves. */
export function visualId(g: Graph, id: string, expanded: ReadonlySet<string>): string {
  const node = g.nodesById.get(id);
  if (!node || node.kind === 'tool') return id;
  return expanded.has(node.group) ? id : node.group;
}

/**
 * Edges to draw for a selection (plus any extra edge ids, e.g. a trace), with endpoints mapped to what is
 * visible. Edges that collapse onto the same visible pair merge into one.
 */
export function visibleEdges(
  g: Graph,
  selection: Selection | null,
  expanded: ReadonlySet<string>,
  extraEdgeIds?: ReadonlySet<string>,
): { edges: VisibleEdge[]; related: Set<string> } {
  const related = new Set<string>();
  const picked = new Set<string>();
  if (selection?.kind === 'node') {
    if (g.nodesById.has(selection.id) || g.groupsById.has(selection.id)) {
      related.add(visualId(g, selection.id, expanded));
      for (const e of directEdges(g, selection.id)) picked.add(e.id);
    }
  } else if (selection?.kind === 'edge' && g.edgesById.has(selection.id)) {
    picked.add(selection.id);
  }
  for (const id of extraEdgeIds ?? []) if (g.edgesById.has(id)) picked.add(id);

  const merged = new Map<string, VisibleEdge>();
  for (const e of g.content.edges) {
    if (!picked.has(e.id)) continue;
    const from = visualId(g, e.from, expanded);
    const to = visualId(g, e.to, expanded);
    if (from === to) continue;
    related.add(from);
    related.add(to);
    const key = `${from}->${to}`;
    const hit = merged.get(key);
    if (!hit) {
      merged.set(key, { key, from, to, edgeIds: [e.id], type: e.type, count: 1 });
    } else {
      hit.edgeIds.push(e.id);
      hit.count += 1;
      if (EDGE_TYPES.indexOf(e.type) < EDGE_TYPES.indexOf(hit.type)) hit.type = e.type;
    }
  }
  return { edges: [...merged.values()], related };
}
