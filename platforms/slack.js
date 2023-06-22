const { App, ExpressReceiver } = require("@slack/bolt");

const dispatch = require("../dispatch");

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

async function sendmesg(message) {
    let user = message.user;

    if (message.user) {
        const match = message.user.match(/([UW][A-Z0-9]{2,})/);
        user = match[1];
    }

    if (message.priv) {
        await app.client.chat.postEphemeral({
            thread_ts: message.mrid,
            channel: message.chan,
            text: message.mesg,
            user: user,
        });
    } else {
        await app.client.chat.postMessage({
            thread_ts: message.mrid,
            channel: message.chan,
            text: message.mesg,
        });
    }
}

app.command(/^\/.+/, async ({ command, ack }) => {
    console.log("got command");
    await ack();

    console.log(command.user_id);
    dispatch(
        {
            plat: "slack",
            serv: command.team_id,
            chan: command.channel_name,
            user: `<@${command.user_id}|${command.user_name}>`,
            mesg: `${command.command} ${command.text}`,
            msid: null,
        },
        async (message) => {
            // HACK
            if (message.mrid === null) {
                await sendmesg({
                    ...message,
                    mesg: `${command.command} ${command.text}`,
                });
            }
            await sendmesg(message);
        }
    );
});

app.message(/^.*$/i, async ({ message }) => {
    console.log("got message");
    const { channels } = await app.client.conversations.list();
    const channel = channels.find((c) => c.id === message.channel).name;

    dispatch(
        {
            plat: "slack",
            serv: message.team,
            chan: channel,
            user: message.user,
            mesg: message.text,
            msid: message.ts,
        },
        sendmesg
    );
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
