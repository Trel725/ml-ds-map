import { expect, test } from '@playwright/test';
import { gotoMap } from './helpers';
test('app shell renders', async ({ page }) => {
  await gotoMap(page);
  await expect(page).toHaveTitle('ML Concept Map');
  await expect(page.getByRole('heading', { name: 'ML Concept Map' })).toBeVisible();
});
