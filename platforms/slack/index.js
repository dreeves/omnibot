const { App, ExpressReceiver } = require("@slack/bolt");
const { commandHandler, messageHandler } = require("./handlers.js");
const { registerPlatform } = require("../../sendemitter.js");
const sendmesg = require("./sendmesg.js");

const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const appOptions = process.env.DEBUG
    ? {
          socketMode: true,
          appToken: process.env.SLACK_APP_TOKEN,
      }
    : {
          receiver,
      };
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    ...appOptions,
});

const commandCache = {};

registerPlatform("slack", (message) =>
    sendmesg(app.client, commandCache, message)
);

app.command(/^\/.+/, ({ command, ack }) =>
    commandHandler(commandCache, command, ack)
);

app.message(/^[^\/].*$/i, async ({ message }) => {
    const { channels } = await client.conversations.list();
    await messageHandler(channels, message);
});

// Someone clicks on the Home tab of our app in Slack; render the page
app.event("app_home_opened", async ({ event, context }) =>
    homeHandler(app.client, event, context)
);

module.exports = app;
