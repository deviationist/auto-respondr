export default class Url {
    static baseUrl = 'https://www.messenger.com';
    static conversationBaseUri = '/t/';

    static conversationUrl(id) {
        return Url.buildUrl(`${Url.conversationBaseUri}${id}`);
    }

    static conversationsUrl() {
        return Url.conversationUrl('1');
    }
    
    static loginUrl() {
        return Url.buildUrl('/');
    }
    
    static buildUrl(href) {
        return `${Url.baseUrl}${href}`;
    }

    static extractIdFromUrl(href) {
        try {
            const regex = new RegExp('\/t\/([^/ ]+)(|\/)$');
            const matches = href.match(regex);
            return matches[1];
        } catch(e) {
            return false;
        }
    }
}