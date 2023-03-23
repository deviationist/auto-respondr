import UserSchema from '../DatabaseSchema/User.js';
import { useDb } from '../Helpers.js';
import Config from './Config.js';

export default class User {
    id;
    username;
    service;
    cookies;
    message;
    active;

    constructor({ username, password, service, cookies, message, active, id }) {
        if (useDb()) {
            this.id = id;
        }
        this.username = username;
        this.password = Buffer.from(password, 'base64').toString('utf8');
        this.service = service;
        this.cookies = cookies;
        this.message = message;
        this.active = active;
    }

    hasCookies() {
        return this.cookies != '' && typeof this.cookies == 'string';
    }

    getCookies() {
        return JSON.parse(this.cookies);
    }
    
    getMessage(dotNotation) {
        try {
            const messageObject = useDb() ? JSON.parse(this.message) : this.message;
            return dotNotation.split('.').reduce((o, i) => o[i], messageObject);
        } catch(e) {
            return false;
        }
    }

    async setCookies(cookies) {
        return await User.setCookiesStatic(useDb() ? this.id : this.username, cookies);
    }

    static async addMessage({ username, service }, messageObject) {
        if (useDb()) {
            await UserSchema.updateOne({ username, service }, { message: JSON.stringify(messageObject) });   
            return await UserSchema.findOne({ username, service }).exec();
        } else {
            return await User.updateUserInFile({ username, service }, { message: messageObject });
        }
    }

    static async delete({ username, service }) {
        if (useDb()) {
            return await UserSchema.deleteOne({ username, service });
        } else {
            return await User.removeUserFromFile({ username, service });
        }
    }

    static async create({ username, password, service }) {
        const data = {
            username,
            password: Buffer.from(password, 'utf8').toString('base64'),
            service,
            active: true,
        };
        if (useDb()) {
            return await UserSchema.create(data);
        } else {
            return await User.addUserToFile(data);
        }        
    }
    
    static async exists(username, service) {
        if (useDb()) {
            return UserSchema.exists({ username, service });
        } else {
            return (await User.getUsersFromFile(false)).filter(user => user.username == username && user.service == service).length > 0;
        }
    }
    
    static async getUsers(onlyActive) {
        if (useDb()) {
            const users = await User.getUsersFromDb(onlyActive);
            return users.map(user => {
                user.id = user._id.toString();
                return new User(user);
            });
        } else {
            const users = await User.getUsersFromFile(onlyActive);
            return users.map(user => new User(user));
        }
    }

    static async getUsersFromDb(onlyActive) {
        if (onlyActive) {
            return await UserSchema.find({ active: true }).exec();
        } else {
            return UserSchema.find().exec();
        }
    }

    static async getUsersFromFile(onlyActive) {
        try {
            let users = Config.getUsers();
            if (onlyActive) {
                users = users.filter(user => user.active === true);
            }
            return users;
        } catch(e) {
            return [];
        }
    }

    static async setCookiesStatic(userId, cookies) {
        if (useDb()) {
            return await User.setCookiesInDb(userId, cookies);
        } else {
            return await User.setCookiesInFile(userId, cookies);
        }
    }

    static async setCookiesInDb(userId, cookies) {
        return await UserSchema.findByIdAndUpdate(userId, { cookies: JSON.stringify(cookies) });
    }

    static async addUserToFile(user) {
        let users = await User.getUsersFromFile(false);
        users.push(user);
        return User.writeUserToFile(users);
    }

    static async updateUserInFile({ username, service }, data) {
        let users = await User.getUsersFromFile(false);
        users = users.map((user) => {
            if (user.username == username && user.service == service) {
                user = {...user, ...data};
            }
            return user;
        })
        return User.writeUserToFile(users);
    }

    static async removeUserFromFile({ username, service }) {
        let users = await User.getUsersFromFile(false);
        users = users.filter(user => !(user.username == username && user.service == service));
        return User.writeUserToFile(users);
    }

    static async setCookiesInFile(userId, cookies) {
        let users = await User.getUsersFromFile(false);
        users = users.map((user) => {
            if (user.username == userId) {
                user.cookies = JSON.stringify(cookies);
            }
            return user;
        });
        return User.writeUserToFile(users);
    }

    static writeUserToFile(users) {
        return Config.writeUsers(users);
    }
}