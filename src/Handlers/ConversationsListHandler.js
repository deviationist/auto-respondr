import Shared from './Shared.js';
import asap from 'asap';
import Conversation from '../Conversation.js';

export default class ConversationsListHandler extends Shared {
    async lookForUnreadMessages(cb) {
        for (const unreadConversation of await this.getUnreadConversations()) {
            asap(async () => {
                await cb(unreadConversation);
            });
        }
    }

    async getUnreadConversations() {
        return (await this.getConversations()).filter(row => row.isUnread === true);
    }

    async getConversationRows() {
        return await this.page.$$('div[aria-label="Chats"] [role="gridcell"] > a');
    }

    async getConversations() {
        const unreadMessages = [];
        for (const conversationRow of await this.getConversationRows()) {
            const nameContainer = await conversationRow.$('span > span > span');
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
        const images = await row.$$('div[role="img"] img');
        if (images.length >= 2) {
            return true;
        }
        const image = images[0];
        const altText = await image.getAttribute('alt');
        const regex = new RegExp('(, | and )');
        return regex.test(altText);
    }

    async conversationIsUnread(nameSpan) {
        const fontWeight = await nameSpan.evaluate((element) =>
            window.getComputedStyle(element).getPropertyValue('font-weight'),
        );
        return fontWeight === '700';
    }
}
