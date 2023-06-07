const { App, ExpressReceiver } = require("@slack/bolt");
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

module.exports = app;
