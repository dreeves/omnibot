const { hasKeysExclusively } = require("../utils.js");

async function sendmesg(client, commandCache, message) {
    if (message.fief) {
        console.log("Fief is a noop on Slack!");
    }

    if (
        hasKeysExclusively(message, [
            "plat",
            "fief",
            "chan",
            "user",
            "phem",
            "mesg",
        ])
    ) {
        const match = message.user.match(/([UW][A-Z0-9]{2,})/);
        const userId = match[1];

        await client.chat.postEphemeral({
            channel: message.chan,
            user: userId,
            text: message.mesg,
            thread_ts: message.mrid,
        });
    } else if (
        hasKeysExclusively(message, ["plat", "fief", "user", "priv", "mesg"])
    ) {
        const match = message.user.match(/([UW][A-Z0-9]{2,})/);
        const userId = match[1];

        await client.chat.postMessage({
            thread_ts: message.mrid,
            channel: userId,
            text: message.mesg,
        });
    } else if (
        hasKeysExclusively(message, ["plat", "fief", "chan", "mesg"]) ||
        hasKeysExclusively(message, ["plat", "fief", "chan", "mrid", "mesg"]) ||
        hasKeysExclusively(message, [
            "plat",
            "fief",
            "chan",
            "user",
            "phem",
            "mesg",
            "mrid",
        ])
    ) {
        if (message.mrid && message.mrid.startsWith("command:")) {
            const ack = commandCache[message.mrid];
            await ack({
                response_type: message.phem ? "ephemeral" : "in_channel",
                text: message.mesg,
            });
        } else {
            if (message.phem) {
                const match = message.user.match(/([UW][A-Z0-9]{2,})/);
                const userId = match[1];

                await client.chat.postEphemeral({
                    user: userId,
                    thread_ts: message.mrid,
                    channel: message.chan,
                    text: message.mesg,
                });
            } else {
                await client.chat.postMessage({
                    thread_ts: message.mrid,
                    channel: message.chan,
                    text: message.mesg,
                });
            }
        }
    } else {
        throw (
            "Malformed message, Slack doesn't know what to do: " +
            JSON.stringify(message)
        );
    }
}

module.exports = sendmesg;
