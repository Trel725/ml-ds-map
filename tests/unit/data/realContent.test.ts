import { expect, test } from 'vitest';
import { buildContent } from '../../../src/data/build';
import { formatIssue } from '../../../src/data/issues';

test('real content builds in strict mode', async () => {
  const r = await buildContent('content', { strict: true });
  expect(r.issues.map(formatIssue)).toEqual([]);
  expect(r.content.nodes.length).toBeGreaterThanOrEqual(120);
  expect(r.content.edges.filter((e) => e.signature).length).toBe(26);
});
