import { expect, test } from '@playwright/test';
import { gotoMap } from './helpers';

test('direct link opens the panel', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  const panel = page.getByTestId('panel');
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText('Gradient descent');
  await expect(panel).toContainText('Repeatedly step downhill on the loss to improve a model.');
  await expect(panel.locator('em.analogy')).toHaveText(/walking downhill in fog, feeling the slope with your feet/i);
  await expect(panel).not.toContainText('Like:'); // the intuition already holds the analogy, so it is not repeated
  await expect(page.locator('[data-node-id="gradient-descent"]')).toBeVisible(); // group revealed
});

test('trace prerequisites from gradient descent: foundations first, path highlighted', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.getByRole('button', { name: 'Trace all prerequisites' }).click();
  const chips = page.getByTestId('trace-chip');
  await expect(chips.first()).toBeVisible();
  const ids = await chips.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.nodeRef));
  expect(ids.indexOf('slope')).toBeLessThan(ids.indexOf('derivative'));
  await expect(page.locator('[data-node-id="slope"]')).toHaveAttribute('data-highlighted', 'true'); // algebra-basics auto-expanded
  await expect(page.locator('[data-edge-key="derivative->slope"]')).toBeVisible();
});

test('foundation node shows "where it shows up" and no trace button', async ({ page }) => {
  await gotoMap(page, '#/n/functions-and-graphs');
  await expect(page.getByTestId('panel')).toContainText('Where it shows up');
  await expect(page.getByTestId('shows-up-chip').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trace all prerequisites' })).toHaveCount(0);
  await expect(page.getByText('What you need first')).toHaveCount(0);
});

test('non-math node has no "where it shows up" section', async ({ page }) => {
  await gotoMap(page, '#/n/ols');
  await expect(page.getByTestId('panel').getByRole('heading', { level: 2 })).toHaveText('OLS');
  await expect(page.getByText('Where it shows up')).toHaveCount(0);
  await expect(page.getByTestId('prereq-chip').first()).toBeVisible();
});

test('edge link opens the edge panel with both ends', async ({ page }) => {
  await gotoMap(page, '#/e/random-forest--fixes-weakness-of--decision-tree');
  await expect(page.getByTestId('edge-panel')).toContainText('variance');
  await expect(page.getByTestId('edge-end-chip')).toHaveCount(2);
});

test('chip navigation updates the hash and the breadcrumb', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.locator('[data-testid="prereq-chip"][data-node-ref="gradient"]').click();
  await expect(page).toHaveURL(/#\/n\/gradient$/);
  await expect(page.getByTestId('panel').getByRole('heading', { level: 2 })).toHaveText('Gradient');
  await expect(page.locator('nav[aria-label="Recent"] button')).toHaveCount(2);
  await page.goBack();
  await expect(page.getByTestId('panel').getByRole('heading', { level: 2 })).toHaveText('Gradient descent');
});

test('no selection shows welcome with Start the tour', async ({ page }) => {
  await gotoMap(page);
  await expect(page.getByRole('button', { name: 'Start the tour' })).toBeVisible();
  await expect(page.getByTestId('panel')).toHaveCount(0);
});
