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
  | 'signature-explanation'
  | 'code-lines'
  | 'points-count'
  | 'algorithm-only-fields';

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
const CODE_LINES = [3, 6] as const;
const POINTS = [2, 3] as const;

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
    const proseFields: [string, string][] = [
      ...(n.confusions ?? []).map((t, i): [string, string] => [`confusions[${i}]`, t]),
      ...(n.strengths ?? []).map((p, i): [string, string] => [`strengths[${i}]`, p.text]),
      ...(n.weaknesses ?? []).map((p, i): [string, string] => [`weaknesses[${i}]`, p.text]),
      ...Object.entries(n.recipe ?? {}).map(([k, s]): [string, string] => [`recipe.${k}`, s.text]),
      ...Object.entries(n.reducedRecipe ?? {}).map(([k, s]): [string, string] => [`reducedRecipe.${k}`, s.text]),
      ...(n.formula?.symbols ?? []).map((s, i): [string, string] => [`formula.symbols[${i}]`, s.meaning]),
    ];
    for (const [field, text] of proseFields) longSentences('sentence-length', n.source, n.id, field, text);
    if (n.code) {
      const lines = n.code.snippet.split('\n').filter((l) => l.trim()).length;
      if (lines < CODE_LINES[0] || lines > CODE_LINES[1]) {
        report('code-lines', n.source, n.id, `code.snippet has ${lines} lines (${CODE_LINES[0]}–${CODE_LINES[1]})`);
      }
    }
    for (const [field, list] of [['strengths', n.strengths], ['weaknesses', n.weaknesses]] as const) {
      if (list && (list.length < POINTS[0] || list.length > POINTS[1])) {
        report('points-count', n.source, n.id, `${field} has ${list.length} entries (${POINTS[0]}–${POINTS[1]})`);
      }
    }
    if (n.kind !== 'algorithm') {
      const present = (['recipe', 'reducedRecipe', 'strengths', 'weaknesses'] as const).filter((f) => n[f] !== undefined);
      if (present.length) report('algorithm-only-fields', n.source, n.id, `${present.join(', ')} only belong on algorithms`);
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
