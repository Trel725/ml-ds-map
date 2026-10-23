import type { Page } from '@playwright/test';

/** Opens the map as a returning visitor (skips the first-visit layers screen). */
export async function gotoMap(page: Page, hash = ''): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('mlmap.visited', '1');
    } catch {
      // storage blocked: the app still works
    }
  });
  await page.goto(`/${hash}`);
}
