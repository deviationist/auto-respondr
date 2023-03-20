import { writeFileSync, existsSync, readFileSync } from 'fs';

export default class Cookies {
    static path = './cookies.json';

    static store(cookies) {
        writeFileSync(Cookies.path, JSON.stringify(cookies));
    }
    
    static has() {
        return existsSync(Cookies.path);
    }
    
    static get() {
        const data = readFileSync(Cookies.path, 'utf-8');
        return JSON.parse(Buffer.from(data));
    }
}