import playwright from 'playwright';
import { rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { clearIntervalAsync, setIntervalAsync } from 'set-interval-async';

let page;
let browser;
let screenshotInterval;
let activeConversation;

const debug = true;
const baseUrl = 'https://www.messenger.com';
const takeScreenshots = true;
const messageCheckIntervalInMs = 3000;
const screenshotFilePath = process.cwd() + '/screenshots';

export async function startLooking() {

    await initializeBrowser();
    if (takeScreenshots) startTakingScreenshots();

    await page.goto(loginUrl(), { waitUntil: 'networkidle' });
    await ensureAcceptCookies();
    await ensureLoggedIn();

    activeConversation = await getActiveConversation();
    if (debug) console.log(`Active conversation is ${activeConversation.name} (${activeConversation.id}${activeConversation.isGroupChat ? ', group chat' : ''})`);

    /*
    console.log('Successfully changed conversation to ', await loadConversation('/t/749288873', 'Maria Strand'));
    console.log('New active conversation is ', await getActiveConversation());

    console.log('Successfully changed conversation to ', await loadConversation('/t/6171719659562121', 'Robert, Daelyn Temperance'));
    console.log('New active conversation is ', await getActiveConversation());
    */

    if (debug) console.log('Looking for unread messages...');
    setIntervalAsync(async () => {
        await lookForNewMessages();
    },  messageCheckIntervalInMs);
}

function loadConversation(href, navigationName) {
    page.goto(conversationUrl(href), { waitUntil: 'networkidle' });
    const navigationId = extractIdFromUrl(href);
    return new Promise((resolve, reject) => {
        const interval = setIntervalAsync(async () => {
            const id = extractIdFromUrl(await page.url());
            const name = await getCurrentNameFromConversation();
            if (navigationName == name && navigationId == id) {
                resolve({ id, name });
            }
        }, 1000);
        setTimeout(() => {
            clearIntervalAsync(interval);
            reject();
        }, 8000);
    });
}

function getActiveConversation() {
    return new Promise((resolve, reject) => {
        const interval = setIntervalAsync(async () => {
            const id = extractIdFromUrl(await page.url());
            const name = await getCurrentNameFromConversation();
            const sidebarIsLoaded = await currentConversationSidebarIsLoaded();
            const isGroupChat = sidebarIsLoaded ? await currentConversationIsGroupChat() : null;
            if (name && sidebarIsLoaded && typeof isGroupChat == 'boolean') {
                resolve({ id, name, isGroupChat });
            }
        }, 1000);
        setTimeout(() => {
            clearIntervalAsync(interval);
            reject();
        }, 8000);
    });
}

async function lookForNewMessages() {
    //await checkForNewMessagesInActiveConversation();
    await checkForNewMessagesInConversationList();
}

/*
function setActiveConversation(id, name) {
    activeConversation = { id, name };
    if (debug) console.log(`Active conversation: ${name} (${id})`);
}
*/

/**
 * Catch new messages in active conversation.
 */
async function checkForNewMessagesInActiveConversation() {
    // TODO: Ignore if this is group chat
    if (await lastMessageIsFromRecipient()) {
        const personName = await getCurrentNameFromConversation();
        //setActiveConversation(personName);
        if (personName) {
            if (debug) console.log(`New message from ${personName} (in active conversation)`);
            sendMessage(generateMessage(personName));
        }
    }
}

function conversationAlreadyActive(currentConversationId) {
    return activeConversation && activeConversation?.id == currentConversationId;
}

async function currentConversationIsGroupChat() {
    const sidebarText = await getCurrentConversationSidebarText();
    return sidebarText.includes('Chat members');
}

async function currentConversationSidebarIsLoaded() {
    const sidebarText = await getCurrentConversationSidebarText();
    return sidebarText != '';
}

async function getCurrentConversationSidebarText() {
    const sidebarContainer = await getSidebarContainer();
    if (sidebarContainer) {
        return await sidebarContainer.innerText();
    }
    return '';
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
        const row = await page.$(`[role="gridcell"] > a[href="${unreadConversation.href}"]`);
        row.click();
        let waitForTabToLoad = setIntervalAsync(async () => {
            const conversationContainer = await getConversationContainer();
            const conversationName = await getCurrentNameFromConversation();
            if (conversationName && unreadConversation.name == conversationName) {
                //setActiveConversation(unreadConversation.name);
                clearIntervalAsync(waitForTabToLoad);
                sendMessage(conversationContainer, generateMessage(unreadConversation.name));
            }
        }, 250);
    }
}

function loginUrl() {
    return `${baseUrl}/`;
}

function conversationUrl(href) {
    return `${baseUrl}${href}`;
}

async function getUnreadConversations() {
    return (await getConversations()).filter(row => row.isUnread === true);
}

async function isGroupChat(row) {
    const images = await row.$$('div[role="img"] img');
    if (images.length >= 2) {
        return true;
    }
    const image = images[0];
    const altText = await image.getAttribute('alt');
    const regex = new RegExp('(, | and )');
    return regex.test(altText);
}

/**
 * Get unread messages from conversation list.
 * 
 * @returns 
 */
async function getConversations() {
    const unreadMessages = [];
    const conversations = await getConversationRows();
    for (const conversationRow of conversations) {
        const nameContainer = await conversationRow.$('span > span > span');
        if (nameContainer) {
            const personName = await nameContainer.innerText();
            const href = await conversationRow.getAttribute('href');
            const id = extractIdFromUrl(href);
            unreadMessages.push({
                id,
                href,
                name: personName,
                isGroupChat: await isGroupChat(conversationRow),
                isUnread: await isUnread(nameContainer)
            });
        }
    }
    return unreadMessages;
}

export async function shutDown() {
    if (takeScreenshots) {
        if (screenshotInterval) {
            clearIntervalAsync(screenshotInterval);
        }
        await page.screenshot({ path: `${screenshotFilePath}/final.png` });
    }
    await page.close();
    await browser.close();
}

/**
 * Check if last message is from recipient.
 * 
 * @param {*} conversationContainer 
 * @returns 
 */
async function lastMessageIsFromRecipient() {
    const conversationContainer = await getConversationContainer();
    const lastMessageText = await getLastMessageText(conversationContainer);
    const isFromYou = lastMessageText.includes('You sent');
    return !isFromYou;
}

/**
 * Extract ID from URL.
 * 
 * @param {*} href 
 * @returns 
 */
function extractIdFromUrl(href) {
    try {
        const regex = new RegExp('\/t\/([^/]*)(|\/)$');
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
async function getConversationRows() {
    return await page.$$('div[aria-label="Chats"] [role="gridcell"] > a');
}

/**
 * Send message in active conversation.
 * 
 * @param {*} conversationContainer 
 * @param {*} message 
 */
async function sendMessage(message) {
    const conversationContainer = await getConversationContainer();
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

async function getSidebarContainer() {
    const conversationContainer = await getConversationContainer();
    if (conversationContainer) {
        return conversationContainer.$('> div > div > div:last-child');
    }
    return false;
}

async function getConversationContainer() {
    return page.$('div[aria-label*="Conversation with"][role="main"]');
}

async function getCurrentNameFromConversation() {
    const conversationContainer = await getConversationContainer();
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
        await page.getByText('Keep me signed in').click();
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
    screenshotInterval = setIntervalAsync(() => {
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
    browser = await playwright.chromium.launch();
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
