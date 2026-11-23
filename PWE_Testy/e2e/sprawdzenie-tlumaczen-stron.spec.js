import { test, expect } from '@playwright/test';
import fs from 'fs';

const domeny = JSON.parse(fs.readFileSync('./jsons/strony.json', 'utf-8'));
const tlumaczenia = JSON.parse(fs.readFileSync('./jsons/website-translation.json', 'utf-8'));

const wszystkieKodyJezykow = Object.keys(tlumaczenia.home);
const sekcjeDoSprawdzenia = Object.keys(tlumaczenia); 

for (const domena of domeny) {
    test(`Skanowanie tłumaczeń: ${domena}`, async ({ page }) => {
        
        test.setTimeout(3000000); 
        const czystaDomena = domena.endsWith('/') ? domena.slice(0, -1) : domena;
        
        console.log(`Odczytanie dostępnych języków na ${czystaDomena}`);
        await page.goto(`${czystaDomena}/`);
        
        const aktywneJezyki = [];
        aktywneJezyki.push('pl');
        const linkiWMenu = await page.locator('.pwe-menu-auto-switch__lang-dropdown a').evaluateAll(linki => 
            linki.map(link => link.getAttribute('href') || '')
        );
        for (const kod of wszystkieKodyJezykow) {
            if (kod === 'pl') continue; 
    
            const jestWMenu = linkiWMenu.some(href => href.includes(`/${kod}/`));
            if (jestWMenu) {
                aktywneJezyki.push(kod);
            }
        }
        console.log(`Wykryto w menu języki: ${aktywneJezyki.join(', ')}`);

        for (const kodJezyka of aktywneJezyki) {
            await test.step(`Weryfikacja języka: [${kodJezyka.toUpperCase()}]`, async () => {
                
                let poprawneStrony = 0;
                let bledneStrony = 0;

                for (const sekcja of sekcjeDoSprawdzenia) {
                    if (sekcja === 'home') continue; 
                    if (!tlumaczenia[sekcja][kodJezyka]) continue;
                    const sciezkaZJsona = tlumaczenia[sekcja][kodJezyka].url;
                    const pelnyUrl = kodJezyka === 'pl' ? `${czystaDomena}${sciezkaZJsona}` : `${czystaDomena}/${kodJezyka}${sciezkaZJsona}`;
                    const tekstNaStronie = await page.locator('body').innerText().catch(() => '');
                    const czyBlad404 = tekstNaStronie.includes('404');
                    if (czyBlad404) {
                        console.log(`❌ Błąd (404) - [${sekcja}]: ${pelnyUrl}`);
                        bledneStrony++;
                    } else {
                        poprawneStrony++;
                    }
                    expect.soft(czyBlad404, `Jest strona: ${pelnyUrl}`).toBe(false);
                }
                console.log(`Wynik dla [${kodJezyka}]: Poprawne: ${poprawneStrony} | Błędne (404): ${bledneStrony}`);
            });
        }
    });
}