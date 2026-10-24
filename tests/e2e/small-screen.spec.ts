import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoMap } from './helpers';

test.use({ viewport: { width: 375, height: 740 } });

/** The page never scrolls sideways. */
async function noSideScroll(page: Page) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client);
}

test('the list replaces the map', async ({ page }) => {
  await gotoMap(page);
  await expect(page.getByTestId('list-view')).toBeVisible();
  await expect(page.locator('svg.map')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Foundations', level: 2 })).toBeVisible();
  await noSideScroll(page);
});

test('tap opens the full panel; Back to list returns to the same item, focused', async ({ page }) => {
  await gotoMap(page);
  const item = page.locator('.list-item[data-node-id="random-forest"]');
  await item.scrollIntoViewIfNeeded();
  await item.click();
  await expect(page.getByTestId('panel')).toBeVisible();
  await expect(page.getByTestId('list-view')).toBeHidden();
  await page.getByRole('button', { name: 'Back to list' }).click();
  await expect(item).toBeFocused();
  await expect(item).toBeInViewport();
});

test('browser Back from a panel returns to the list', async ({ page }) => {
  await gotoMap(page);
  await page.locator('.list-item[data-node-id="slope"]').click();
  await page.goBack();
  await expect(page.getByTestId('list-view')).toBeVisible();
});

test('search opens a panel', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('combobox', { name: 'Search' }).fill('linear regression');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/n\/ols$/);
  await expect(page.getByTestId('panel')).toBeVisible();
});

test('a deep link shows the panel with its visualization and code, without side scroll', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await expect(page.getByTestId('viz-takeaway')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to list' })).toBeVisible();
  await noSideScroll(page);
  await gotoMap(page, '#/n/ols');
  await expect(page.getByTestId('code')).toBeVisible();
  await noSideScroll(page);
});

test('the gallery fits the phone width', async ({ page }) => {
  await gotoMap(page, '#/gallery');
  await expect(page.getByTestId('viz-takeaway')).toHaveCount(25);
  await noSideScroll(page);
});

test('the tour runs over the panel', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('button', { name: 'Start the tour' }).click();
  await expect(page.getByTestId('tour-card')).toBeVisible();
  await expect(page.getByTestId('panel')).toBeVisible();
  const first = page.url();
  await page.getByTestId('tour-card').getByRole('button', { name: 'Next' }).click();
  await expect(page).not.toHaveURL(first);
});

test('resizing across 768 px keeps the selection', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoMap(page, '#/n/ols');
  await expect(page.locator('[data-node-id="ols"]')).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 375, height: 740 });
  await expect(page.getByRole('button', { name: 'Back to list' })).toBeVisible();
  await expect(page).toHaveURL(/#\/n\/ols$/);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('[data-node-id="ols"]')).toHaveAttribute('aria-pressed', 'true');
});
