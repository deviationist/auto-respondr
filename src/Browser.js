import playwright from 'playwright';
import Cookies from './Cookies.js';

export class Browser {
    #userAgent;
    #browserLocale;
    browser;
    context;
    page;

    constructor({ userAgent, browserLocale }) {
        this.#userAgent = userAgent;
        this.#browserLocale = browserLocale;
    }

    static async init({ userAgent, browserLocale }) {
        const instance = new Browser({ userAgent, browserLocale });
        instance.browser = await playwright.chromium.launch({
            headless: false,
        });
        instance.context = await instance.browser.newContext({
            locale: this.browserLocale,
            userAgent: this.userAgent,
        });
        if (Cookies.has()) {
            instance.context.addCookies(Cookies.get());
        }       
        return instance;
    }

    async newPage() {
        this.page = await this.context.newPage();
        return this.page;
    }

}