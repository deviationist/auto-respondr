import * as dotenv from 'dotenv';
import { databaseConnect } from '../src/Database.js';
import User from '../src/Model/User.js';
import { handlers } from '../src/Enum.js';
dotenv.config();

await databaseConnect();

if (process.argv.length != 4) {
    console.log('Invalid arguments.');
    process.exit(1);
}

const [ username, service ] = process.argv.slice(2);

if (!handlers.includes(service)) {
    console.log(`Service "${service}" is invalid.`);
    process.exit(1);
}

if (!await User.exists(username, service)) {
    console.log(`User "${username}" does not exists for service "${service}".`);
    process.exit(1);
}

await User.delete({
    username,
    service
});

console.log(`User deleted!`);
process.exit(0);
