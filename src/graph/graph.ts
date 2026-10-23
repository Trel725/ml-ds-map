import { LAYERS } from '../data/schema';
import type { Content, Edge, Group, Node } from '../data/schema';

export interface Graph {
  content: Content;
  nodesById: Map<string, Node>;
  groupsById: Map<string, Group>;
  edgesById: Map<string, Edge>;
  /** Keyed by node or group id; [] when none. */
  out: Map<string, Edge[]>;
  in: Map<string, Edge[]>;
  /** Members in file order. */
  membersByGroup: Map<string, Node[]>;
}

export function buildGraph(content: Content): Graph {
  const out = new Map<string, Edge[]>();
  const inn = new Map<string, Edge[]>();
  const membersByGroup = new Map<string, Node[]>();
  for (const id of [...content.nodes.map((n) => n.id), ...content.groups.map((g) => g.id)]) {
    out.set(id, []);
    inn.set(id, []);
  }
  for (const g of content.groups) membersByGroup.set(g.id, []);
  for (const n of content.nodes) {
    if (!membersByGroup.has(n.group)) membersByGroup.set(n.group, []);
    membersByGroup.get(n.group)!.push(n);
  }
  for (const e of content.edges) {
    if (!out.has(e.from)) out.set(e.from, []);
    if (!inn.has(e.to)) inn.set(e.to, []);
    out.get(e.from)!.push(e);
    inn.get(e.to)!.push(e);
  }
  return {
    content,
    nodesById: new Map(content.nodes.map((n) => [n.id, n])),
    groupsById: new Map(content.groups.map((g) => [g.id, g])),
    edgesById: new Map(content.edges.map((e) => [e.id, e])),
    out,
    in: inn,
    membersByGroup,
  };
}

/** Sort by layer (foundations first), then label. */
export function byLayerThenLabel(a: Node, b: Node): number {
  return LAYERS.indexOf(a.layer) - LAYERS.indexOf(b.layer) || a.label.localeCompare(b.label);
}

const nodesAt = (g: Graph, ids: string[]) =>
  ids.flatMap((id) => {
    const n = g.nodesById.get(id);
    return n ? [n] : [];
  });

/** Direct outgoing `needs` targets. */
export function needsOf(g: Graph, id: string): Node[] {
  return nodesAt(g, (g.out.get(id) ?? []).filter((e) => e.type === 'needs').map((e) => e.to)).sort(byLayerThenLabel);
}

/** Direct incoming `needs` sources. */
export function neededBy(g: Graph, id: string): Node[] {
  return nodesAt(g, (g.in.get(id) ?? []).filter((e) => e.type === 'needs').map((e) => e.from)).sort(byLayerThenLabel);
}

/** Outgoing and incoming edges of a node or group. */
export function directEdges(g: Graph, id: string): Edge[] {
  return [...(g.out.get(id) ?? []), ...(g.in.get(id) ?? [])];
}
