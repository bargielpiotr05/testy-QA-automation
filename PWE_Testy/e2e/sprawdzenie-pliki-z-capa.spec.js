import { expect, test } from "@playwright/test";
import fs from 'fs';
import path from 'path';

const sciezkaPliku = path.resolve(process.cwd(), 'jsons/fairs.json');
const daneJson = JSON.parse(fs.readFileSync(sciezkaPliku, 'utf-8'));

const grupy = ['gr3', 'gr2', 'gr1'];

for (const grupa of grupy) {
    const targiGrupy = Object.values(daneJson.fairs).filter((targ) => targ.fair_group === grupa);
    const raportBledow = [];

    test.describe(`${grupa} - Sprawdzenie duplikatów w menu`, () => {
        test.describe.configure({ mode: 'serial' });

        for (const targ of targiGrupy) {
            const domena = targ.fair_domain;

            test(`sprawdzenie oferty w menu dla ${domena}`, async ({ page }) => {
                test.setTimeout(300000);
                await page.goto(`https://${domena}`, { waitUntil: 'domcontentloaded' });

                try {
                    const cookieBtn = page.locator('.uc-accept-button');
                    await cookieBtn.waitFor({ state: 'visible', timeout: 6000 });
                    await cookieBtn.click({ force: true });
                    await cookieBtn.waitFor({ state: 'hidden', timeout: 3000 });
                } catch (e) {
                }
                const pozycjaMenu = page.locator(".pwe-menu-auto-switch__item", {
                    has: page.locator("a[href*='/dla-odwiedzajacych']")
                }).first();

                await pozycjaMenu.hover();

                const linkiGlownegoPodmenu = pozycjaMenu.locator("> ul.pwe-menu-auto-switch__submenu > li > a");
                const znalezionePlany = await linkiGlownegoPodmenu.filter({ hasText: /plan targ[oó]w\s+\d{4}/i }).allInnerTexts();
                const znalezioneRaporty = await linkiGlownegoPodmenu.filter({ hasText: /raport potargowy\s+\d{4}/i }).allInnerTexts();

                const pozycjaMenuWystawcow = page.locator(".pwe-menu-auto-switch__item", {
                    has: page.locator("a[href*='/dla-wystawcow']")
                }).first();

                await pozycjaMenuWystawcow.hover();

                const linkiWystawcowPodmenu = pozycjaMenuWystawcow.locator("> ul.pwe-menu-auto-switch__submenu > li > a");
                const znalezioneOferty = await linkiWystawcowPodmenu.filter({ hasText: /oferta targowa\s+\d{4}/i }).allInnerTexts();
                const problemyNaDomenie = [];
                if (znalezionePlany.length > 1) {
                    problemyNaDomenie.push(`Plan targów (${znalezionePlany.length} szt.): ${znalezionePlany.join(', ')}`);
                }
                if (znalezioneRaporty.length > 1) {
                    problemyNaDomenie.push(`Raport potargowy (${znalezioneRaporty.length} szt.): ${znalezioneRaporty.join(', ')}`);
                }
                if (znalezioneOferty.length > 1) {
                    problemyNaDomenie.push(`Oferta targowa (${znalezioneOferty.length} szt.): ${znalezioneOferty.join(', ')}`);
                }

                if (problemyNaDomenie.length > 0) {
                    raportBledow.push({
                        Domena: domena,
                        Problemy: problemyNaDomenie.join(' | ')
                    });
                }

                expect.soft(
                    znalezionePlany.length,
                    `[${domena}] Za dużo pozycji "Plan targów" (${znalezionePlany.length}): ${JSON.stringify(znalezionePlany)}`
                ).toBeLessThanOrEqual(1);

                expect.soft(
                    znalezioneRaporty.length,
                    `[${domena}] Za dużo pozycji "Raport potargowy" (${znalezioneRaporty.length}): ${JSON.stringify(znalezioneRaporty)}`
                ).toBeLessThanOrEqual(1);

                expect.soft(
                    znalezioneOferty.length,
                    `[${domena}] Za dużo pozycji "Oferta targowa" (${znalezioneOferty.length}): ${JSON.stringify(znalezioneOferty)}`
                ).toBeLessThanOrEqual(1);
            });
        }

        test.afterAll(() => {
            console.log(`RAPORT KOŃCOWY - DUPLIKATY W MENU (${grupa.toUpperCase()})`);

            if (raportBledow.length === 0) {
                console.log('✅ Wszystko OK! Na żadnej domenie nie ma duplikatów (wszędzie max 1 szt.).');
            } else {
                console.log(`❌ Znaleziono problemy na ${raportBledow.length} domenach:\n`);
                console.table(raportBledow);
            }
        });
    });
}