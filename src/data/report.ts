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
    const recipe = n.recipe ?? n.reducedRecipe;
    if (recipe) {
      out.push('**Recipe:**');
      for (const [key, slot] of Object.entries(recipe)) {
        out.push(`- ${SLOT_NAMES[key] ?? key}: ${slot.text}${slot.node ? ` (→ ${slot.node})` : ''}`);
      }
      out.push('');
    }
    for (const [heading, list] of [['Strengths', n.strengths], ['Weaknesses', n.weaknesses]] as const) {
      if (!list) continue;
      out.push(`**${heading}:**`, ...list.map((p) => `- ${p.text}${p.fixedBy ? ` (fixed by ${p.fixedBy})` : ''}`), '');
    }
    if (n.formula) {
      out.push(`**Formula:** \`${n.formula.tex}\``, ...n.formula.symbols.map((s) => `- \`${s.symbol}\`: ${s.meaning}`), '');
    }
    if (n.code) out.push(`**Code (${n.code.tool}):**`, '```python', n.code.snippet.trimEnd(), '```', '');
    if (n.confusions) out.push('**Confusions:**', ...n.confusions.map((c) => `- ${c}`), '');
    if (n.resources) out.push('**Go further:**', ...n.resources.map((r) => `- [${r.title}](${r.url})`), '');
  }
  return out.join('\n');
}

const SLOT_NAMES: Record<string, string> = {
  problem: 'Problem',
  modelFamily: 'Model family',
  loss: 'Loss',
  optimizer: 'Optimizer',
  evaluation: 'Evaluation',
  goal: 'Goal',
  optimizes: 'Optimizes',
  judgedBy: 'Judged by',
};
