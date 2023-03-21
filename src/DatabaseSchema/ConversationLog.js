import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    conversationId: String,
    userId: String,
}, { timestamps: true });

const ConversationLog = mongoose.model('ConversationLog', schema, 'ConversationLog');
export default ConversationLog;
