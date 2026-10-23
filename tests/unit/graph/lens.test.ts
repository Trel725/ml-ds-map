import { expect, test } from 'vitest';
import { buildGraph } from '../../../src/graph/graph';
import { lensSet } from '../../../src/graph/lens';
import { loadValid } from '../helpers/fixtures';
import { realGraph } from '../helpers/real';

test('lensSet returns exactly the tagged nodes', async () => {
  const g = buildGraph(await loadValid());
  expect(lensSet(g, 'neural-nets')).toEqual(new Set(['derivative']));
  expect(lensSet(g, 'nlp')).toEqual(new Set());
});
test('real content: the NLP lens reaches across layers', async () => {
  const s = lensSet(await realGraph(), 'nlp');
  for (const id of ['tf-idf', 'naive-bayes', 'text-tasks', 'nltk-spacy']) expect(s.has(id), id).toBe(true);
});
