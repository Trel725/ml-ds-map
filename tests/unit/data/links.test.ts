import { expect, test } from 'vitest';
import { checkResourceUrl } from '../../../src/data/links';

test('book site home page passes', () => expect(checkResourceUrl('https://www.statlearning.com/')).toEqual({ ok: true }));
test('a specific allow-listed page passes', () =>
  expect(checkResourceUrl('https://scikit-learn.org/stable/modules/linear_model.html')).toEqual({ ok: true }));
test('a channel home page fails', () => expect(checkResourceUrl('https://www.youtube.com/@statquest').ok).toBe(false));
test('an unknown domain fails', () => expect(checkResourceUrl('https://example.com/ml').ok).toBe(false));
test('plain http fails', () =>
  expect(checkResourceUrl('http://scikit-learn.org/stable/modules/linear_model.html').ok).toBe(false));
test('a non-URL fails without throwing', () => expect(checkResourceUrl('not a url').ok).toBe(false));
