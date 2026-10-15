import { test, expect } from '@playwright/test';

test('responsive rendering and product interactions', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const failedRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failedRequests.push(request.url()));
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Money clarity.');
  await expect(page.locator('.hero-sculpture')).toBeVisible();
  expect(await page.locator('.hero-sculpture').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('hero.png'), animations: 'disabled' });
  await page.screenshot({ path: testInfo.outputPath('full-page.png'), fullPage: true, animations: 'disabled' });

  if ((page.viewportSize()?.width ?? 0) < 700) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('button', { name: 'Close navigation' })).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'The experience' }).click();
    await expect(page.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false');
  }

  await page.getByRole('button', { name: 'New headphones' }).click();
  await expect(page.locator('.balance-value')).toHaveText('₦7,000.00');
  await expect(page.locator('.allocation-total strong')).toHaveText('₦220,000');
  await page.getByRole('button', { name: 'Commitments', exact: true }).click();
  await expect(page.locator('.commitment-row')).toHaveCount(3);
  await page.getByRole('button', { name: 'My goals', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  await page.getByRole('button', { name: 'Dinner with friends' }).click();
  await expect(page.locator('.balance-value')).toHaveText('₦54,000.00');
  await page.locator('.dashboard').screenshot({ path: testInfo.outputPath('dashboard.png'), animations: 'disabled' });

  await page.getByRole('button', { name: 'My next goal' }).click();
  await expect(page.locator('.chat-answer')).toContainText('₦240,000 of a ₦400,000');
  await page.locator('summary').filter({ hasText: 'Can I connect my bank account yet?' }).click();
  await expect(page.locator('details[open]')).toContainText('Not in this preview.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test('native dialog traps focus, closes on Escape and returns focus', async ({ page }) => {
  await page.goto('/');
  const launcher = page.locator('.header-cta');
  await launcher.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  for (let index = 0; index < 5; index += 1) {
    expect(await page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(launcher).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.hero-sculpture').evaluate(el => parseFloat(getComputedStyle(el).animationDuration))).toBeLessThanOrEqual(0.00001);
});
