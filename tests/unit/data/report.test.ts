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

test('report renders Phase 2 fields when present, and only then', async () => {
  const c = await loadValid();
  c.nodes = c.nodes.map((n) =>
    n.id !== 'ols'
      ? n
      : {
          ...n,
          recipe: {
            problem: { text: 'Predict a number.', node: 'regression' },
            modelFamily: { text: 'A straight line.' },
            loss: { text: 'Squared error.' },
            optimizer: { text: 'A closed form.' },
            evaluation: { text: 'Test error.' },
          },
          strengths: [{ text: 'Fast.' }, { text: 'Clear.' }],
          weaknesses: [{ text: 'Overfits with many features.', fixedBy: 'overfitting' }, { text: 'Only lines.' }],
          formula: { tex: 'y = \\beta x', symbols: [{ symbol: '\\beta', meaning: 'The slope.' }] },
          code: { tool: 'sklearn', snippet: 'a = 1\nb = 2\nc = 3' },
          confusions: ['It is not logistic regression.'],
          resources: [{ title: 'Linear models', url: 'https://scikit-learn.org/stable/modules/linear_model.html' }],
        },
  );
  const md = renderReport(c);
  const ols = md.slice(md.indexOf('(`ols`)'));
  for (const s of [
    '**Recipe:**',
    '- Problem: Predict a number. (→ regression)',
    '- Model family: A straight line.',
    '**Strengths:**',
    '**Weaknesses:**',
    '- Overfits with many features. (fixed by overfitting)',
    '**Formula:** `y = \\beta x`',
    '- `\\beta`: The slope.',
    '**Code (sklearn):**',
    '```python\na = 1\nb = 2\nc = 3\n```',
    '**Confusions:**',
    '- It is not logistic regression.',
    '**Go further:**',
    '[Linear models](https://scikit-learn.org/stable/modules/linear_model.html)',
  ]) {
    expect(ols).toContain(s);
  }
  const slope = md.slice(md.indexOf('(`slope`)'), md.indexOf('(`derivative`)'));
  for (const h of ['**Recipe:**', '**Strengths:**', '**Weaknesses:**', '**Formula:**', '**Code', '**Confusions:**', '**Go further:**']) {
    expect(slope).not.toContain(h);
  }
});
