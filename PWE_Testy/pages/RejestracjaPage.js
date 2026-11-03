export class RejestracjaPage {
    /**
    *@param { import('@playwright/test').Page } page
    */
    constructor(page) {
        this.page = page;
        this.przyciskZezwol = page.locator('.uc-accept-button');
        this.poleEmail = page.getByRole('textbox', { name: 'Adres email' });
        this.poleTelefon = page.getByRole('textbox', { name: 'Numer telefonu' });
        this.poleCheckboxZgoda = page.getByRole('checkbox', { name: 'Wyrażam zgodę na' });
        this.przyciskZarejestruj = page.getByRole('button', { name: 'Zarejestruj się' });
        this.komunikatBlad = page.locator('.validation_message').first();
    }
    async otworz(url) {
        await this.page.goto(url);
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
        await this.poleCheckboxZgoda.check();
    }
    async wyslijFormularz() {
        await this.przyciskZarejestruj.click({ force: true });
    }
}