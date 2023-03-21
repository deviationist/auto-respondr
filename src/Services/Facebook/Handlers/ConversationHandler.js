import Shared from '../../Shared.js';

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
        const conversationContainer = await this.getConversationContainer();
        const messageInput = await conversationContainer.$('[aria-label="Message"]');
        await messageInput.fill(message);
        const submitButton = await conversationContainer.$('[aria-label="Press enter to send"]');
        await submitButton.click();
    }

    async getConversationContainer() {
        return this.page.$('div[aria-label*="Conversation with"][role="main"]');
    }
}