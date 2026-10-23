import { expect, test } from 'vitest';
import { readJson, readString, writeJson, writeString } from '../../../src/app/storage';
import type { KV } from '../../../src/app/storage';
import { mem } from '../helpers/kv';

const isArr = (v: unknown): v is unknown[] => Array.isArray(v);
const throwing: KV = {
  getItem() {
    throw new Error('denied');
  },
  setItem() {
    throw new Error('denied');
  },
};

test('readJson returns null when storage throws', () => expect(readJson(throwing, 'k', isArr)).toBeNull());
test('writeJson swallows errors', () => expect(() => writeJson(throwing, 'k', 1)).not.toThrow());
test('readJson returns null on non-JSON', () => expect(readJson(mem({ k: '{oops' }), 'k', isArr)).toBeNull());
test('readJson returns null when the guard rejects', () => expect(readJson(mem({ k: '{"a":1}' }), 'k', isArr)).toBeNull());
test('readJson returns null for null storage or missing key', () => {
  expect(readJson(null, 'k', isArr)).toBeNull();
  expect(readJson(mem(), 'k', isArr)).toBeNull();
});
test('writeJson then readJson round-trips', () => {
  const kv = mem();
  writeJson(kv, 'k', ['a']);
  expect(readJson(kv, 'k', isArr)).toEqual(['a']);
});
test('readString/writeString are safe', () => {
  expect(readString(throwing, 'k')).toBeNull();
  expect(() => writeString(throwing, 'k', 'v')).not.toThrow();
  const kv = mem();
  writeString(kv, 'k', 'v');
  expect(readString(kv, 'k')).toBe('v');
});
