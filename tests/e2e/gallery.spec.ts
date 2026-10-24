import { expect, test } from '@playwright/test';
import { gotoMap } from './helpers';

test('Gallery button opens every visualization, all rendered', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('button', { name: 'Gallery' }).click();
  await expect(page).toHaveURL(/#\/gallery$/);
  await expect(page.getByRole('main', { name: 'Visualizations' })).toBeVisible();
  await expect(page.getByTestId('gallery-card')).toHaveCount(25);
  await expect(page.getByTestId('viz-takeaway')).toHaveCount(25);
  await expect(page.locator('.viz-fallback')).toHaveCount(0);
  await expect(page.locator('svg.map')).toHaveCount(0);
});

test('controls in one card do not change another', async ({ page }) => {
  await gotoMap(page, '#/gallery');
  const gd = page.locator('[data-testid="gallery-card"][data-viz-id="gradient-descent"]');
  const ols = page.locator('[data-testid="gallery-card"][data-viz-id="ols-fit"]');
  const before = await ols.getByTestId('viz-readout').textContent();
  await gd.getByRole('button', { name: 'Step' }).click();
  await expect(gd.getByTestId('viz-readout')).toContainText('Step 1');
  await expect(ols.getByTestId('viz-readout')).toHaveText(before!);
});

test('a topic chip opens the node on the map; Back returns to the gallery', async ({ page }) => {
  await gotoMap(page, '#/gallery');
  await page.locator('[data-testid="gallery-card"][data-viz-id="gradient-descent"]').getByTestId('gallery-topic').first().click();
  await expect(page).toHaveURL(/#\/n\/gradient-descent$/);
  await expect(page.locator('svg.map')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('main', { name: 'Visualizations' })).toBeVisible();
});

test('Escape leaves the gallery for the map', async ({ page }) => {
  await gotoMap(page, '#/gallery');
  await page.keyboard.press('Escape');
  await expect(page.locator('svg.map')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gallery' })).toHaveAttribute('aria-pressed', 'false');
});
