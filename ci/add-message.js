import * as dotenv from 'dotenv';
import { databaseConnect } from '../src/Database.js';
import UserSchema from '../src/DatabaseSchema/User.js';
import User from '../src/Model/User.js';
import { handlers } from '../src/Enum.js';
dotenv.config();

await databaseConnect();

if (process.argv.length != 7) {
    console.log('Invalid arguments.');
    process.exit(1);
}

const [ username, service, greetingWords, messageBase, andWord ] = process.argv.slice(2);

if (!handlers.includes(service)) {
    console.log(`Service "${service}" is invalid.`);
    process.exit(1);
}

if (!await User.exists(username, service)) {
    console.log(`User "${username}" does not exists for service "${service}".`);
    process.exit(1);
}

const params = {};
if (greetingWords) {
    params.greetingWords = greetingWords;
}
if (messageBase) {
    params.base = messageBase;
}
if (andWord) {
    params.andWord = andWord;
}

await UserSchema.updateOne({ username, service }, { message: JSON.stringify(params) });

const user = await UserSchema.findOne({ username, service }).exec();

console.log(`Custom message was added to user (ID ${user._id.toString()})!`);
process.exit(0);