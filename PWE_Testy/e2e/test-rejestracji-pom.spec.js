import { test, expect } from '@playwright/test';
import { RejestracjaPage } from '../pages/RejestracjaPage';
import fs from 'fs';

const sciezkaPliku = './jsons/strony.json';
const domeny = JSON.parse(fs.readFileSync(sciezkaPliku, 'utf-8'));

for (const domena of domeny) {
    test(`rejestracja test POM ${domena}`, async ({ page }) => {
        test.setTimeout(60000);
        const rejestracjaPage = new RejestracjaPage(page);
        const docelowyUrl = `${domena}rejestracja/`;
        await rejestracjaPage.otworz(docelowyUrl);
        await rejestracjaPage.obsluzCookies();
        await rejestracjaPage.wypelnijDane("test@test", "321321321");
        await rejestracjaPage.wyslijFormularz();
        await expect(page).toHaveURL(/.*krok2/, {timeout:30000});
    });
    test(`test blednego maila na ${domena}`, async ({ page }) => {
        const rejestracjaPage = new RejestracjaPage(page);
        const docelowyUrl = `${domena}/rejestracja/`;
        await rejestracjaPage.otworz(docelowyUrl);
        await rejestracjaPage.obsluzCookies();
        await rejestracjaPage.wypelnijDane("test@test", "321321321");
        await rejestracjaPage.wyslijFormularz();
        await expect(rejestracjaPage.komunikatBlad).toBeVisible({timeout: 10000});
        await expect(page).not.toHaveURL(/.*krok2/);
    });
}