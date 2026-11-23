import { test, expect } from '@playwright/test';
import { RejestracjaPage } from '../pages/RejestracjaPage.js';
import { adminForm } from '../pages/adminForm.js';
import fs from 'fs';
import 'dotenv/config';
import { pobierzMailaZGmaila } from '../gmail.js';

const sciezkaPliku = './jsons/strony.json';
const domeny = JSON.parse(fs.readFileSync(sciezkaPliku, 'utf-8'));

for (const domena of domeny) {
    test(`test rejestracji pl dla ${domena}`, async ({ page }) => {
        test.setTimeout(120000);
        const testowyEmail = process.env.GMAIL_USER;
        let idFormularza;
        const docelowyUrl = `${domena}rejestracja/`;
        const rejestracjaPage = new RejestracjaPage(page);

        await page.goto(docelowyUrl);
        await rejestracjaPage.obsluzCookies();
        idFormularza = await page.locator('.gform_wrapper form').getAttribute('data-formid');

        await rejestracjaPage.wypelnijDane(testowyEmail, '+48123123123');
        await rejestracjaPage.wyslijFormularz();
        await expect(page.locator('.ginput_container_email')).toBeHidden({ timeout: 30000 });
        expect(idFormularza).toBeDefined();

        const wiadomosc = await pobierzMailaZGmaila(domena);

        expect(wiadomosc, 'Nie udało się pobrać wiadomości ze skrzynki Gmail').toBeDefined();
        expect(wiadomosc.attachments, 'Mail nie posiada załączników').toBeDefined();
        expect(wiadomosc.attachments.length, 'Brak załączników w mailu').toBeGreaterThan(0);

        const zalacznikQR = wiadomosc.attachments.find(plik => plik.filename.includes('qrcode'));
        expect(zalacznikQR, 'Wśród załączników brakuje pliku z kodem QR').toBeDefined();

        const nazwaPlikuQR = zalacznikQR.filename;
        const qrUnikalneId = nazwaPlikuQR.replace('qrcode_', '').replace('.png', '');
        const dopasowanieHtml = wiadomosc.html.match(/alt="QR code ([a-zA-Z0-9]+)"/);
        const idZhtml = dopasowanieHtml ? dopasowanieHtml[1] : 'NIE_ZNALEZIONO_W_HTML';

        expect.soft(wiadomosc.html, "wiadomosc zawiera slady po shortcode").not.toContain('{');
        expect.soft(wiadomosc.html, "wiadomosc zawiera slady po shortcode").not.toContain('[');

        if (qrUnikalneId === idZhtml) {
            console.log("✅ Kody qr sa takie same");
        } else {
            console.error("kody qr sie rozjezdzaja");
            console.error(`zalacznik: qrcode_${qrUnikalneId}.png`);
            console.error(`html: qrcode_${idZhtml}.png`);
        }

        expect(wiadomosc.html, `Kod HTML nie zawiera wygenerowanego obrazka dla ID ${qrUnikalneId}`).toContain(qrUnikalneId);

        const panelAdmina = new adminForm(page);

        const urlAdmin = `${domena}admin/`;
        await page.goto(urlAdmin);
        await page.getByRole('textbox', { name: 'Nazwa użytkownika lub adres' }).fill(process.env.WP_LOGIN);
        await page.getByRole('textbox', { name: 'Hasło' }).fill(process.env.WP_PASSWORD);
        await page.getByRole('button', { name: 'Zaloguj się' }).click();

        await page.goto(`${domena}wp-admin/admin.php?page=gf_entries&id=${idFormularza}`);

        await panelAdmina.szukajMaila(testowyEmail);
        await page.waitForLoadState('networkidle');
        await panelAdmina.usunMaila();

        await page.waitForLoadState('networkidle');
        await page.goto(`${domena}wp-admin/admin.php?page=gf_entries&view=entries&id=${idFormularza}&filter=trash`);
        await panelAdmina.szukajMaila(testowyEmail);
        await page.waitForLoadState('networkidle');
        await panelAdmina.usunZKosza();

    });
}