export class Screenshot {
    path = './cookies.json';

    storeCookies(cookies) {
        writeFileSync(this.path, JSON.stringify(cookies));
    }
    
    hasCookies() {
        return existsSync(this.path);
    }
    
    getCookies() {
        const data = readFileSync(this.path, 'utf-8');
        return JSON.parse(Buffer.from(data));
    }
}