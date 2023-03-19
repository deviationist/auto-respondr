import * as dotenv from 'dotenv';
import { startLooking } from './automation.js';
dotenv.config();
startLooking();

process.on('SIGINT', () => {
    process.exit(0);
});