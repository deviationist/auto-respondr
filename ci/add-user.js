import * as dotenv from 'dotenv';
import { databaseConnect } from '../src/Database.js';
import UserSchema from '../src/DatabaseSchema/User.js';
import User from '../src/Model/User.js';
import { handlers } from '../src/Enum.js';
import { useDb } from '../src/Helpers.js';
dotenv.config();

await databaseConnect();

if (process.argv.length != 5) {
    console.log('Invalid arguments.');
    process.exit(1);
}

const [ username, password, service ] = process.argv.slice(2);

if (!handlers.includes(service)) {
    console.log(`Service "${service}" is invalid.`);
    process.exit(1);
}

if (await User.exists(username, service)) {
    console.log(`User "${username}" already exists for service "${service}".`);
    process.exit(1);
}

const user = await User.create({
    username,
    password,
    service
});

if (user) {
    if (useDb()) {
        console.log(`User added (ID ${user._id.toString()})!`);
    } else {
        console.log('User added!');
    }
    process.exit(0);
} else {
    console.log('Could not create user');
    process.exit(1);
}

