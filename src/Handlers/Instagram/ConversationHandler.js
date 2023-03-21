import Shared from '../Shared.js';

export default class ConversationHandler extends Shared {

    conversation;
    
    constructor(page, conversation) {
        super(page)
        this.conversation = conversation;
    }

    async goToConversation() {
        await this.page.goto(this.conversation.url, { waitUntil: 'networkidle' });
    }

    async sendMessage(message) {
        const messageInput = await this.page.$('textarea[placeholder*="Message"]');
        await messageInput.fill(message);
        await this.page.keyboard.press('Enter');
    }
}