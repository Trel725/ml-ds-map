import { expect, test } from 'vitest';
import { buildContent } from '../../../src/data/build';
import { formatIssue } from '../../../src/data/issues';

test('real content builds in strict mode', async () => {
  const r = await buildContent('content', { strict: true });
  expect(r.issues.map(formatIssue)).toEqual([]);
  expect(r.content.nodes.length).toBeGreaterThanOrEqual(120);
  expect(r.content.edges.filter((e) => e.signature).length).toBe(26);
});

test('tour 1 exists with 6 stops', async () => {
  const t = (await buildContent('content', { strict: true })).content.tours.find((t) => t.id === 'how-a-model-learns')!;
  expect(t.title).toBe('How a model learns');
  expect(t.stops.map((s) => s.node)).toEqual(['functions-and-graphs', 'loss-function', 'slope', 'gradient', 'gradient-descent', 'logistic-regression']);
});
