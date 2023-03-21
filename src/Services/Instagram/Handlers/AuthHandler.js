import Url from '../Url.js';
import Shared from '../../Shared.js';
import { naturalDelay } from '../../../Helpers.js';

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

    async ensureDiscardNotifications() {
        const text = 'Not Now';
        if (await this.page.isVisible(`text="${text}"`)) {
            await this.page.getByRole('button', { name: text }).click();
        }
    }

    async ensureLoggedIn() {
        if (await this.isLoggedIn()) {
            return;
        } else {
            await this.page.type('input[name="username"]', this.user.username);
            await naturalDelay();
            await this.page.type('input[name="password"]', this.user.password);
            await naturalDelay();
            await this.page.getByText('Log in', { exact: true }).click();
        }
        if (!await this.wasLoggedIn()) {
            throw new Error('Login failed!');
        } else {
            await this.user.setCookies(await this.page.context().cookies())
        }
    }

    isLoggedIn() {
        return Promise.any([
            this.page.getByText('Log in', { exact: true }).waitFor({}).then(() => false),
            this.page.getByText('Profile', { exact: true }).waitFor().then(() => true),
        ]).catch(() => {
            throw 'Missing button';
        });
    }

    wasLoggedIn() {
        return Promise.any([
            this.page.getByRole('alert').waitFor({}).then(() => false),
            this.page.waitForNavigation().then(() => true),
        ]).catch(() => {
            throw 'Missing button';
        });
    }
}