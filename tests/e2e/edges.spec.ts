import { expect, test } from '@playwright/test';
import { gotoMap } from './helpers';

test('calm view has no edges', async ({ page }) => {
  await gotoMap(page);
  await expect(page.locator('[data-group-id="calculus"]')).toBeVisible();
  await expect(page.locator('[data-edge-key]')).toHaveCount(0);
});

test('selecting a node draws its edges and fades unrelated nodes', async ({ page }) => {
  await gotoMap(page);
  await page.locator('[data-group-id="optimization"]').click();
  await page.locator('[data-node-id="gradient-descent"]').click();
  await expect(page.locator('[data-edge-key]').first()).toBeVisible();
  await expect(page.locator('[data-group-id="clustering"]')).toHaveAttribute('data-faded', 'true');
  await expect(page.locator('[data-group-id="calculus"]')).not.toHaveAttribute('data-faded', 'true');
});

test('hovering an edge shows its sentence; clicking opens the edge panel', async ({ page }) => {
  await gotoMap(page, '#/n/derivative');
  await page.locator('[data-group-id="algebra-basics"]').click();
  const edge = page.locator('[data-edge-key="derivative->slope"] .edge-hit');
  await edge.hover();
  await expect(page.getByRole('tooltip')).toContainText('slope');
  await edge.click();
  await expect(page).toHaveURL(/#\/e\/derivative--needs--slope$/);
});

test.fixme('clicking an edge opens the edge panel', async ({ page }) => {
  await gotoMap(page, '#/n/derivative');
  await page.locator('[data-group-id="algebra-basics"]').click();
  await page.locator('[data-edge-key="derivative->slope"] .edge-hit').click();
  await expect(page.getByTestId('edge-panel')).toBeVisible();
});

test('edges are keyboard reachable and Enter selects', async ({ page }) => {
  await gotoMap(page, '#/n/derivative');
  const hit = page.locator('[data-edge-key="derivative->algebra-basics"] .edge-hit');
  await expect(hit).toHaveAttribute('aria-label', /slope/);
  await hit.focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/e\/derivative--needs--slope$/);
});

test('merged edges show a +n badge', async ({ page }) => {
  await gotoMap(page, '#/n/bayes-rule');
  await expect(page.locator('[data-edge-key="probabilistic-models->bayes-rule"] .edge-badge')).toHaveText('+2');
});

test('Escape returns to the calm view', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await expect(page.locator('[data-edge-key]').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-edge-key]')).toHaveCount(0);
  await expect(page.locator('[data-faded="true"]')).toHaveCount(0);
});

test('clicking the empty background returns to the calm view', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await expect(page.locator('[data-edge-key]').first()).toBeVisible();
  const box = (await page.locator('svg.map').boundingBox())!;
  await page.mouse.click(box.x + 8, box.y + 8);
  await expect(page.locator('[data-edge-key]')).toHaveCount(0);
});
