import { expect, test } from 'vitest';
import { buildContent } from '../../../src/data/build';
import type { LintRule } from '../../../src/data/lint';

test('valid fixture builds ok in strict mode', async () =>
  expect((await buildContent('tests/fixtures/valid/content', { strict: true })).ok).toBe(true));
test('warnings fail only in strict mode', async () => {
  const warningRules: LintRule[] = ['orphan-node'];
  const loose = await buildContent('tests/fixtures/warn-only/content', { strict: false, warningRules });
  expect(loose.ok).toBe(true);
  expect(loose.issues).toContainEqual(expect.objectContaining({ rule: 'orphan-node', severity: 'warning', id: 'lonely' }));
  expect((await buildContent('tests/fixtures/warn-only/content', { strict: true, warningRules })).ok).toBe(false);
});
test('errors fail in both modes', async () =>
  expect((await buildContent('tests/fixtures/bad-yaml/content', { strict: false })).ok).toBe(false));
