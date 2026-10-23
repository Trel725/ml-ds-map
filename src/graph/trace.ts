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

/** Everything `nodeId` needs, directly or indirectly, in learning order. */
export function traceDown(g: Graph, nodeId: string): Trace {
  const nodeIds = new Set([nodeId]);
  const edgeIds = new Set<string>();
  const queue = [nodeId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const e of g.out.get(id) ?? []) {
      if (e.type !== 'needs' || !g.nodesById.has(e.to)) continue;
      edgeIds.add(e.id);
      if (!nodeIds.has(e.to)) {
        nodeIds.add(e.to);
        queue.push(e.to);
      }
    }
  }

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
