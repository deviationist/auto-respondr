import { readFileSync, writeFileSync } from 'fs';

export default class Config {
    static filePath = './config.json';
    static data;

    static get(dotNotation) {
        if (!Config.data) {
            const dataStream = readFileSync(Config.filePath, 'utf-8');
            Config.data = JSON.parse(Buffer.from(dataStream));
        }
        if (dotNotation) {
            return dotNotation.split('.').reduce((o, i) => o[i], Config.data);
        } else {
            return Config.data;
        }
    }

    static write(config) {
        return writeFileSync(Config.filePath, JSON.stringify(config, null, 4));
    }

    static getUsers() {
        return Config.get('users') ?? [];
    }

    static writeUsers(users) {
        const config = Config.get();
        config.users = users;
        return Config.write(config);
    }
}