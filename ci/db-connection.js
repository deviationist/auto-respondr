import * as dotenv from 'dotenv';
import { createMongodbConnectionString } from '../src/Database.js';
dotenv.config();

console.log(createMongodbConnectionString());