import { test, expect } from '@playwright/test';
import fs from 'fs';
import { RejestracjaPage } from '../pages/RejestracjaPage';
import { adminForm } from '../pages/adminForm';
import 'dotenv/config';
import { pobierzMailaZGmaila } from '../gmail.js';

const sciezkaPliku = './jsons/strony.json';
const domeny = JSON.parse(fs.readFileSync(sciezkaPliku, 'utf-8'));
const mail = process.env.GMAIL_USER;

for (const domena of domeny) {
    test(`test rejestracji multilang ${domena}`, async ({ page }) => {
        test.setTimeout(3000000);
        const unikalneIdFormularzy = [];
        const docelowyURL = `${domena}rejestracja/`;
        await page.goto(docelowyURL);

        const rejestracjaPage = new RejestracjaPage(page);
        await rejestracjaPage.obsluzCookies();

        const languageList = page.getByText('PL', { exact: true });
        await languageList.hover();

        const linkiJezykowe = page.locator('.pwe-menu-auto-switch__lang-dropdown a');
        const liczbaJezykow = await linkiJezykowe.count();
        console.log(`jest ${liczbaJezykow} jezykow`);

        const adresyUrl = [page.url()];
        for (let i = 0; i < liczbaJezykow; i++) {
            const href = await linkiJezykowe.nth(i).getAttribute('href');
            if (href) {
                adresyUrl.push(href);
            }
        }
        
        const podsumowanieQR = [];
        for (const url of adresyUrl) {
            console.log(`test wersji jezykowej: ${url}`);
            await page.goto(url);
            const aktualneId = await page.locator('.gform_wrapper form').getAttribute('data-formid');
            if (aktualneId && !unikalneIdFormularzy.includes(aktualneId)) {
                unikalneIdFormularzy.push(aktualneId);
                console.log(`Dodano nowe ID formularza do listy: ${aktualneId}`);
            }
            await page.waitForTimeout(2000);
            await rejestracjaPage.wypelnijDane(mail, '+48123123123');
            await rejestracjaPage.wyslijFormularz({ force: true });
            await page.waitForTimeout(6000);
            await expect(page.locator('.ginput_container_email')).toBeHidden({ timeout: 30000 });
            
            const wiadomosc = await pobierzMailaZGmaila(domena);
            
            let czyZgodne = false;
            let brakMaila = 'mail dotarł';
            let idZalacznika = "BRAK_W_ZALACZNIKU";
            let idZHtml = "BRAK_W_HTML";
            let headerMaila = '✅ HEADER PRAWIDŁOWY';
            
            if (!wiadomosc) {
                brakMaila = 'mail nie dotarł';
            } else {
                if (wiadomosc && wiadomosc.attachments) {
                    const zalacznikQR = wiadomosc.attachments.find(plik => plik.filename.includes('qrcode'));
                    const headerMailaHtml = wiadomosc.html.match(/header\.jpg/) || wiadomosc.html.match(/header_en\.jpg/); 
                    expect.soft(wiadomosc.html, "wiadomosc nie zawiera sladów po shortcode").not.toContain('{');
                    expect.soft(wiadomosc.html, "wiadomosc nie zawiera sladów po shortcode").not.toContain('[');
                    if (zalacznikQR) {
                        idZalacznika = zalacznikQR.filename.replace('qrcode_', '').replace('.png', '');
                        const dopasowanieHtml = wiadomosc.html.match(/alt="QR code ([a-zA-Z0-9]+)/) || wiadomosc.html.match(/value=([a-zA-Z0-9]+)/);
                        idZHtml = dopasowanieHtml ? dopasowanieHtml[1] : "NIE_ZNALEZIONO_PLIKU";
                        czyZgodne = (idZalacznika === idZHtml);
                    }
                    if(!headerMailaHtml){
                        console.log('❌ BRAK HEADERA');
                        headerMaila = '❌ BRAK HEADERA';
                    }
                }
            }
            podsumowanieQR.push({
                jezyk: url,
                sukces: czyZgodne,
                brakMaila: brakMaila,
                zalacznik: idZalacznika,
                html: idZHtml,
                headerMaila: headerMaila
            });
        }

        const urlAdmin = `${domena}admin/`;
        await page.goto(urlAdmin);
        await page.getByRole('textbox', { name: 'Nazwa użytkownika lub adres' }).fill(process.env.WP_LOGIN);
        await page.getByRole('textbox', { name: 'Hasło' }).fill(process.env.WP_PASSWORD);
        await page.getByRole('button', { name: 'Zaloguj się' }).click();

        const panelAdmina = new adminForm(page);

        for (const id of unikalneIdFormularzy) {
            console.log(`Rozpoczynam czyszczenie zgłoszeń dla formularza ID: ${id}`);

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
        console.log("----------------------PODSUMOWANIE MAILI-------------------------------");
        let wszystkieOk = true;

        for (const wynik of podsumowanieQR) {
            if (wynik.brakMaila === 'mail nie dotarł') {
                console.log(`❌ BRAK MAILA : ${wynik.jezyk}`);
                wszystkieOk = false;
            } 
            else {
                if (wynik.sukces && wynik.headerMaila === '✅ HEADER PRAWIDŁOWY') {
                    console.log(`✅ Prawidłowo : ${wynik.jezyk}`);
                } 
                else {
                    console.log(`❌ BŁĄD W MAILU : ${wynik.jezyk}`);
                    wszystkieOk = false;
                    
                    if (!wynik.sukces) {
                        console.log(`   -> Rozjazd QR: w załączniku qrcode_${wynik.zalacznik}.png | w HTML qrcode_${wynik.html}.png`);
                    }
                    if (wynik.headerMaila !== '✅ HEADER PRAWIDŁOWY') {
                        console.log(`   -> ${wynik.headerMaila}`);
                    }
                }
            }
        }
        expect(wszystkieOk, 'Wykryto błędy (brak maila, rozjazd kodów QR lub brak headera). Sprawdź podsumowanie w konsoli.').toBeTruthy();
    });
}