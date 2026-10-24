import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoMap } from './helpers';

/** The focused element's node id. */
const focusedId = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('data-node-id') ?? null);

test('arrows move focus to neighbors, opening collapsed groups', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.locator('[data-node-id="gradient-descent"]').focus();
  await page.keyboard.press('ArrowUp');
  const up = await focusedId(page);
  expect(up).not.toBeNull();
  expect(up).not.toBe('gradient-descent');
  const a = await page.locator('[data-node-id="gradient-descent"]').boundingBox();
  const b = await page.locator(`[data-node-id="${up}"]`).boundingBox();
  expect(b!.y).toBeLessThan(a!.y);
  await expect(page.getByTestId('nav-announce')).not.toBeEmpty();
});

test('right walks every neighbor and returns to the selected node', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.locator('[data-node-id="gradient-descent"]').focus();
  const seen = new Set<string>();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('ArrowRight');
    const id = (await focusedId(page))!;
    if (id === 'gradient-descent') break;
    seen.add(id);
  }
  for (const n of ['gradient', 'loss-landscape', 'learning-rate', 'logistic-regression', 'backpropagation']) expect(seen).toContain(n);
  await expect(page.getByTestId('nav-announce')).toBeEmpty();
});

test('Enter on a focused neighbor follows the edge', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.locator('[data-node-id="gradient-descent"]').focus();
  await page.keyboard.press('ArrowRight');
  const id = (await focusedId(page))!;
  expect(id).not.toBe('gradient-descent');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`#/n/${id}$`));
  await expect(page.locator(`[data-node-id="${id}"]`)).toBeFocused();
});

test('arrows in the search box and panel sliders do not move map focus', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.getByRole('slider', { name: 'Learning rate' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('slider', { name: 'Learning rate' })).toBeFocused();
  await expect(page).toHaveURL(/#\/n\/gradient-descent$/);
});

test('arrows do nothing without a selection', async ({ page }) => {
  await gotoMap(page);
  await page.locator('[data-group-id="calculus"]').click(); // expands; nothing selected
  await page.locator('[data-node-id="gradient"]').focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('[data-node-id="gradient"]')).toBeFocused();
});

test('welcome names the keyboard keys', async ({ page }) => {
  await gotoMap(page);
  await expect(page.getByText('arrow keys follow its connections')).toBeVisible();
});
