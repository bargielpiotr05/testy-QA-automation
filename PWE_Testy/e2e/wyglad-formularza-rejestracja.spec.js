import { test, expect } from '@playwright/test';
import { RejestracjaPage } from '../pages/RejestracjaPage';
import fs from 'fs';

const sciezkaPliku = './jsons/strony.json';
const domeny = JSON.parse(fs.readFileSync(sciezkaPliku, 'utf-8'));

for (const domena of domeny) {
    test(`wyglad formularza na ${domena}`, async ({ page }) => {
        const rejestracjaPage = new RejestracjaPage(page);
        const docelowyUrl = `${domena}rejestracja/`;

        await rejestracjaPage.otworz(docelowyUrl);
        await rejestracjaPage.obsluzCookies();

        const wygladFormularza = page.locator('.pwe-registration-visitors__form-container');

        const pasekGorny = page.locator('.pwe-registration-visitors__form-badge-header');
        const przyciskRejestracji = page.locator('.gform_footer .gform_button');

        try {
            await expect(wygladFormularza).toHaveScreenshot('wzorzec.png', {
                mask: [pasekGorny, przyciskRejestracji],
                maxDiffPixelRatio: 0.1
            });
            console.log(`✅ Wygląd pasuje do wzorca 1: ${domena}`);
        } catch (error1) {
            try {
                await expect(wygladFormularza).toHaveScreenshot('wzorzec2.png', {
                    mask: [pasekGorny, przyciskRejestracji],
                    maxDiffPixelRatio: 0.1
                });
                console.log(`✅ Wygląd pasuje do wzorca 2: ${domena}`);
            } catch (error2) {
                console.log(`❌ Wygląd nie pasuje do żadnego z dwóch wzorców: ${domena}`);
                throw error2;
            }
        }
    });
}