import { expect, test } from '@playwright/test';
import { gotoMap } from './helpers';

test('tour 1 runs start to finish', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('button', { name: 'Start the tour' }).click();
  const card = page.getByTestId('tour-card');
  await expect(card).toHaveAttribute('role', 'dialog');
  await expect(card).toHaveAttribute('aria-label', 'How a model learns');
  await expect(card).toContainText('Step 1 of 6');
  await expect(page).toHaveURL(/#\/n\/functions-and-graphs$/);
  for (let i = 2; i <= 6; i++) {
    await card.getByRole('button', { name: 'Next' }).click();
    await expect(card).toContainText(`Step ${i} of 6`);
  }
  await expect(page).toHaveURL(/#\/n\/logistic-regression$/);
  await expect(page.locator('[data-node-id="slope"]')).toHaveAttribute('data-highlighted', 'true');
  await card.getByRole('button', { name: 'Finish' }).click();
  await expect(card).toHaveCount(0);
});

test('Back is disabled on step 1; Close ends the tour', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('button', { name: 'Start the tour' }).click();
  const card = page.getByTestId('tour-card');
  await expect(card.getByRole('button', { name: 'Back' })).toBeDisabled();
  await card.getByRole('button', { name: 'Next' }).click();
  await expect(card.getByRole('button', { name: 'Back' })).toBeEnabled();
  await card.getByRole('button', { name: 'Back' }).click();
  await expect(card).toContainText('Step 1 of 6');
  await card.getByRole('button', { name: 'Close' }).click();
  await expect(card).toHaveCount(0);
  await expect(page.locator('[data-highlighted="true"]')).toHaveCount(0);
});

test('Escape closes the tour before it clears the selection', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('button', { name: 'Start the tour' }).click();
  await expect(page.getByTestId('tour-card')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('tour-card')).toHaveCount(0);
  await expect(page.getByTestId('panel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('panel')).toHaveCount(0);
});
