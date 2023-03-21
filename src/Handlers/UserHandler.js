import FacebookHandler from './Facebook/MainHandler.js';
import InstagramHandler from './Instagram/MainHandler.js';

export default class UserHandler {
    constructor(user) {
        const handlerClass = this.resolveHandlerClass(user);
        if (handlerClass) {
            return new handlerClass(user);
        }
    }

    resolveHandlerClass(user) {
        switch (user.service) {
            case 'facebook':
                return FacebookHandler;
            case 'instagram':
                return InstagramHandler;
        }
        return false;
    }
}