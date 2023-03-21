export default class Url {
    static baseUrl = 'https://www.instagram.com';
    static conversationBaseUri = '/direct/t/';

    static conversationUrl(id) {
        return Url.buildUrl(`${Url.conversationBaseUri}${id}`);
    }

    static conversationsUrl() {
        return Url.buildUrl('/direct/inbox/');
    }
    
    static loginUrl() {
        return Url.buildUrl('/');
    }
    
    static buildUrl(href) {
        return `${Url.baseUrl}${href}`;
    }

    static extractIdFromUrl(href) {
        try {
            const regex = new RegExp('\/direct\/t\/([^/ ]+)(|\/)$');
            const matches = href.match(regex);
            return matches[1];
        } catch(e) {
            return false;
        }
    }
}