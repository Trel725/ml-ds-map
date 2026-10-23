import { LAYERS } from './schema';
import type { Content } from './schema';

/** Every node's panel text as Markdown, in map order, for human review. */
export function renderReport(content: Content): string {
  const groupOrder = new Map(content.groups.map((g) => [g.id, g.order]));
  const labels = new Map(content.nodes.map((n) => [n.id, n.label]));
  const fileOrder = new Map(content.nodes.map((n, i) => [n.id, i]));
  const nodes = [...content.nodes].sort(
    (a, b) =>
      LAYERS.indexOf(a.layer) - LAYERS.indexOf(b.layer) ||
      (groupOrder.get(a.group) ?? 0) - (groupOrder.get(b.group) ?? 0) ||
      fileOrder.get(a.id)! - fileOrder.get(b.id)!,
  );

  const out: string[] = ['# ML Concept Map — content report', ''];
  for (const n of nodes) {
    const needs = content.edges
      .filter((e) => e.type === 'needs' && e.from === n.id)
      .map((e) => labels.get(e.to) ?? e.to);
    out.push(`## ${n.label} (\`${n.id}\`)`, '');
    out.push(`**One-liner:** ${n.oneLiner}`, '');
    out.push(`**Intuition:** ${n.intuition}`, '');
    if (n.analogy) out.push(`**Analogy:** ${n.analogy}`, '');
    if (n.showsUpIn) out.push(`**Shows up in:** ${n.showsUpIn}`, '');
    out.push(`Needs: ${needs.length ? needs.join(', ') : 'none'}`, '');
  }
  return out.join('\n');
}
