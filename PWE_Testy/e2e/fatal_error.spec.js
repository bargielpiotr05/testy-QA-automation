// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'fs';
const sciezkaPliku = './jsons/fairs.json';
const daneTargow = JSON.parse(fs.readFileSync(sciezkaPliku, 'utf-8'));
const domeny = Object.keys(daneTargow.fairs);


for (const domena of domeny) {
    test(`Fatal error on ${domena}`, async ({ page }) => {
    await page.goto(`https://${domena}`);
    await expect(page.locator("#error-page")).toHaveCount(0);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain("w witrynie wystąpił błąd krytyczny");
    expect(bodyText).not.toContain("Fatal error");
    expect(bodyText).not.toContain("Parse error");
  });
}