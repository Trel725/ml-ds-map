import { beforeAll, expect, test } from 'vitest';
import { createSearch } from '../../../src/graph/search';
import type { SearchResult } from '../../../src/graph/search';
import { realContent } from '../helpers/real';

let search: (q: string) => SearchResult[];
beforeAll(async () => {
  search = createSearch((await realContent()).nodes);
});

test('synonym resolves: "linear regression" → ols first', () => expect(search('linear regression')[0].id).toBe('ols'));
test('label match', () => expect(search('gradient descent')[0].id).toBe('gradient-descent'));
test('punctuation-insensitive: "bayes rule" → bayes-rule', () => expect(search('bayes rule')[0].id).toBe('bayes-rule'));
test('case-insensitive: "PCA" → pca', () => expect(search('PCA')[0].id).toBe('pca'));
test('result carries label and group', () =>
  expect(search('PCA')[0]).toEqual({ id: 'pca', label: 'PCA', group: 'dimensionality-reduction' }));
test('blank query → []', () => {
  expect(search('')).toEqual([]);
  expect(search('   ')).toEqual([]);
});
test('punctuation-only query → []', () => expect(search("'.,")).toEqual([]));
test('no match → []', () => expect(search('zzzzqqq')).toEqual([]));
test('at most 8 results', () => expect(search('a').length).toBeLessThanOrEqual(8));
