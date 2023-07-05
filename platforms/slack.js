const { App, ExpressReceiver } = require("@slack/bolt");

const { hasKeysExclusively } = require("./utils.js");
const dispatch = require("../dispatch");
const { registerPlatform } = require("../sendemitter.js");

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

async function sendmesg(message) {
    if (message.fief) {
        console.log("Fief is a noop on Slack!");
        delete message.fief;
    }

    if (hasKeysExclusively(message, ["plat", "user", "phem", "mesg"])) {
        const match = message.user.match(/([UW][A-Z0-9]{2,})/);
        const userId = match[1];

        await app.client.chat.postEphemeral({
            channel: message.chan,
            user: userId,
            text: message.mesg,
        });
    } else if (hasKeysExclusively(message, ["plat", "user", "priv", "mesg"])) {
        const match = message.user.match(/([UW][A-Z0-9]{2,})/);
        const userId = match[1];

        await app.client.chat.postMessage({
            thread_ts: message.mrid,
            channel: userId,
            text: message.mesg,
        });
    } else if (
        hasKeysExclusively(message, ["plat", "chan", "mesg"]) ||
        hasKeysExclusively(message, ["plat", "chan", "mrid", "mesg"])
    ) {
        let realMrid = message.mrid;

        if (message.mrid.startsWith("command:")) {
            const command = commandCache[message.mrid];
            const { message: fauxMessage } = await app.client.chat.postMessage({
                channel: message.chan,
                text: `${command.command} ${command.text}`,
            });

            realMrid = fauxMessage.ts;
        }

        await app.client.chat.postMessage({
            thread_ts: realMrid,
            channel: message.chan,
            text: message.mesg,
        });
    } else {
        throw (
            "Malformed message, Slack doesn't know what to do: " +
            JSON.stringify(message)
        );
    }
}

registerPlatform("slack", sendmesg);

app.command(/^\/.+/, async ({ command, ack }) => {
    await ack();

    const commandID = `command:${command.trigger_id}`;
    commandCache[commandID] = command;
    dispatch({
        plat: "slack",
        fief: command.team_id,
        chan: command.channel_name,
        user: `<@${command.user_id}|${command.user_name}>`,
        mesg: `${command.command} ${command.text}`,
        msid: commandID,
    });
});

app.message(/^.*$/i, async ({ message }) => {
    const { channels } = await app.client.conversations.list();
    const channel = channels.find((c) => c.id === message.channel).name;

    dispatch({
        plat: "slack",
        chan: channel,
        user: message.user,
        mesg: message.text,
        msid: message.ts,
    });
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
