import {test, expect} from '@playwright/test';
import {zostanWystawcaPage} from '../pages/zostanWystawcaPage';
import fs from 'fs';
const sciezkaPliku = './jsons/strony.json';
const domeny = JSON.parse(fs.readFileSync(sciezkaPliku, 'utf-8'));
for (const domena of domeny){
    test(`wyglad formularza na ${domena}`, async ({ page }) => {
        const zostanWystawca = new zostanWystawcaPage(page);
        const docelowyUrl = `${domena}/zostan-wystawca/`;
        await zostanWystawca.page.goto(docelowyUrl);
        await zostanWystawca.przyciskZezwol.click();
        const wygladFormularza = page.locator('.pwe-registration-exhibitors__form');
        await expect(wygladFormularza).toHaveScreenshot('wyglad-formularza.png');
    });
}