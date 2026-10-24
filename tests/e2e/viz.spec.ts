import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoMap } from './helpers';

/** Opens a node, waits for its visualization, operates one control by keyboard and expects the readout to change. */
async function exercise(page: Page, node: string, vizId: string, control: (viz: Locator) => Locator, keys: string[]) {
  await gotoMap(page, `#/n/${node}`);
  const viz = page.locator(`[data-testid="viz"][data-viz-id="${vizId}"]`);
  const readout = viz.getByTestId('viz-readout');
  await expect(readout).toBeVisible();
  await expect(viz.getByTestId('viz-takeaway')).not.toBeEmpty();
  await expect(readout).toHaveAttribute('aria-live', 'polite');
  const before = (await readout.textContent())!;
  await control(viz).focus();
  for (const k of keys) await page.keyboard.press(k);
  await expect(readout).not.toHaveText(before);
  return { viz, readout };
}

const right3 = ['ArrowRight', 'ArrowRight', 'ArrowRight'];

test('logarithms', async ({ page }) => {
  const { viz, readout } = await exercise(page, 'exponents-and-logarithms', 'logarithms', (v) => v.getByRole('slider', { name: 'x' }), right3);
  await expect(readout).toContainText('is 10 to the power');
  await viz.getByRole('switch', { name: 'Log scale' }).click();
  await expect(readout).toContainText('log scale on');
});

test('slope-derivative', async ({ page }) => {
  const { readout } = await exercise(page, 'derivative', 'slope-derivative', (v) => v.getByRole('slider', { name: 'Second point' }), [
    'ArrowLeft',
    'ArrowLeft',
    'ArrowLeft',
  ]);
  await expect(readout).toContainText('slope at the point 2.00');
  await expect(readout).toContainText('Gap 1.85');
});

test('gradient-descent', async ({ page }) => {
  const { viz, readout } = await exercise(page, 'gradient-descent', 'gradient-descent', (v) => v.getByRole('button', { name: 'Step' }), [
    'Enter',
  ]);
  await expect(readout).toContainText('Step 1');
  const slider = viz.getByRole('slider', { name: 'Learning rate' });
  await slider.focus();
  await page.keyboard.press('End');
  await expect(readout).toHaveText(/^Step 0 · learning rate 1\.20/);
  await viz.getByRole('button', { name: 'Step' }).focus();
  for (let i = 0; i < 25; i++) await page.keyboard.press('Enter');
  await expect(readout).toContainText('exploding');
});

test('ols-fit', async ({ page }) => {
  const { readout } = await exercise(page, 'ols', 'ols-fit', (v) => v.getByRole('slider').first(), ['ArrowUp', 'ArrowUp', 'ArrowUp']);
  await expect(readout).toHaveText(/^Total square area \d+$/);
});

test('overfitting', async ({ page }) => {
  const { readout } = await exercise(page, 'overfitting', 'overfitting', (v) => v.getByRole('slider', { name: 'Complexity' }), right3);
  await expect(readout).toHaveText(/^Degree 4 · training error \d+ · test error \d+$/);
});

test('decision-tree', async ({ page }) => {
  const { readout } = await exercise(page, 'decision-tree', 'decision-tree', (v) => v.getByRole('slider', { name: 'Depth' }), right3);
  await expect(readout).toHaveText(/^Depth 4 · \d+ regions · training accuracy \d+%$/);
});

test('classification-threshold', async ({ page }) => {
  const { viz, readout } = await exercise(page, 'classification', 'classification-threshold', (v) => v.getByRole('slider', { name: 'Threshold', exact: true }), right3);
  await expect(readout).toHaveText(/^Threshold 0\.65 · precision \d\.\d\d · recall \d\.\d\d$/);
  const before = await readout.textContent();
  await viz.getByRole('slider', { name: 'Threshold line' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(readout).not.toHaveText(before!);
});

test('bayes-rule', async ({ page }) => {
  const { readout } = await exercise(page, 'bayes-rule', 'bayes-rule', (v) => v.getByRole('slider', { name: 'Base rate' }), right3);
  await expect(readout).toHaveText(/^Base rate \d+\.\d% · \d+ true positives, \d+ false positives · chance of the condition after a positive test \d+%$/);
});

test('loss-functions', async ({ page }) => {
  const { readout } = await exercise(page, 'loss-function', 'loss-functions', (v) => v.getByRole('slider', { name: 'Prediction' }), right3);
  await expect(readout).toHaveText(/^Prediction 0\.53 · squared 0\.22 · absolute 0\.47 · log 0\.63$/);
});

test('regularization', async ({ page }) => {
  const { viz, readout } = await exercise(page, 'regularization', 'regularization', (v) => v.getByRole('slider', { name: 'Penalty strength' }), right3);
  await expect(readout).toHaveText(/^Ridge · penalty \d[\d.]* · \d of 9 weights non-zero · test error \d+$/);
  await viz.getByRole('switch', { name: 'Lasso' }).click();
  await expect(readout).toHaveText(/^Lasso · penalty \d[\d.]* · \d of 9 weights non-zero · test error \d+$/);
  await viz.getByRole('slider', { name: 'Penalty strength' }).focus();
  await page.keyboard.press('End');
  await expect(readout).toHaveText(/^Lasso · penalty 100 · [0-4] of 9 weights non-zero/);
});

test('every visualization renders', async ({ page }) => {
  const pairs = [
    ['exponents-and-logarithms', 'logarithms'], ['derivative', 'slope-derivative'], ['gradient-descent', 'gradient-descent'],
    ['ols', 'ols-fit'], ['overfitting', 'overfitting'], ['decision-tree', 'decision-tree'],
    ['classification', 'classification-threshold'], ['bayes-rule', 'bayes-rule'],
    ['loss-function', 'loss-functions'], ['regularization', 'regularization'],
  ];
  await gotoMap(page);
  for (const [node, id] of pairs) {
    await page.evaluate((h) => (window.location.hash = h), `#/n/${node}`);
    await expect(page.locator(`[data-viz-id="${id}"] [data-testid="viz-readout"]`)).toBeVisible();
    await expect(page.locator('.viz-fallback')).toHaveCount(0);
  }
});
