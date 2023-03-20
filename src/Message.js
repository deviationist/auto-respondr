export class Message {
    static getGreetingWord() {
        const helloStrings = process.env.HELLO_ALTERNATIVES.split(',').map(e => e.trim());
        const randomKey = Math.floor(Math.random() * helloStrings.length);
        return helloStrings[randomKey];
    }
    
    static getMessageBase() {
        return process.env.MESSAGE_BASE;
    }
    
    static getFirstName(name) {
        return name.split(' ')[0];
    }

    static getNameString(conversation) {
        if (conversation.isGroupChat) {
            const names = conversation.names.map(e => Message.getFirstName(e));
            const last = names.pop();
            return `${names.join(', ')} ${process.env.MESSAGE_AND_WORD} ${last}`;
        } else {
            return Message.getFirstName(conversation.name);
        }
    }
    
    static generate(conversation) {
        return`${Message.getGreetingWord()} ${Message.getNameString(conversation)}! ${Message.getMessageBase()}`;
    }
}