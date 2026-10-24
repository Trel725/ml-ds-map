import { expect, test } from 'vitest';
import { tfidf, tokenize } from '../../../src/viz/tf-idf/model';

const docs = ['Win a free prize now', 'Your invoice for the meeting is attached', 'Claim the free gift and the prize'].map(tokenize);

test('tokenize lowercases and splits on non-letters', () =>
  expect(tokenize('Win a FREE prize, now!!')).toEqual(['win', 'a', 'free', 'prize', 'now']));
test('punctuation and case do not create new terms', () => {
  const [w] = tfidf([tokenize('Prize! prize. PRIZE')]);
  expect([...w.keys()]).toEqual(['prize']);
});
test('a word in every doc has the lowest weight in each doc', () => {
  const ds = [tokenize('the cat sat'), tokenize('the dog ran'), tokenize('the bird flew')];
  for (const w of tfidf(ds)) {
    const min = Math.min(...w.values());
    expect(w.get('the')).toBe(min);
    for (const [word, v] of w) if (word !== 'the') expect(v).toBeGreaterThan(min);
  }
});
test('a word in only one doc gets the highest idf', () => {
  const w = tfidf(docs);
  // "invoice" appears once in a doc of 7 words; "the" appears in two docs.
  expect(w[1].get('invoice')!).toBeGreaterThan(w[1].get('the')!);
  // "win" (one doc) outweighs "free" (two docs) at the same count and doc length.
  expect(w[0].get('win')!).toBeGreaterThan(w[0].get('free')!);
});
test('an empty sentence gives an empty map and no NaN', () => {
  const w = tfidf([tokenize(''), tokenize('a b'), tokenize('   ...  ')]);
  expect(w[0].size).toBe(0);
  expect(w[2].size).toBe(0);
  for (const m of w) for (const v of m.values()) expect(Number.isFinite(v)).toBe(true);
  expect(tfidf([])).toEqual([]);
});
