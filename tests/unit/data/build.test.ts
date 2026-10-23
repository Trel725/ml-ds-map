import { expect, test } from 'vitest';
import { buildContent } from '../../../src/data/build';

test('valid fixture builds ok in strict mode', async () =>
  expect((await buildContent('tests/fixtures/valid/content', { strict: true })).ok).toBe(true));
test('warnings fail only in strict mode', async () => {
  const loose = await buildContent('tests/fixtures/warn-only/content', { strict: false });
  expect(loose.ok).toBe(true);
  expect(loose.issues).toContainEqual(expect.objectContaining({ rule: 'orphan-node', severity: 'warning', id: 'lonely' }));
  expect((await buildContent('tests/fixtures/warn-only/content', { strict: true })).ok).toBe(false);
});
test('errors fail in both modes', async () =>
  expect((await buildContent('tests/fixtures/bad-yaml/content', { strict: false })).ok).toBe(false));
