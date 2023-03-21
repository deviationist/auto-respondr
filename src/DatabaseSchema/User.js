import mongoose from 'mongoose';
import { handlers } from '../Enum.js';

const schema = new mongoose.Schema({
    username: String,
    password: String,
    service: {
        type: String,
        enum : handlers,
    },
    message: {
        type: String,
        default: ''
    },
    cookies: {
        type: String,
        default: ''
    },
    active: {
        type: Boolean,
        default: true
    },
}, { timestamps: true });

const User = mongoose.model('User', schema, 'Users');
export default User;
