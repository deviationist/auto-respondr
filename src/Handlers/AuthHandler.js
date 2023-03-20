import Url from '../Url.js';
import Shared from './Shared.js';
import Cookies from '../Cookies.js';

export default class AuthHandler extends Shared {
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
            //if (debug) console.log('Already logged in!');
            return;
        } else {
            await this.page.type('input[name="email"]', process.env.FACEBOOK_EMAIL);
            await this.page.type('input[name="pass"]', process.env.FACEBOOK_PASSWORD);
            await this.page.getByText('Keep me signed in').click();
            await this.page.click('button[name="login"]');
        }
        if (!await this.isLoggedIn()) {
            throw new Error('Login failed!');
        } else {
            //if (debug) console.log('We logged in successfully!');
            Cookies.store(await this.page.context().cookies());
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