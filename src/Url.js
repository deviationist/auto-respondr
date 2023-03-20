export default class Url {
    static conversationUrl(id) {
        return Url.buildUrl(`/t/${id}`);
    }
    
    static loginUrl() {
        return Url.buildUrl('/');
    }
    
    static buildUrl(href) {
        return `${process.env.BASE_URL}${href}`;
    }

    static extractIdFromUrl(href) {
        try {
            const regex = new RegExp('\/t\/([^/]*)(|\/)$');
            const matches = href.match(regex);
            return matches[1];
        } catch(e) {
            return false;
        }
    }
}