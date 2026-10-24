import { expect, test } from 'vitest';
import { unexplainedSymbols } from '../../../src/data/formulaSymbols';
import { realContent } from '../helpers/real';

test('finds a letter and a Greek symbol that no row explains', () =>
  expect(unexplainedSymbols({ tex: 'y = \\beta x + b', symbols: [{ symbol: '\\beta' }, { symbol: 'x' }] }).sort()).toEqual(['b', 'y']));
test('ignores notation, subscripts, text and constants', () =>
  expect(
    unexplainedSymbols({
      tex: '\\hat{w} = \\frac{1}{n} \\sum_{i=1}^{n} e^{x_i} \\text{ if } w^\\top x \\le 0',
      symbols: [{ symbol: 'w' }, { symbol: 'n' }, { symbol: 'x_i' }],
    }),
  ).toEqual([]));
test('a \\mathcal letter must be explained in its own form', () =>
  expect(unexplainedSymbols({ tex: '\\mathcal{L} = 0', symbols: [{ symbol: 'L' }] })).toEqual(['\\mathcal{L}']));

test('every symbol in every content formula is explained', async () => {
  const missing = (await realContent()).nodes.flatMap((n) => {
    const u = n.formula ? unexplainedSymbols(n.formula) : [];
    return u.length ? [`${n.id}: ${u.join(', ')}`] : [];
  });
  expect(missing).toEqual([]);
});
