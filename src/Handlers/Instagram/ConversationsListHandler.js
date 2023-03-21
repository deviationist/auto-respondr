import Shared from '../Shared.js';
import asap from 'asap';
import Conversation from './Conversation.js';
import ConversationLog from '../../Model/ConversationLog.js';
import Url from './Url.js';
import Config from '../../Model/Config.js';
import { useDb } from '../../Helpers.js';

export default class ConversationsListHandler extends Shared {
    user;
    constructor(page, user) {
        super(page);
        this.user = user;
    }
    
    async goToConversations() {
        await this.page.goto(Url.conversationsUrl(), { waitUntil: 'networkidle' });
    }

    async hasReply(conversationId) {
        const count = await ConversationLog.countReplies(this.user.id, conversationId);
        return count > 0;
    }

    async shouldReply(conversation) {
        if (conversation.isGroupChat && Config.get('services.instagram.ignoreGroupChats') === true) {
            return false;
        }
        if (useDb() && Config.get('services.instagram.onlyReplyOnce') === true && await this.hasReply(conversation.id)) {
            return false;
        }
        return true;
    }
    
    async lookForUnreadMessages(cb) {
        for (const unreadConversation of await this.getUnreadConversations()) {
            if (await this.shouldReply(unreadConversation)) {
                asap(async () => {
                    await cb(unreadConversation);
                });
            }
        }
    }

    async getUnreadConversations() {
        return (await this.getConversations()).filter(row => row.isUnread === true);
    }

    async getConversationRows() {
        return await this.page.$$(`a[role="link"][href*="${Url.conversationBaseUri}"]`);
    }

    async getConversations() {
        const unreadMessages = [];
        for (const conversationRow of await this.getConversationRows()) {
            const nameContainer = await conversationRow.$('> div > div > div > *:nth-of-type(2) > div > div > div');
            if (nameContainer) {
                const params = {
                    href: await conversationRow.getAttribute('href'),
                    name: await nameContainer.innerText(),
                    isGroupChat: await this.conversationIsGroupChat(conversationRow),
                    isUnread: await this.conversationIsUnread(nameContainer)
                };
                unreadMessages.push(new Conversation(...Object.values(params)));
            }
        }
        return unreadMessages;
    }

    async conversationIsGroupChat(row) {
        const images = await row.$$('img[alt*="\'s profile picture"]')
        return images.length >= 2;
    }

    async conversationIsUnread(nameContainer) {
        let currentElement = nameContainer;
        let finalElement;
        do {
            const attempt = await currentElement.$('> *:first-child');
            if (attempt) {
                currentElement = attempt;
            } else {
                finalElement = currentElement;
                currentElement = false;
            }
        } while(currentElement);
        const fontWeight = await finalElement.evaluate((element) =>
            window.getComputedStyle(element).getPropertyValue('font-weight'),
        );
        return fontWeight === '600';
    }
}
