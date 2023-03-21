import FacebookHandler from './Facebook/Facebook.js';
import InstagramHandler from './Instagram/Instagram.js';

export default class Handle {
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