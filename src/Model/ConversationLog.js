import ConversationLogSchema from '../DatabaseSchema/ConversationLog.js';

export default class ConversationLog {
    static async countReplies(userId, conversationId) {
        return await ConversationLogSchema.find({ userId, conversationId }).count();
    }

    static async logReply(userId, conversationId) {
        return await ConversationLogSchema.create({ userId, conversationId });
    }
}