import { expect, test } from '@playwright/test';
import { gotoMap } from './helpers';

test('"linear regression" selects OLS', async ({ page }) => {
  await gotoMap(page);
  await expect(page.locator('[data-group-id="calculus"]')).toBeVisible();
  await page.keyboard.press('/');
  await page.keyboard.type('linear regression');
  await expect(page.getByRole('option').first()).toContainText('OLS');
  await expect(page.getByRole('option').first()).toContainText('Linear models');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/n\/ols$/);
  await expect(page.locator('[data-node-id="ols"]')).toBeVisible();
  const box = page.getByRole('combobox', { name: 'Search' });
  await expect(box).toHaveValue('');
  await expect(box).toHaveAttribute('aria-expanded', 'false');
});

test('arrow keys move through results', async ({ page }) => {
  await gotoMap(page);
  const box = page.getByRole('combobox', { name: 'Search' });
  await box.fill('regression');
  const options = page.getByRole('option');
  await expect(options.nth(1)).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
  const id = await options.nth(1).getAttribute('id');
  await expect(box).toHaveAttribute('aria-activedescendant', id!);
  await page.keyboard.press('ArrowUp');
  await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true');
  const label = (await options.nth(1).locator('.option-label').textContent())!;
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('panel').getByRole('heading', { level: 2 })).toHaveText(label);
});

test('no match shows no listbox', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('combobox', { name: 'Search' }).fill('zzzzqqq');
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Search' })).toHaveAttribute('aria-expanded', 'false');
});

test('clearing the query closes the list', async ({ page }) => {
  await gotoMap(page);
  const box = page.getByRole('combobox', { name: 'Search' });
  await box.fill('bayes rule');
  await expect(page.getByRole('option').first()).toContainText("Bayes' rule");
  await box.fill('   ');
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(box).toHaveAttribute('aria-expanded', 'false');
});

test('Escape closes the list without clearing the selection', async ({ page }) => {
  await gotoMap(page, '#/n/pca');
  const box = page.getByRole('combobox', { name: 'Search' });
  await box.fill('pca');
  await expect(page.getByRole('option').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(page.getByTestId('panel')).toBeVisible();
});

test('clicking an option picks it', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('combobox', { name: 'Search' }).fill('PCA');
  await page.getByRole('option').first().click();
  await expect(page).toHaveURL(/#\/n\/pca$/);
});
