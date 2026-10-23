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
