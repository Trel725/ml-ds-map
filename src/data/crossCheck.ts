import { findCycles } from '../graph/cycles';
import type { ContentIssue } from './issues';
import type { Content } from './schema';

/** Reference and consistency checks across the whole content set. Every issue is an error. */
export function crossCheck(content: Content, vizIds: readonly string[]): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const err = (rule: string, file: string, id: string | undefined, message: string) =>
    issues.push({ severity: 'error', rule, file, ...(id !== undefined && { id }), message });

  const groups = new Map(content.groups.map((g) => [g.id, g]));
  const nodes = new Map(content.nodes.map((n) => [n.id, n]));

  const seen = new Map<string, string>();
  for (const item of [...content.groups, ...content.nodes, ...content.edges]) {
    const first = seen.get(item.id);
    if (first !== undefined) err('duplicate-id', item.source, item.id, `id "${item.id}" is already used in ${first}`);
    else seen.set(item.id, item.source);
  }

  for (const n of content.nodes) {
    const g = groups.get(n.group);
    if (!g) err('unknown-group', n.source, n.id, `group "${n.group}" does not exist`);
    else if (g.layer !== n.layer) err('layer-mismatch', n.source, n.id, `node layer "${n.layer}" but group "${g.id}" is in "${g.layer}"`);
    const expected = `content/nodes/${n.layer}/${n.group}.yaml`;
    if (n.source !== expected) err('file-location', n.source, n.id, `node belongs in ${expected}`);
    if (n.viz !== undefined && !vizIds.includes(n.viz)) err('unknown-viz', n.source, n.id, `visualization "${n.viz}" is not registered`);

    const refs: [string, string | undefined][] = [
      ['code.tool', n.code?.tool],
      ...[...(n.strengths ?? []), ...(n.weaknesses ?? [])].map((p): [string, string | undefined] => ['fixedBy', p.fixedBy]),
      ...Object.entries(n.recipe ?? {}).map(([k, s]): [string, string | undefined] => [`recipe.${k}`, s.node]),
      ...Object.entries(n.reducedRecipe ?? {}).map(([k, s]): [string, string | undefined] => [`reducedRecipe.${k}`, s.node]),
    ];
    for (const [field, ref] of refs) {
      if (ref !== undefined && !nodes.has(ref)) err('unresolved-ref', n.source, n.id, `${field} "${ref}" is not a node`);
    }

    if ((n.kind === 'foundation' || n.kind === 'math') && !n.showsUpIn) {
      err('shows-up-in-required', n.source, n.id, 'foundation and math nodes need showsUpIn');
    }
  }

  for (const e of content.edges) {
    for (const end of [e.from, e.to]) {
      if (!nodes.has(end) && !groups.has(end)) err('unknown-endpoint', e.source, e.id, `"${end}" is neither a node nor a group`);
    }
    if (e.type === 'needs' && (groups.has(e.from) || groups.has(e.to))) {
      err('needs-endpoints', e.source, e.id, 'needs edges must connect nodes, not groups');
    }
    if (e.type === 'implemented-in' && nodes.get(e.to)?.kind !== 'tool') {
      err('implemented-in-target', e.source, e.id, `"${e.to}" is not a tool node`);
    }
  }

  for (const t of content.tours) {
    for (const s of t.stops) {
      if (!nodes.has(s.node)) err('unknown-tour-stop', t.source, t.id, `stop "${s.node}" is not a node`);
    }
  }

  const needs = content.edges.filter((e) => e.type === 'needs');
  for (const cycle of findCycles(content.nodes.map((n) => n.id), needs)) {
    const at = needs.find((e) => e.from === cycle[0] && e.to === cycle[1]);
    err('needs-cycle', at?.source ?? 'content/edges', undefined, `needs cycle: ${cycle.join(' → ')}`);
  }

  return issues;
}
