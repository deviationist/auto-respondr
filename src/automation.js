import playwright from 'playwright';
import { rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { clearIntervalAsync, setIntervalAsync } from 'set-interval-async';

let page;
let screenshotInterval;;
const debug = true;
const loginUrl = 'https://www.messenger.com/';
const takeScreenshots = true;
let activeConversationName;
const messageCheckIntervalInMs = 1000;
const screenshotFilePath = process.cwd() + '/screenshots';

process.on('SIGTERM', async () => {
    if (debug) console.log('SIGTERM received.')
    await shutDown();
});

export async function startLooking() {
    await initializeBrowser();
    if (takeScreenshots) startTakingScreenshots();
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    await ensureAcceptCookies();
    await ensureLoggedIn();
    if (debug) console.log('Looking for unread messages...');
    setIntervalAsync(async () => {
        await lookForNewMessages();
    },  messageCheckIntervalInMs);
}

async function lookForNewMessages() {
    await checkForNewMessagesInActiveConversation();
    await checkForNewMessagesInConversationList();
}

function setActiveConversation(name) {
    activeConversationName = name;
    if (debug) console.log(`Active conversation: ${name}`);
}

/**
 * Catch new messages in active conversation.
 */
async function checkForNewMessagesInActiveConversation() {
    const conversationContainer = await getConversationContainer();
    if (conversationContainer && await lastMessageIsFromRecipient(conversationContainer)) {
        const personName = await getCurrentNameFromConversation(conversationContainer);
        setActiveConversation(personName);
        if (personName) {
            if (debug) console.log(`New message from ${personName} (in active conversation)`);
            sendMessage(conversationContainer, generateMessage(personName));
        }
    }
}

function conversationAlreadyActive(currentConversationName) {
    return activeConversationName && activeConversationName == currentConversationName;
}

/**
 * Handle unread messages in conversation list.
 */
async function checkForNewMessagesInConversationList() {
    const unreadConversations = await getUnreadConversations();
    for (const unreadConversation of unreadConversations) {
        if (conversationAlreadyActive()) {
            continue;
        }
        if (debug) console.log(`New message from ${unreadConversation.name}`);
        const row = await page.$(`[role="gridcell"] > a[href="${href}"]`);
        row.click();
        let waitForTabToLoad = setIntervalAsync(async () => {
            const conversationContainer = await getConversationContainer();
            const conversationName = await getCurrentNameFromConversation(conversationContainer);
            if (conversationName && unreadConversation.name == conversationName) {
                setActiveConversation(unreadConversation.name);
                clearIntervalAsync(waitForTabToLoad);
                sendMessage(conversationContainer, generateMessage(unreadConversation.name));
            }
        }, 250);
    }
}

/**
 * Get unread messages from conversation list.
 * 
 * @returns 
 */
async function getUnreadConversations() {
    const unreadMessages = [];
    const conversations = await getConversations();
    for (const conversationRow of conversations) {
        const nameContainer = await conversationRow.$('span > span > span');
        if (nameContainer && await isUnread(nameContainer)) {
            const personName = await nameContainer.innerText();
            const href = await conversationRow.getAttribute('href');
            const id = extractIdFromHref(href);
            unreadMessages.push({
                id,
                href,
                name: personName,
            });
        }
    }
    return unreadMessages
}

export async function shutDown() {
    if (takeScreenshots) {
        clearIntervalAsync(screenshotInterval);
        await page.screenshot({ path: `${screenshotFilePath}/final.png` });
    }
    await browser.close();
}

/**
 * Check if last message is from recipient.
 * 
 * @param {*} conversationContainer 
 * @returns 
 */
async function lastMessageIsFromRecipient(conversationContainer) {
    const lastMessageText = await getLastMessageText(conversationContainer);
    const isFromYou = lastMessageText.includes('You sent');
    return !isFromYou;
}

/**
 * Extract ID from conversation href.
 * 
 * @param {*} href 
 * @returns 
 */
function extractIdFromHref(href) {
    try {
        const regex = new RegExp('\/t\/(.*)\/');
        const matches = href.match(regex);
        return matches[1];
    } catch(e) {
        return false;
    }
}

/**
 * Get the text of the last message.
 * 
 * @param {*} conversationContainer 
 * @returns 
 */
async function getLastMessageText(conversationContainer) {
    const messages = await conversationContainer.$$('div[aria-label*="Messages in conversation"] > div:visible');
    for (const message of messages.reverse()) {
        const lastMessageText = await message.innerText();
        if (!lastMessageText.includes('is typing')) {
            return lastMessageText;
        }
    }
    return '';
}

/**
 * Get unread messages from conversation list.
 * 
 * @returns 
 */
async function getConversations() {
    return await page.$$('div[aria-label="Chats"] [role="gridcell"] > a');
}

/**
 * Send message in active conversation.
 * 
 * @param {*} conversationContainer 
 * @param {*} message 
 */
async function sendMessage(conversationContainer, message) {
    const messageInput = await conversationContainer.$('[aria-label="Message"]');
    await messageInput.fill(message);
    (await conversationContainer.$('[aria-label="Press enter to send"]')).click();
}

/**
 * Check if conversation has unread messages.
 * 
 * @param {*} nameSpan 
 * @returns 
 */
async function isUnread(nameSpan) {
    const fontWeight = await nameSpan.evaluate((element) =>
        window.getComputedStyle(element).getPropertyValue('font-weight'),
    );
    return fontWeight === '700';
}

async function getConversationContainer() {
    return await page.$('div[aria-label*="Conversation with"]');
}

async function getCurrentNameFromConversation(conversationContainer) {
    if (conversationContainer) {
        const nameContainer = await conversationContainer.$('h1 > span > span')
        return await nameContainer.innerText();
    }
    return false;
}

function getGreetingWord() {
    const helloStrings = process.env.HELLO_ALTERNATIVES.split(',').map(e => e.trim());
    const randomKey = Math.floor(Math.random() * helloStrings.length);
    return helloStrings[randomKey];
}

function getMessageBase() {
    return process.env.BASE_MESSAGE;
}

function formatName(name) {
    return name.split(' ')[0];
}

function generateMessage(name) {
    return`${getGreetingWord()} ${formatName(name)}! ${getMessageBase()}`;
}

async function ensureAcceptCookies() {
    if (await page.isVisible('text="Only allow essential cookies"')) {
        await page.getByText('Only allow essential cookies').click();
    }
}

function isLoggedIn() {
    return Promise.any([
        page.getByRole('button', { name: 'Log In' }).waitFor().then(() => false),
        page.getByText('Chats', { exact: true }).waitFor().then(() => true),
    ]).catch(() => {
        throw 'Missing button';
    });
}

function storeCookies(cookies) {
    writeFileSync('./cookies.json', JSON.stringify(cookies));
}

function hasCookies() {
    return existsSync('./cookies.json');
}

function getCookies() {
    const data = readFileSync('./cookies.json', 'utf-8');
    return JSON.parse(Buffer.from(data));
}

async function ensureLoggedIn() {
    if (await isLoggedIn()) {
        if (debug) console.log('Already logged in!');
        return;
    } else {
        await page.type('input[name="email"]', process.env.FACEBOOK_EMAIL);
        await page.type('input[name="pass"]', process.env.FACEBOOK_PASSWORD);
        await page.click('button[name="login"]');
    }
    if (!await isLoggedIn()) {
        throw new Error('Login failed!');
    } else {
        if (debug) console.log('We logged in successfully!');
        storeCookies(await page.context().cookies());
    }
}

function startTakingScreenshots() {
    rmSync(screenshotFilePath, { recursive: true, force: true });
    let count = 0;
    screenshotInterval = setInterval(() => {
        page.screenshot({ path: `${screenshotFilePath}/${count}.png` });
        count++;
    }, 100);
}

function getUserAgent() {
    /*
    const userAgents = [
        'Mozilla/5.0 (Linux; Android 7.0; SM-J730FM Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/62.0.3202.84 Mobile Safari/537.36 YandexSearch/7.90 YandexSearchBrowser/7.90',
        'Mozilla/5.0 (Linux; Android 6.0; BQS-5020 Build/MRA58K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.91 Mobile Safari/537.36 YandexSearch/7.70 YandexSearchBrowser/7.70',
        'Mozilla/5.0 (Linux; Android 7.0; BV8000Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.99 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; U; Android 8.0.0; en-US; ANE-LX1 Build/HUAWEIANE-LX1) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.108 UCBrowser/12.9.10.1159 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 7.0; AGS-L09 Build/HUAWEIAGS-L09; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/59.0.3071.125 Safari/537.36 YandexSearch/7.90/apad YandexSearchBrowser/7.90',
        'Mozilla/5.0 (Linux; Android 4.3; NokiaX2DS Build/JLS36C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 YaBrowser/15.4.2272.3842.00 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 7.1.1; Lenovo TB-8704X Build/NMF26F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/58.0.3029.83 Safari/537.36 YandexSearch/6.10/apad',
        'Mozilla/5.0 (Linux; Android 7.0; SM-J730FM) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 7.0; KOB-L09 Build/HUAWEIKOB-L09; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/55.0.2883.91 Mobile Safari/537.36 YandexSearch/7.90 YandexSearchBrowser/7.90',
        'Mozilla/5.0 (Linux; Android 6.0; Light A103 Build/MRA58K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.91 Mobile Safari/537.36'
    ];
    const randomKey = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomKey];
    */
    return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';
}

async function initializeBrowser() {
    const browser = await playwright.chromium.launch();
    const userAgent = getUserAgent();
    if (debug) console.log(`Using user agent "${userAgent}".`)
    const context = await browser.newContext({
        locale: 'en-US',
        userAgent: userAgent,
        headless: false,
    });
    if (hasCookies()) {
        context.addCookies(getCookies());
    }
    page = await context.newPage();
    return page;
}
