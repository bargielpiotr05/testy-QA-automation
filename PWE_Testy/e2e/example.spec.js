// @ts-check
import { test, expect } from '@playwright/test';

test('Fatal error', async ({ page }) => {
  await page.goto('https://warsawexpo.eu/');
  const bodyText = await page.locator('body').innerText();

  expect(bodyText).not.toContain("Fatal error");
  expect(bodyText).not.toContain("Parse error");
  const tekst = await page.locator('div').filter({ hasText: /^Jedyne takiemiejsce w Polsce$/ }).first()
  await expect(tekst).toHaveText("Jedyne takiemiejsce w Polsce");
});

