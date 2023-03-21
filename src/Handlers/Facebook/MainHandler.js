import FbAuthHandler from './AuthHandler.js';
import FbConversationsListHandler from './ConversationsListHandler.js';
import FbConversationHandler from './ConversationHandler.js';
import ConversationLog from '../../Model/ConversationLog.js';
import Config from '../../Model/Config.js';
import Message from '../../Message.js';
import { Browser } from '../../Browser.js';
import { delay, useDb } from '../../Helpers.js';
import { setIntervalAsync } from 'set-interval-async';

export default class MainHandler {
    static pollIntervalInMs = 10000;
    browser;
    user;
    constructor(user) {
        this.user = user;
        this.start();
    }

    async start() {
        this.browser = await Browser.init({
            userAgent: Config.get('browser.userAgent'),
            browserLocale: Config.get('browser.locale'),
            user: this.user,
        });
        const tab = await this.browser.newPage();
        
        const ah = new FbAuthHandler(tab, this.user);
        await ah.goToLogin();
        await ah.ensureCookiesAreAccepted();
        await ah.ensureLoggedIn();


        const clh = new FbConversationsListHandler(tab, this.user);
        await clh.goToConversations();
        setIntervalAsync(async () => {
            await clh.lookForUnreadMessages(async (conversation) => {
                const tab = await this.browser.newPage();
                const ch = new FbConversationHandler(tab, conversation);
                const message = Message.generate(conversation, this.user);
                await ch.goToConversation();
                await ch.sendMessage(message);
                if (useDb()) {
                    ConversationLog.logReply(this.user.id, conversation.id);
                }
                await delay(1000);
                await tab.close();
            });
        }, MainHandler.pollIntervalInMs);
    }
}