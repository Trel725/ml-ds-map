import { expect, test } from 'vitest';
import { edgeSchema, nodeSchema, tourSchema } from '../../../src/data/schema';

const minimalNode = {
  id: 'slope', label: 'Slope', layer: 'foundations', group: 'algebra-basics', kind: 'foundation',
  oneLiner: 'How fast one thing changes when another does', intuition: 'One. Two.',
};
const stop = (n: number) => ({ node: `n${n}`, caption: 'A stop.' });

test('edge id defaults to from--type--to', () => {
  const e = edgeSchema.parse({ from: 'derivative', to: 'slope', type: 'needs', sentence: 'A derivative needs slope.' });
  expect(e.id).toBe('derivative--needs--slope');
  expect(e.signature).toBe(false);
});
test('explicit edge id is kept', () =>
  expect(edgeSchema.parse({ id: 'x', from: 'a', to: 'b', type: 'needs', sentence: 's' }).id).toBe('x'));
test('rejects unknown edge type', () =>
  expect(edgeSchema.safeParse({ from: 'a', to: 'b', type: 'related-to', sentence: 'x' }).success).toBe(false));
test('accepts the minimal node', () => expect(nodeSchema.safeParse(minimalNode).success).toBe(true));
test('rejects non-kebab id', () =>
  expect(nodeSchema.safeParse({ ...minimalNode, id: 'Gradient_Descent' }).success).toBe(false));
test('rejects more than 3 resources', () => {
  const r = { title: 'T', url: 'https://example.com' };
  expect(nodeSchema.safeParse({ ...minimalNode, resources: [r, r, r] }).success).toBe(true);
  expect(nodeSchema.safeParse({ ...minimalNode, resources: [r, r, r, r] }).success).toBe(false);
});
test('rejects tour with 4 stops and with 9 stops', () => {
  const tour = (n: number) => ({ id: 't', title: 'T', stops: Array.from({ length: n }, (_, i) => stop(i)) });
  expect(tourSchema.safeParse(tour(4)).success).toBe(false);
  expect(tourSchema.safeParse(tour(9)).success).toBe(false);
  expect(tourSchema.safeParse(tour(5)).success).toBe(true);
  expect(tourSchema.safeParse(tour(8)).success).toBe(true);
});
test('rejects viz id not in VIZ_IDS', () => {
  expect(nodeSchema.safeParse({ ...minimalNode, viz: 'ols-fit' }).success).toBe(true);
  expect(nodeSchema.safeParse({ ...minimalNode, viz: 'nope' }).success).toBe(false);
});
test('synonyms and lenses default to []', () => {
  const n = nodeSchema.parse(minimalNode);
  expect(n.synonyms).toEqual([]);
  expect(n.lenses).toEqual([]);
});
test('layer and group are optional in input', () => {
  const { layer: _l, group: _g, ...rest } = minimalNode;
  expect(nodeSchema.safeParse(rest).success).toBe(true);
});
test('nested Phase 2 objects reject unknown keys (a YAML flow-map comma splits an unquoted value)', () => {
  const slot = { text: 'Inertia', 'silhouette score': null };
  const recipe = { problem: slot, modelFamily: { text: 'a' }, loss: { text: 'a' }, optimizer: { text: 'a' }, evaluation: { text: 'a' } };
  expect(nodeSchema.safeParse({ ...minimalNode, kind: 'algorithm', recipe }).success).toBe(false);
  expect(nodeSchema.safeParse({ ...minimalNode, strengths: [{ text: 'Fast', 'and simple.': null }] }).success).toBe(false);
  expect(nodeSchema.safeParse({ ...minimalNode, formula: { tex: 'x', symbols: [{ symbol: 'x', meaning: 'A', 'b.': null }] } }).success).toBe(false);
});
