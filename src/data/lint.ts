import type { ContentIssue } from './issues';
import type { Content, Layer } from './schema';

export type LintRule =
  | 'label-words'
  | 'one-liner-length'
  | 'sentence-length'
  | 'intuition-sentences'
  | 'no-math-symbols'
  | 'needs-outgoing'
  | 'orphan-node'
  | 'lane-groups'
  | 'signature-explanation';

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

const MATH_SYMBOLS = /[Σ∂∇=^Ͱ-Ͽ]/;
const NEEDS_LAYERS: Layer[] = ['math', 'core', 'algorithms'];
const MAX_GROUPS_PER_LANE = 12;

/** Writing-rule checks. Every rule is an error unless listed in `warningRules`. */
export function lintContent(content: Content, opts: { warningRules?: LintRule[] } = {}): ContentIssue[] {
  const warn = new Set(opts.warningRules ?? []);
  const issues: ContentIssue[] = [];
  const report = (rule: LintRule, file: string, id: string, message: string) =>
    issues.push({ severity: warn.has(rule) ? 'warning' : 'error', rule, file, id, message });

  const longSentences = (rule: LintRule, file: string, id: string, field: string, text: string | undefined) => {
    for (const s of splitSentences(text ?? '')) {
      const n = countWords(s);
      if (n >= 20) report(rule, file, id, `${field} has a ${n}-word sentence: "${s}"`);
    }
  };

  const outgoingNeeds = new Set(content.edges.filter((e) => e.type === 'needs').map((e) => e.from));
  const endpoints = new Set(content.edges.flatMap((e) => [e.from, e.to]));

  for (const n of content.nodes) {
    if (n.kind !== 'tool' && countWords(n.label) > 3) report('label-words', n.source, n.id, `label "${n.label}" has more than 3 words`);
    const oneLinerWords = countWords(n.oneLiner);
    if (oneLinerWords >= 15) report('one-liner-length', n.source, n.id, `oneLiner has ${oneLinerWords} words (max 14)`);
    for (const [field, text] of [['oneLiner', n.oneLiner], ['intuition', n.intuition], ['analogy', n.analogy], ['showsUpIn', n.showsUpIn]] as const) {
      longSentences('sentence-length', n.source, n.id, field, text);
    }
    const sentences = splitSentences(n.intuition).length;
    if (sentences < 2 || sentences > 4) report('intuition-sentences', n.source, n.id, `intuition has ${sentences} sentences (2–4)`);
    for (const [field, text] of [['oneLiner', n.oneLiner], ['intuition', n.intuition]] as const) {
      const m = text.match(MATH_SYMBOLS);
      if (m) report('no-math-symbols', n.source, n.id, `${field} contains "${m[0]}"`);
    }
    if (NEEDS_LAYERS.includes(n.layer) && !outgoingNeeds.has(n.id)) {
      report('needs-outgoing', n.source, n.id, 'node has no outgoing needs edge');
    }
    if (!endpoints.has(n.id)) report('orphan-node', n.source, n.id, 'node is not an endpoint of any edge');
  }

  for (const e of content.edges) {
    longSentences('sentence-length', e.source, e.id, 'sentence', e.sentence);
    longSentences('sentence-length', e.source, e.id, 'explanation', e.explanation);
    if (e.signature && !e.explanation) report('signature-explanation', e.source, e.id, 'signature edge needs an explanation');
  }

  for (const t of content.tours) {
    for (const s of t.stops) longSentences('sentence-length', t.source, t.id, `caption (${s.node})`, s.caption);
  }

  const perLane = new Map<Layer, number>();
  for (const g of content.groups) perLane.set(g.layer, (perLane.get(g.layer) ?? 0) + 1);
  for (const [layer, count] of perLane) {
    if (count > MAX_GROUPS_PER_LANE) report('lane-groups', 'content/groups.yaml', layer, `${count} groups (max ${MAX_GROUPS_PER_LANE})`);
  }

  return issues;
}
