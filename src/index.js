import * as dotenv from 'dotenv';
import { setIntervalAsync } from 'set-interval-async';
import { Browser } from './Browser.js';
import AuthHandler from './Handlers/AuthHandler.js';
import ConversationsListHandler from './Handlers/ConversationsListHandler.js';
import ConversationHandler from './Handlers/ConversationHandler.js';
import { Message } from './Message.js';
import { delay } from './Helpers.js';
dotenv.config();

let browser;

async function start() {

    browser = await Browser.init({
        userAgent: process.env.BROWSER_USER_AGENT,
        browserLocale: process.env.BROWSER_LOCALE
    });
    const tab = await browser.newPage();
    
    const ah = new AuthHandler(tab);
    await ah.goToLogin();
    await ah.ensureCookiesAreAccepted();
    await ah.ensureLoggedIn();

    const clh = new ConversationsListHandler(tab);
    setIntervalAsync(async () => {
        await clh.lookForUnreadMessages(async (conversation) => {
            const tab = await browser.newPage();
            const ch = new ConversationHandler(tab, conversation);
            const message = Message.generate(conversation);
            await ch.goToConversation();
            await ch.sendMessage(message);
            await delay(1000);
            await tab.close();
        });
    }, parseInt(process.env.UPDATE_POLL_IN_MS));
}
start();

process.on('SIGINT', () => {
    process.exit(0);
});