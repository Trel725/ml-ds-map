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
