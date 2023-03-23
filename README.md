# Auto Respondr
Message auto-responder for Instagram and Facebook Messenger.

## Setup
1. Ensure that you have [installed the browser binaries](https://playwright.dev/docs/browsers#managing-browser-binaries).
2. Run `npm install`
3. Copy file `.env.example` to `.env` and fill in values (for MongoDB-setup only)
4. Copy file `config-example.json` to `config.json` and fill in values.

The users can either be configured in the JSON-file or in the Users-table in the MongoDB container.

### MongoDB setup
1. Ensure you have installed Docker (for macOS you can you Docker Desktop)
2. Run `npm run db-setup`

#### Adding/removing users
Add a user - `npm run add-user your@email.com 'your-password' instagram` (valid services are instagram or facebook)
Deleting a user - `npm run delete-user your@email.com instagram`
Adding custom messages to a user - `npm run add-message your@email.com instagram "Hello,Hi" "I'm not using this service anymore! Please contact me on..." "&"`
<hr>

For development run `npm run dev` (automatic reload). For production `npm run start`.

If you want to run this in production I'd recommend using [pm2](https://pm2.keymetrics.io/).

## Config
The config file is located at `config.json` in the project root:

### items
`message.greetingWords` - an array of greeting words that's randomly selected during message generation.
`message.base` - the base message being used when replying.
`message.andWord` - the and word for when there's multiple names in the greeting.
`browser.locale` - The browser locale. Changing this might cause the locators in Playwright to stop working.
`browser.userAgent` - The browser user agent.
`users` - An array of users (use this when not using MongoDB).
`services.*.ignoreGroupChats` - Whether to not reply to group chats.
`services.*.onlyReplyOnce` - Only send reply once (requires MongoDB to store conversation state).