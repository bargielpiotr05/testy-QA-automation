import { test, expect } from '@playwright/test';
import { RejestracjaPlatynaPage } from '../pages/RejestracjaPlatynaPage.js';
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
        
        const docelowyUrl = domena.endsWith('/') 
            ? `${domena}rejestracja/?utm_source=platyna` 
            : `${domena}/rejestracja/?utm_source=platyna`;
            
        const rejestracjaPage = new RejestracjaPlatynaPage(page);
        
        await page.goto(docelowyUrl);
        await rejestracjaPage.obsluzCookies();
        idFormularza = await page.locator('.gform_wrapper form').getAttribute('data-formid');
        await page.waitForTimeout(2000);
        await rejestracjaPage.wypelnijDane(testowyEmail, '+48123123123');
        await rejestracjaPage.wyslijFormularz();
        await expect(page.locator('.ginput_container_email')).toBeHidden({ timeout: 30000 });
        expect(idFormularza).toBeDefined();

        console.log('Oczekiwanie na pobranie maila...');
        const wiadomosc = await pobierzMailaZGmaila(domena);

        expect(wiadomosc, 'Nie udało się pobrać wiadomości ze skrzynki Gmail').toBeDefined();
        expect(wiadomosc.attachments, 'Mail nie posiada załączników').toBeDefined();
        expect(wiadomosc.attachments.length, 'Brak załączników w mailu').toBeGreaterThan(0);

        const zalacznikQR = wiadomosc.attachments.find(plik => plik.filename.includes('qrcode'));
        expect(zalacznikQR, 'Wśród załączników brakuje pliku z kodem QR').toBeDefined();

        const nazwaPlikuQR = zalacznikQR.filename;
        const qrUnikalneId = nazwaPlikuQR.replace('qrcode_', '').replace('.png', '');
        
        const dopasowanieHtml = wiadomosc.html.match(/alt="QR code ([a-zA-Z0-9]+)/) || wiadomosc.html.match(/value=([a-zA-Z0-9]+)/);
        const idZhtml = dopasowanieHtml ? dopasowanieHtml[1] : 'NIE_ZNALEZIONO_W_HTML';
        
        const pakietVip = wiadomosc.html.match(/vip-benefits\.png/) || wiadomosc.html.match(/vip-benefits-en\.png/) || wiadomosc.html.match(/pakietVip\.png/) || wiadomosc.html.match(/pakietVip_en\.png/);

        console.log('--- WYNIKI WERYFIKACJI MAILA ---');

        if (qrUnikalneId === idZhtml) {
            console.log(`✅ Kody QR są takie same (ID: ${qrUnikalneId})`);
        } else {
            console.log("❌ Kody QR się rozjeżdżają!");
            console.log(`   Załącznik: qrcode_${qrUnikalneId}.png`);
            console.log(`   HTML: qrcode_${idZhtml}.png`);
        }
        // POPRAWKA: Dodano .soft
        expect.soft(qrUnikalneId, 'Rozjazd kodów QR między załącznikiem a HTML').toEqual(idZhtml);

        if (pakietVip) {
            console.log(`✅ Zdjęcie pakietu VIP jest obecne w kodzie HTML (${pakietVip[0]})`);
        } else {
            console.log("❌ Brakuje zdjęcia pakietu VIP w kodzie HTML maila!");
        }
        expect.soft(pakietVip, 'Brak grafiki pakietu VIP w mailu').toBeTruthy();

        expect.soft(wiadomosc.html, `Kod HTML nie zawiera wygenerowanego obrazka dla ID ${qrUnikalneId}`).toContain(qrUnikalneId);

        console.log('--- ROZPOCZĘCIE CZYSZCZENIA ---');
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
        
        console.log('✅ Zakończono czyszczenie formularza.');
    });
}