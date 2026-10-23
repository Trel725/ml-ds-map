import { expect, test } from '@playwright/test';
import { gotoMap } from './helpers';

test('first visit shows only lanes, then Explore shows groups', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-lane]')).toHaveCount(5);
  await expect(page.locator('[data-group-id]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Explore the map' }).click();
  await expect(page.locator('[data-group-id="calculus"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-group-id="calculus"]')).toBeVisible(); // visited remembered
});

test('foundations lane is at the bottom', async ({ page }) => {
  await gotoMap(page);
  const f = await page.locator('[data-lane="foundations"]').boundingBox();
  const p = await page.locator('[data-lane="problems"]').boundingBox();
  expect(f!.y).toBeGreaterThan(p!.y);
});

test('click expands a group in place; keyboard Enter collapses it', async ({ page }) => {
  await gotoMap(page);
  await page.locator('[data-group-id="calculus"]').click();
  await expect(page.locator('[data-node-id="chain-rule"]')).toBeVisible();
  await page.locator('[data-group-id="calculus"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-node-id="chain-rule"]')).toBeHidden();
});

test('nodes and groups are keyboard reachable with descriptive labels', async ({ page }) => {
  await gotoMap(page);
  await expect(page.locator('[data-group-id="calculus"]')).toHaveAttribute('aria-label', 'Calculus group, 3 topics');
  await page.locator('[data-group-id="calculus"]').click();
  const node = page.locator('[data-node-id="gradient"]');
  await expect(node).toHaveAttribute('tabindex', '0');
  await expect(node).toHaveAttribute('aria-label', 'Gradient: A list of slopes, one per parameter.');
});

test('tools rail lists 8 tools', async ({ page }) => {
  await gotoMap(page);
  await expect(page.locator('[data-node-id="scikit-learn"]')).toBeVisible();
  await expect(page.locator('.tools-rail [data-node-id]')).toHaveCount(8);
});

test('theme toggle sets data-theme', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('button', { name: 'Theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('unknown hash shows notice', async ({ page }) => {
  await gotoMap(page, '#/n/no-such-node');
  await expect(page.getByTestId('notice')).toHaveText('Not found');
});

test('works with storage blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  await page.goto('/');
  await expect(page.locator('[data-lane]')).toHaveCount(5);
  await page.getByRole('button', { name: 'Explore the map' }).click();
  await expect(page.locator('[data-group-id="calculus"]')).toBeVisible();
});
