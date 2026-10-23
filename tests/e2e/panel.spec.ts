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

test('OLS recipe card: five slots in order, optimizer links to analytical solution', async ({ page }) => {
  await gotoMap(page, '#/n/ols');
  const slots = page.getByTestId('recipe-slot');
  await expect(slots).toHaveCount(5);
  expect(await slots.evaluateAll((els) => els.map((e) => e.getAttribute('data-slot')))).toEqual(['problem', 'modelFamily', 'loss', 'optimizer', 'evaluation']);
  await page.locator('[data-slot="optimizer"] [data-node-ref="analytical-solution"]').click();
  await expect(page).toHaveURL(/#\/n\/analytical-solution$/);
});

test('k-means shows the reduced recipe with four slots', async ({ page }) => {
  await gotoMap(page, '#/n/k-means');
  const slots = page.getByTestId('recipe-slot');
  expect(await slots.evaluateAll((els) => els.map((e) => e.getAttribute('data-slot')))).toEqual(['goal', 'optimizes', 'optimizer', 'judgedBy']);
  await expect(page.getByTestId('recipe')).toContainText('Judged by');
});

test('Light up the recipe highlights slot nodes across layers', async ({ page }) => {
  await gotoMap(page, '#/n/logistic-regression');
  const button = page.getByRole('button', { name: 'Light up the recipe' });
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-node-id="log-loss"]')).toHaveAttribute('data-highlighted', 'true');
  await expect(page.locator('[data-node-id="classification"]')).toHaveAttribute('data-highlighted', 'true');
});

test('Trace all uses from slope highlights groups, lists uses, expands nothing new', async ({ page }) => {
  await gotoMap(page, '#/n/slope');
  const button = page.getByRole('button', { name: 'Trace all uses' });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('uses-chip').first()).toBeVisible();
  await expect(page.getByTestId('panel')).toContainText(/Used by \d+ ideas:/);
  await expect(page.locator('[data-group-id="optimization"]')).toHaveAttribute('data-highlighted', 'true');
  await expect(page.locator('[data-node-id="gradient-descent"]')).toHaveCount(0); // its group stays collapsed
});

test('decision tree weakness links to random forest via fixed-by chip', async ({ page }) => {
  await gotoMap(page, '#/n/decision-tree');
  const section = page.getByRole('region', { name: 'Strengths and weaknesses' });
  await expect(section).toContainText('Fixed by');
  await section.locator('[data-testid="fixed-by-chip"][data-node-ref="random-forest"]').click();
  await expect(page).toHaveURL(/#\/n\/random-forest$/);
});

test('a concept node has no recipe and no strengths section', async ({ page }) => {
  await gotoMap(page, '#/n/overfitting');
  await expect(page.getByTestId('panel')).toBeVisible();
  await expect(page.getByTestId('recipe')).toHaveCount(0);
  await expect(page.getByText('Strengths and weaknesses')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Light up the recipe' })).toHaveCount(0);
});

test('section order is fixed', async ({ page }) => {
  await gotoMap(page, '#/n/ols');
  const headings = await page.getByTestId('panel').locator('h3').allTextContents();
  const at = (h: string) => headings.indexOf(h);
  expect(at('Recipe')).toBeGreaterThanOrEqual(0);
  expect(at('Recipe')).toBeLessThan(at('What you need first'));
  expect(at('What you need first')).toBeLessThan(at('Strengths and weaknesses'));
});
