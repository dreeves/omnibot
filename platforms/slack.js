const { App, ExpressReceiver } = require("@slack/bolt");

const { lexup } = require("../lexiguess.js");

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

// Someone says a single strictly alphabetic word in a channel our bot is in
app.message(/^\s*([a-z]{2,})\s*$/i, async ({ context, say }) => {
    // DRY me
    const cid = context.teamId; // string identifier for this server/channel
    const usaid = context.matches[0]; // the string the user typed
    const reply = lexup(cid, usaid);

    if (reply !== null) await say(reply);
});

// Someone clicks on the Home tab of our app in Slack; render the page
app.event("app_home_opened", async ({ event, context }) => {
    try {
        console.log(`Home tab opened in Slack by user ${event.user}`);
        await app.client.views.publish({
            token: context.botToken,
            user_id: event.user, // user who opened our app's app home tab
            view: {
                // the view payload that appears in the app home tab
                type: "home",
                callback_id: "home_view",
                blocks: [
                    // body of the view
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "Welcome to Omnibot :books:",
                        },
                    },
                    { type: "divider" },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `\
Instructions for Lexiguess (the main thing Omnibot does so far): \
The bot totally ignores anything that isn't a single word \
(at least 2 letters, no punctuation). \
That's really all you need to know. \
Everything else should be self-explanatory.\

There's also a /bid command for sealed-bid auctions.`,
                        },
                    },
                ],
            },
        });
    } catch (error) {
        console.error(error);
    }
});

module.exports = app;
