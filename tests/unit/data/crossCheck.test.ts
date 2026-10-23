import { expect, test } from 'vitest';
import { crossCheck } from '../../../src/data/crossCheck';
import { VIZ_IDS } from '../../../src/viz/ids';
import { loadValid, withRule } from '../helpers/fixtures';

test('valid fixture passes', async () => expect(crossCheck(await loadValid(), VIZ_IDS)).toEqual([]));
test.each([
  ['duplicate-id', 'slope'], ['unknown-group', 'orphan-node'], ['layer-mismatch', 'wrong-layer'],
  ['file-location', 'misfiled'], ['unknown-endpoint', 'derivative--needs--ghost'], ['needs-endpoints', 'ols--needs--g-math'],
  ['implemented-in-target', 'ols--implemented-in--slope'], ['unknown-tour-stop', 't1'], ['unknown-viz', 'bad-viz'],
  ['unresolved-ref', 'bad-ref'], ['shows-up-in-required', 'no-shows-up'], ['needs-cycle', undefined],
])('%s fixture reports %s', async (rule, id) => {
  const issues = crossCheck(await withRule(rule), VIZ_IDS);
  expect(issues).toContainEqual(expect.objectContaining({ rule, severity: 'error', ...(id && { id }) }));
});
test('needs-cycle message shows the path', async () => {
  const [i] = crossCheck(await withRule('needs-cycle'), VIZ_IDS).filter((i) => i.rule === 'needs-cycle');
  expect(i.message).toContain('derivative → slope → derivative');
});
test('code-tool-kind flags code.tool naming a non-tool node', async () => {
  const issues = crossCheck(await withRule('code-tool-kind'), VIZ_IDS).filter((i) => i.rule === 'code-tool-kind');
  expect(issues).toEqual([expect.objectContaining({ id: 'math-tool', severity: 'error' })]);
});
test('unresolved-ref reports both code.tool and fixedBy', async () => {
  const refs = crossCheck(await withRule('unresolved-ref'), VIZ_IDS).filter((i) => i.rule === 'unresolved-ref');
  expect(refs.map((i) => i.message).join(' ')).toMatch(/ghost.*phantom|phantom.*ghost/);
});
