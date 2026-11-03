import {test, expect} from '@playwright/test';
import {zostanWystawcaPage} from '../pages/zostanWystawcaPage';
import fs from 'fs';
const sciezkaPliku = './jsons/strony.json';
const domeny = JSON.parse(fs.readFileSync(sciezkaPliku, 'utf-8'));
for (const domena of domeny){
    test(`dzialajacy wyglad formularza zostan wystawca na ${domena}`, async ({page}) => {
        test.setTimeout(60000);
        const zostanWystawca = new zostanWystawcaPage(page);
        const docelowyUrl = `${domena}/zostan-wystawca/`;
        await page.goto(docelowyUrl);
        await zostanWystawca.obsluzCookies();
        await zostanWystawca.wypelnijDane("test@test.pl", "321321321");
        await zostanWystawca.wyslijFormularz();
        await expect(page).toHaveURL(/.*potwierdzenie-rejestracji-wystawcy/, {timeout:30000});
    });
    test(`niedzialajacy wyglad formularza zostan wystawca na ${domena}`, async ({page}) => {
        const zostanWystawca = new zostanWystawcaPage(page);
        const docelowyUrl = `${domena}/zostan-wystawca/`;
        await page.goto(docelowyUrl);
        await zostanWystawca.obsluzCookies();
        await zostanWystawca.wypelnijDane("test@test", "321321321");
        await zostanWystawca.wyslijFormularz();
        await expect(zostanWystawca.komunikatBlad).toBeVisible({timeout: 10000});
        await expect(page).not.toHaveURL(/.*potwierdzenie-rejestracji-wystawcy/);
    });
}