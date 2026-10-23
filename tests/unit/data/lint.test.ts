import { expect, test } from 'vitest';
import { countWords, lintContent, splitSentences } from '../../../src/data/lint';
import { loadValid, withRule } from '../helpers/fixtures';

test('valid fixture is lint-clean', async () => expect(lintContent(await loadValid())).toEqual([]));
test.each([
  ['label-words', 'long-label'], ['one-liner-length', 'wordy'], ['sentence-length', 'rambling'],
  ['intuition-sentences', 'one-sentence'], ['no-math-symbols', 'greek'], ['needs-outgoing', 'no-needs'],
  ['orphan-node', 'lonely'], ['lane-groups', 'foundations'], ['signature-explanation', 'slope--needs--x'],
])('%s fixture reports %s', async (rule, id) =>
  expect(lintContent(await withRule(rule))).toContainEqual(expect.objectContaining({ rule, id, severity: 'error' })));
test('warningRules downgrades severity', async () => {
  const issues = lintContent(await withRule('orphan-node'), { warningRules: ['orphan-node'] });
  expect(issues.find((i) => i.rule === 'orphan-node')!.severity).toBe('warning');
});
test('problems and tools are exempt from needs-outgoing', async () =>
  expect(lintContent(await loadValid()).some((i) => i.rule === 'needs-outgoing')).toBe(false));
test('tools are exempt from label-words', async () => {
  const c = await loadValid();
  c.nodes = c.nodes.map((n) => (n.kind === 'tool' ? { ...n, label: 'A very long tool name' } : n));
  expect(lintContent(c).some((i) => i.rule === 'label-words')).toBe(false);
});
test('lane-groups issue points at groups.yaml', async () =>
  expect(lintContent(await withRule('lane-groups')).find((i) => i.rule === 'lane-groups')!.file).toBe('content/groups.yaml'));
test('splitSentences', () => expect(splitSentences('One two. Three? Four!')).toEqual(['One two.', 'Three?', 'Four!']));
test('countWords', () => expect(countWords('  a  b c ')).toBe(3));

const issuesFor = async (fixture: string, rule: string) => lintContent(await withRule(fixture)).filter((i) => i.rule === rule);
test('code-lines flags snippets outside 3–6 lines', async () =>
  expect((await issuesFor('code-lines', 'code-lines')).map((i) => i.id).sort()).toEqual(['long-code', 'short-code']));
test('points-count flags 1 strength and 4 weaknesses', async () =>
  expect((await issuesFor('points-count', 'points-count')).map((i) => i.id).sort()).toEqual(['few-strengths', 'many-weaknesses']));
test('algorithm-only-fields flags a recipe on a concept', async () =>
  expect(await issuesFor('algorithm-only-fields', 'algorithm-only-fields')).toEqual([
    expect.objectContaining({ id: 'concept-recipe', severity: 'error' }),
  ]));
test('sentence-length covers confusions and weakness text', async () =>
  expect((await issuesFor('phase2-sentence-length', 'sentence-length')).map((i) => i.id).sort()).toEqual([
    'wordy-confusion',
    'wordy-weakness',
  ]));
