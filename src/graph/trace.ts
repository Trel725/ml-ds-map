import type { Graph } from './graph';
import { byLayerThenLabel } from './graph';

export interface Trace {
  /** Learning order: every prerequisite before the nodes that need it. Excludes the start node. */
  order: string[];
  /** Reachable nodes, including the start node. */
  nodeIds: Set<string>;
  /** Traversed `needs` edges. */
  edgeIds: Set<string>;
}

/** Breadth-first search along `needs` edges: outgoing (what it needs) or incoming (what needs it). */
function reachNeeds(g: Graph, nodeId: string, direction: 'down' | 'up'): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const nodeIds = new Set([nodeId]);
  const edgeIds = new Set<string>();
  const queue = [nodeId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const e of (direction === 'down' ? g.out : g.in).get(id) ?? []) {
      const next = direction === 'down' ? e.to : e.from;
      if (e.type !== 'needs' || !g.nodesById.has(next)) continue;
      edgeIds.add(e.id);
      if (!nodeIds.has(next)) {
        nodeIds.add(next);
        queue.push(next);
      }
    }
  }
  return { nodeIds, edgeIds };
}

/** Everything `nodeId` needs, directly or indirectly, in learning order. */
export function traceDown(g: Graph, nodeId: string): Trace {
  const { nodeIds, edgeIds } = reachNeeds(g, nodeId, 'down');

  // Kahn's algorithm on the reachable subgraph: a node is ready once all its prerequisites are placed.
  const reach = [...nodeIds].filter((id) => id !== nodeId);
  const pending = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const id of reach) {
    pending.set(id, 0);
    dependents.set(id, []);
  }
  for (const eid of edgeIds) {
    const e = g.edgesById.get(eid)!;
    if (e.from === nodeId) continue;
    pending.set(e.from, pending.get(e.from)! + 1);
    dependents.get(e.to)!.push(e.from);
  }

  const order: string[] = [];
  const ready = reach.filter((id) => pending.get(id) === 0);
  const cmp = (a: string, b: string) => byLayerThenLabel(g.nodesById.get(a)!, g.nodesById.get(b)!);
  while (ready.length) {
    ready.sort(cmp);
    const id = ready.shift()!;
    order.push(id);
    for (const d of dependents.get(id)!) {
      const left = pending.get(d)! - 1;
      pending.set(d, left);
      if (left === 0) ready.push(d);
    }
  }
  return { order, nodeIds, edgeIds };
}

/** Everything that needs `nodeId`, directly or indirectly, lower layers first. */
export function traceUp(g: Graph, nodeId: string): Trace {
  const { nodeIds, edgeIds } = reachNeeds(g, nodeId, 'up');
  const order = [...nodeIds]
    .filter((id) => id !== nodeId)
    .sort((a, b) => byLayerThenLabel(g.nodesById.get(a)!, g.nodesById.get(b)!));
  return { order, nodeIds, edgeIds };
}

/** The node, the nodes its recipe slots link to, and every edge between it and those slot nodes. */
export function recipeSet(g: Graph, nodeId: string): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const n = g.nodesById.get(nodeId);
  const slots = [...Object.values(n?.recipe ?? {}), ...Object.values(n?.reducedRecipe ?? {})];
  const slotIds = new Set(slots.flatMap((s) => (s.node !== undefined && s.node !== nodeId && g.nodesById.has(s.node) ? [s.node] : [])));
  const edgeIds = new Set<string>();
  for (const e of [...(g.out.get(nodeId) ?? []), ...(g.in.get(nodeId) ?? [])]) {
    if (slotIds.has(e.from === nodeId ? e.to : e.from)) edgeIds.add(e.id);
  }
  return { nodeIds: new Set([nodeId, ...slotIds]), edgeIds };
}
