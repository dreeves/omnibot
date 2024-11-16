const dispatch = require("../../dispatch");
const { sendmesg } = require("../../sendemitter.js");

async function commandHandler(commandCache, command, ack) {
    const commandID = `command:${command.trigger_id}`;
    const dm = command.channel_name === "directmessage";
    commandCache[commandID] = ack;
    dispatch(sendmesg, {
        plat: "slack",
        fief: command.team_id,
        chan: command.channel_name,
        user: `<@${command.user_id}|${command.user_name}>`,
        mesg: `${command.command} ${command.text}`,
        msid: commandID,
        priv: dm,
    });
}

async function messageHandler(channels, message) {
    const channel = channels.find((c) => c.id === message.channel).name;
    dispatch(sendmesg, {
        plat: "slack",
        fief: "noop",
        chan: channel,
        user: `<@${message.user}>`,
        mesg: message.text,
        msid: message.ts,
    });
}

async function homeHandler(client, event, context) {
    {
        try {
            console.log(`Home tab opened in Slack by user ${event.user}`);
            await client.views.publish({
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
OMNIBOT! \
Instructions for Lexiguess: \
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
    }
}

module.exports = {
    commandHandler,
    messageHandler,
    homeHandler,
};
