import { expect, test } from 'vitest';
import { loadContent } from '../../../src/data/load';
import { formatIssue } from '../../../src/data/issues';

test('valid fixture loads with no issues', async () => {
  const { content, issues } = await loadContent('tests/fixtures/valid/content');
  expect(issues).toEqual([]);
  expect(content.nodes.map((n) => n.id).sort()).toEqual(['derivative', 'ols', 'overfitting', 'regression', 'sklearn', 'slope']);
  expect(content.nodes.find((n) => n.id === 'slope')!.source).toBe('content/nodes/foundations/g-found.yaml');
});
test('layer and group come from the file path', async () => {
  const { content } = await loadContent('tests/fixtures/valid/content');
  expect(content.nodes.find((n) => n.id === 'ols')).toMatchObject({ layer: 'algorithms', group: 'g-alg' });
  expect(content.edges[0].id).toBe('derivative--needs--slope');
  expect(content.tours[0]).toMatchObject({ id: 't1', source: 'content/tours/t1.yaml' });
});
test('bad YAML reports yaml-syntax with file name', async () => {
  const { issues } = await loadContent('tests/fixtures/bad-yaml/content');
  expect(issues[0]).toMatchObject({ rule: 'yaml-syntax', file: 'content/groups.yaml', severity: 'error' });
});
test('formatIssue', () => {
  expect(formatIssue({ severity: 'error', rule: 'r', file: 'f.yaml', id: 'x', message: 'm' })).toBe('f.yaml [x] r: m');
  expect(formatIssue({ severity: 'error', rule: 'r', file: 'f.yaml', message: 'm' })).toBe('f.yaml r: m');
});
