import { test, expect } from '@playwright/test';
import { zostanWystawcaPage } from '../pages/zostanWystawcaPage';
import fs from 'fs';
import { pobierzMailaZGmaila } from '../gmail';
import 'dotenv/config';
import { adminForm } from '../pages/adminForm';
const sciezkaPliku = './jsons/strony.json';
const domeny = JSON.parse(fs.readFileSync(sciezkaPliku, 'utf-8'));
const mail = process.env.GMAIL_USER;
for (const domena of domeny) {
    test(`rejestracja wystawcy ${domena}`, async ({ page }) => {
        test.setTimeout(60000);
        const zostanWystawca = new zostanWystawcaPage(page);
        const docelowyUrl = `${domena}zostan-wystawca/`;
        await page.goto(docelowyUrl);
        await zostanWystawca.obsluzCookies();
        await zostanWystawca.wypelnijDane(mail, "+48321321321");
        await zostanWystawca.wyslijFormularz();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.ginput_container_email')).toBeHidden({ timeout: 30000 });
        const wiadomosc = pobierzMailaZGmaila(domena);
        expect(wiadomosc, 'Nie udało się pobrać wiadomości ze skrzynki Gmail').toBeDefined();

        console.log(`\n==================================================`);
        console.log(`ROZPOCZĘCIE CZYSZCZENIA`);
        console.log(`==================================================`);

        const urlAdmin = `${domena}admin/`;
        await page.goto(urlAdmin);
        await page.getByRole('textbox', { name: 'Nazwa użytkownika lub adres' }).fill(process.env.WP_LOGIN);
        await page.getByRole('textbox', { name: 'Hasło' }).fill(process.env.WP_PASSWORD);
        await page.getByRole('button', { name: 'Zaloguj się' }).click();

        const panelAdmina = new adminForm(page);

        for (const id of unikalneIdFormularzy) {
            console.log(`Czyszczenie zgłoszeń dla formularza ID: ${id}`);

            await page.goto(`${domena}wp-admin/admin.php?page=gf_entries&id=${id}`);
            await panelAdmina.szukajMaila(mail);
            await page.waitForLoadState('networkidle');
            await panelAdmina.usunMaila();

            await page.waitForLoadState('networkidle');
            await page.goto(`${domena}wp-admin/admin.php?page=gf_entries&view=entries&id=${id}&filter=trash`);
            await panelAdmina.szukajMaila(mail);
            await page.waitForLoadState('networkidle');
            await panelAdmina.usunZKosza();
        }
    });
}