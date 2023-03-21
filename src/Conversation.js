export default class Conversation {
    id;
    href;
    url;
    name;
    names;
    isGroupChat;
    isUnread;

    constructor(href, name, isGroupChat, isUnread, Url) {
        if (isGroupChat) {
            this.names = this.extractNames(name);
        }
        this.id = Url.extractIdFromUrl(href);
        this.href = href;
        this.url = Url.conversationUrl(this.id);
        this.name = name;
        this.isGroupChat = isGroupChat;
        this.isUnread = isUnread;
    }

    extractNames(name) {
        const regex = /(, | and )/
        let rawNames = name.split(regex);
        rawNames = rawNames.map(e => e.trim());
        rawNames = rawNames.filter(e => e != ',' && e != 'and');
        return rawNames;
    }
}
