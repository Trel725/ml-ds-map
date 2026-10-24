import { directEdges } from '../graph/graph';
import type { Graph } from '../graph/graph';
import { layout } from '../layout/layout';
import type { Box } from '../layout/layout';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface NavCandidate {
  id: string;
  box: Box;
}

/** Centers closer than this in y count as the same row. */
const ROW_THRESHOLD = 8;

/** Nodes at the other end of the node's direct edges, once each (first edge wins); group endpoints are skipped. */
export function navNeighbors(graph: Graph, nodeId: string): { nodeId: string; edgeId: string }[] {
  if (!graph.nodesById.has(nodeId)) return [];
  const out: { nodeId: string; edgeId: string }[] = [];
  const seen = new Set([nodeId]);
  for (const e of directEdges(graph, nodeId)) {
    const other = e.from === nodeId ? e.to : e.from;
    if (seen.has(other) || !graph.nodesById.has(other)) continue;
    seen.add(other);
    out.push({ nodeId: other, edgeId: e.id });
  }
  return out;
}

/** The selected node and its neighbors, boxed as they sit once their groups are open. */
export function navCandidates(
  graph: Graph,
  nodeId: string,
  expanded: ReadonlySet<string>,
): { candidates: NavCandidate[]; groupsToOpen: string[] } {
  if (!graph.nodesById.has(nodeId)) return { candidates: [], groupsToOpen: [] };
  const ids = [nodeId, ...navNeighbors(graph, nodeId).map((n) => n.nodeId)];
  const groupsToOpen: string[] = [];
  for (const id of ids) {
    const n = graph.nodesById.get(id)!;
    if (n.kind === 'tool' || expanded.has(n.group) || groupsToOpen.includes(n.group)) continue;
    groupsToOpen.push(n.group);
  }
  const lay = layout(graph.content.groups, graph.content.nodes, new Set([...expanded, ...groupsToOpen]));
  const candidates = ids.flatMap((id) => {
    const box = lay.toolPositions.get(id) ?? lay.nodePositions.get(id);
    return box ? [{ id, box: { x: box.x, y: box.y, w: box.w, h: box.h } }] : [];
  });
  return { candidates, groupsToOpen };
}

const center = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** The candidate an arrow key moves to from `fromId`, or null when there is none that way. */
export function pickInDirection(fromId: string, candidates: NavCandidate[], dir: Direction): string | null {
  const from = candidates.find((c) => c.id === fromId);
  if (!from) return null;
  const at = center(from.box);

  if (dir === 'left' || dir === 'right') {
    const order = [...candidates].sort((a, b) => {
      const ca = center(a.box);
      const cb = center(b.box);
      return Math.round(ca.y) - Math.round(cb.y) || ca.x - cb.x || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    });
    const i = order.findIndex((c) => c.id === fromId);
    const step = dir === 'right' ? 1 : -1;
    return order[(i + step + order.length) % order.length].id;
  }

  let best: { id: string; dist: number } | null = null;
  for (const c of candidates) {
    if (c.id === fromId) continue;
    const p = center(c.box);
    const dy = p.y - at.y;
    if (dir === 'up' ? dy > -ROW_THRESHOLD : dy < ROW_THRESHOLD) continue;
    const dist = Math.abs(p.x - at.x) + Math.abs(dy);
    if (!best || dist < best.dist || (dist === best.dist && c.id < best.id)) best = { id: c.id, dist };
  }
  return best?.id ?? null;
}
