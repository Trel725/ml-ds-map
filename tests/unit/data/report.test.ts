import { expect, test } from 'vitest';
import { renderReport } from '../../../src/data/report';
import { loadValid } from '../helpers/fixtures';

test('report orders nodes foundations first and shows needs', async () => {
  const md = renderReport(await loadValid());
  expect(md.indexOf('(`slope`)')).toBeLessThan(md.indexOf('(`derivative`)'));
  expect(md.indexOf('(`derivative`)')).toBeLessThan(md.indexOf('(`ols`)'));
  expect(md).toContain('## Slope (`slope`)');
  expect(md).toContain('**One-liner:** How fast one thing changes when another does.');
  expect(md).toContain('**Shows up in:** The seed of derivatives.');
  expect(md).toContain('Needs: Slope');
});
