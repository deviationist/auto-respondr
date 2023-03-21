import * as dotenv from 'dotenv';
import { databaseConnect } from './Database.js';
import User from './Model/User.js';
import { useDb } from './Helpers.js';
import Handle from './Services/Handle.js';
dotenv.config();

async function start() {
    const users = await User.getUsers(true);
    if (users.length == 0) {
        console.log('No users.');
        process.exit(1);
    }
    users.map(user => new Handle(user))
}

if (useDb()) await databaseConnect();
await start();

process.on('SIGINT', () => {
    process.exit(0);
});