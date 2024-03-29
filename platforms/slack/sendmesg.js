const { ChumError } = require("../../sendemitter.js");

async function sendmesg(client, commandCache, message) {
    const { chan, mesg, mrid, phem, priv, user, plat } = message;

    if (plat !== "slack") {
        throw new ChumError(`Slack got erroneous platform ${plat}`);
    }

    if (priv && chan) {
        throw new ChumError("Unclear whether to send a private message!");
    }

    if (!mesg) {
        throw new ChumError("Missing message!");
    }

    if (priv && phem) {
        throw new ChumError(
            "Ambiguous message:\n" + JSON.stringify(message, null, 4),
        );
    }

    if ((priv || phem) && !user) {
        throw new ChumError("Missing target user!");
    }

    // FIXME the current channel might need to be a separate function.
    const { channels } = await client.conversations.list({
        types: "public_channel,private_channel,mpim",
    });

    let channelId;

    if (user && priv) {
        channelId = user;
    } else {
        const channel = channels.find((c) => c.name === chan || c.id === chan);
        channelId = channel.id;
    }

    let payload = {
        text: mesg,
        channel: channelId,
    };

    if (mrid && mrid.startsWith("command:")) {
        const ack = commandCache[mrid];
        await ack({
            response_type: phem ? "ephemeral" : "in_channel",
            text: mesg,
        });
    } else {
        if (mrid) {
            throw new ChumError("Replies are not supported on Slack");
        }

        if (user) {
            const match = message.user.match(/([UW][A-Z0-9]{2,})/);
            const userId = match[1];
            payload.user = userId;
        }

        if (user && priv) {
            payload.channel = payload.user;
        }

        if (user && phem) {
            return client.chat.postEphemeral(payload);
        }

        return client.chat.postMessage(payload);
    }
}

module.exports = sendmesg;
