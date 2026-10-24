import { expect, test } from '@playwright/test';
import { gotoMap } from './helpers';

test('NLP lens highlights NLP nodes across layers and fades the rest', async ({ page }) => {
  await gotoMap(page);
  const lenses = page.getByRole('group', { name: 'Lenses' });
  await lenses.getByRole('button', { name: 'NLP' }).click();
  await expect(lenses.getByRole('button', { name: 'NLP' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-group-id="text-processing"]')).toHaveAttribute('data-highlighted', 'true');
  await expect(page.locator('[data-group-id="probabilistic-models"]')).toHaveAttribute('data-highlighted', 'true'); // naive-bayes
  await expect(page.locator('[data-group-id="calculus"]')).toHaveAttribute('data-faded', 'true');
});

test('only one lens at a time', async ({ page }) => {
  await gotoMap(page);
  const lenses = page.getByRole('group', { name: 'Lenses' });
  await lenses.getByRole('button', { name: 'NLP' }).click();
  await lenses.getByRole('button', { name: 'Econometrics' }).click();
  await expect(lenses.getByRole('button', { name: 'Econometrics' })).toHaveAttribute('aria-pressed', 'true');
  await expect(lenses.getByRole('button', { name: 'NLP' })).toHaveAttribute('aria-pressed', 'false');
  await lenses.getByRole('button', { name: 'Econometrics' }).click();
  await expect(lenses.getByRole('button', { name: 'Econometrics' })).toHaveAttribute('aria-pressed', 'false');
});

test('lens survives selection; Escape clears selection, then the lens', async ({ page }) => {
  await gotoMap(page);
  const nlp = page.getByRole('group', { name: 'Lenses' }).getByRole('button', { name: 'NLP' });
  await nlp.click();
  await page.goto('/#/n/gradient-descent');
  await expect(page.getByTestId('panel')).toBeVisible();
  await expect(nlp).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-group-id="text-processing"]')).toHaveAttribute('data-highlighted', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('panel')).toHaveCount(0);
  await expect(nlp).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(nlp).toHaveAttribute('aria-pressed', 'false');
});

test('starting a trace turns the lens chip off', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  const nlp = page.getByRole('group', { name: 'Lenses' }).getByRole('button', { name: 'NLP' });
  await nlp.click();
  await expect(nlp).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Trace all prerequisites' }).click();
  await expect(nlp).toHaveAttribute('aria-pressed', 'false');
});
