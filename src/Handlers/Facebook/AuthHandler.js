import Url from './Url.js';
import Shared from '../Shared.js';
import { naturalDelay } from '../../Helpers.js';

export default class AuthHandler extends Shared {
    user;
    constructor(page, user) {
        super(page);
        this.user = user;
    }
    
    async goToLogin() {
        await this.page.goto(Url.loginUrl(), { waitUntil: 'networkidle' });
    }

    async ensureCookiesAreAccepted() {
        const text = 'Only allow essential cookies';
        if (await this.page.isVisible(`text="${text}"`)) {
            await this.page.getByText(text).click();
        }
    }

    async ensureLoggedIn() {
        if (await this.isLoggedIn()) {
            return;
        } else {
            await this.page.type('input[name="email"]', this.user.username);
            await naturalDelay();
            await this.page.type('input[name="pass"]', this.user.password);
            await naturalDelay();
            await this.page.getByText('Keep me signed in').click();
            await naturalDelay();
            await this.page.click('button[name="login"]');
        }
        if (!await this.isLoggedIn()) {
            throw new Error('Login failed!');
        } else {
            await this.user.setCookies(await this.page.context().cookies())
        }
    }
    
    isLoggedIn() {
        return Promise.any([
            this.page.getByRole('button', { name: 'Log In' }).waitFor().then(() => false),
            this.page.getByText('Chats', { exact: true }).waitFor().then(() => true),
        ]).catch(() => {
            throw 'Missing button';
        });
    }
}