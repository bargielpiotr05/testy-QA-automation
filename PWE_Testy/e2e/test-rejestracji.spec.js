import { test, expect } from '@playwright/test';
import { RejestracjaPage } from '../pages/RejestracjaPage';

const strony = [
    'https://test.dualuseexpo.com/rejestracja/'
];

for (const url of strony) {
    test(`rejestracja test ${url}`, async ({ page }) => {
        test.setTimeout(100000);
        await page.goto(url);
        const przyciskZezwol = page.getByRole('button', { name: 'Zezwól' });
        try{
            await przyciskZezwol.waitFor({state: 'visible', timeout: 10000})
            await przyciskZezwol.click(); 
            await expect(przyciskZezwol).toBeHidden();
            console.log(`kliknięto zgody na ${url}`);
        }catch (error){
            console.log(`brak przycisku na cookies na ${url}`);
        }
        await page.pause();
        await page.getByRole('textbox', { name: 'Adres email' }).fill("test@test.pl");
        await page.getByRole('textbox', { name: 'Numer telefonu' }).fill("123123123");
        await page.getByRole('checkbox', { name: 'Wyrażam zgodę na' }).check();
        await page.locator(".gform_button").click({force: true});
        await expect(page).toHaveURL(/.*krok2/, { timeout: 30000 });
    });
}