import {test, expect} from '@playwright/test';
import { RejestracjaPage } from '../pages/RejestracjaPage';
import fs from 'fs';
const sciezkaPliku = './jsons/strony.json';
const domeny = JSON.parse(fs.readFileSync(sciezkaPliku, 'utf-8'));
for (const domena of domeny){
    test(`wyglad formularza na ${domena}`, async ({ page }) => {
        const rejestracjaPage = new RejestracjaPage(page);
        const docelowyUrl = `${domena}/rejestracja/`;
        await rejestracjaPage.otworz(docelowyUrl);
        await rejestracjaPage.obsluzCookies();
        const wygladFormularza = page.locator('.pwe-registration-visitors__form-container');
        await expect(wygladFormularza).toHaveScreenshot('wyglad-formularza.png');
    });
}
