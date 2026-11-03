export class zostanWystawcaPage {
    /**
    *@param { import('@playwright/test').Page } page
    */
    constructor(page) {
        this.page = page;
        this.przyciskZezwol = page.locator('.uc-accept-button');
        this.poleEmail = page.getByRole('textbox', { name: 'Adres email' });
        this.poleTelefon = page.getByRole('textbox', { name: 'Numer telefonu' });
        this.poleCheckboxZgoda1 = page.locator('#field_276_11 label').filter({ hasText: 'Wyrażam zgodę na' });
        this.poleCheckboxZgoda2 = page.locator('#field_276_12 label').filter({ hasText: 'Wyrażam zgodę na' });
        this.przyciskZarejestruj = page.getByRole('button', { name: 'Wyślij' });
        this.komunikatBlad = page.locator('.validation_message').first();
    }
    async obsluzCookies() {
        try {
            await this.przyciskZezwol.waitFor({ state: 'visible', timeout: 3000 });
            await this.przyciskZezwol.click();
            await this.przyciskZezwol.waitFor({ state: 'hidden', timeout: 3000 });
            console.log(`cookies jest`);
        } catch (error) {
            console.log(`brak cookies`);
        }
    }
    async wypelnijDane(email, telefon) {
        await this.poleEmail.fill(email);
        await this.poleTelefon.fill(telefon);
        await this.poleCheckboxZgoda1.check();
        await this.poleCheckboxZgoda2.check();
    }

    async wyslijFormularz() {
        await this.przyciskZarejestruj.click({ force: true });
    }
}
