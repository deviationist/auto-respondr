import playwright from 'playwright';

export class Browser {
    #userAgent;
    #browserLocale;
    user;
    browser;
    context;
    page;

    constructor({ userAgent, browserLocale, user }) {
        this.#userAgent = userAgent;
        this.#browserLocale = browserLocale;
        this.user = user;
    }

    static async init({ userAgent, browserLocale, user }) {
        const instance = new Browser({ userAgent, browserLocale, user });
        instance.browser = await playwright.chromium.launch({
            headless: false,
        });
        instance.context = await instance.browser.newContext({
            locale: this.browserLocale,
            userAgent: this.userAgent,
        });
        if (instance.user.hasCookies()) {
            instance.context.addCookies(instance.user.getCookies());
        }
        return instance;
    }

    async newPage() {
        this.page = await this.context.newPage();
        return this.page;
    }

}