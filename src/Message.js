import Config from './Model/Config.js';

export default class Message {
    user;
    constructor(user) {
        this.user = user;
    }

    getGreetingWordArray() {
        return this.getInheritedFromConfig('greetingWords').map(e => e.trim());
    }

    getGreetingWord() {
        const greetingWordsArray = this.getGreetingWordArray();
        const randomKey = Math.floor(Math.random() * greetingWordsArray.length);
        return greetingWordsArray[randomKey];
    }
    
    getMessageBase() {
        return this.getInheritedFromConfig('base');
    }

    getAndWord() {
        return this.getInheritedFromConfig('andWord');
    }

    getInheritedFromConfig(key) {
        const fromUser = this.user.getMessage(key);
        if (fromUser) {
            return fromUser;
        }
        const fromService = Config.get(`services.${this.user.service}.message.${key}`);
        if (fromService) {
            return fromService;
        }
        return Config.get(`message.${key}`);
    }

    getNameString(conversation) {
        if (conversation.isGroupChat) {
            const names = conversation.names.map(e => Message.getFirstName(e));
            const last = names.pop();
            return `${names.join(', ')} ${this.getAndWord()} ${last}`;
        } else {
            return Message.getFirstName(conversation.name);
        }
    }

    static getFirstName(name) {
        return name.split(' ')[0];
    }
    
    static generate(conversation, user) {
        const instance = new Message(user);
        return`${instance.getGreetingWord()} ${instance.getNameString(conversation)}! ${instance.getMessageBase()}`;
    }
}