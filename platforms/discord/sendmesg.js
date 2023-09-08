const { ChumError } = require("../../sendemitter.js");

function mentionToID(mention) {
    const match = mention.match(/^<@(.*)>$/);
    if (match) {
        return match[1];
    } else {
        throw new ChumError(`Invalid mention: {mention}`);
    }
}

async function sendmesg(client, interactionCache, message) {
    const {
        plat,
        chan,
        fief,
        mesg,
        mrid,
        phem,
        priv,
        user: userMention,
    } = message;

    if (plat !== "discord") {
        throw new ChumError(`Discord got erroneous platform ${plat}`);
    }

    if (!mesg) {
        throw new ChumError("Missing message!");
    }

    let channelMessage = fief && chan;
    let directMessage = userMention && priv;
    let commandReply = mrid && mrid.startsWith("interaction:");
    if (channelMessage && directMessage) {
        throw new ChumError("Unclear whether to send a private message!");
    }

    if (channelMessage && commandReply) {
        throw new ChumError("Command replies don't accept fief and chan.");
    }

    if (directMessage && commandReply) {
        throw new ChumError("Command replies don't accept user and priv.");
    }

    if (fief && !chan) {
        throw new ChumError("Missing chan!");
    }

    if (!fief && chan) {
        throw new ChumError("Missing fief!");
    }

    if (userMention && !priv) {
        throw new ChumError("Missing priv!");
    }

    if (!userMention && priv) {
        throw new ChumError("Missing user!");
    }

    let target;
    let funcName;
    let payload = {
        content: mesg,
    };

    if (mrid && mrid.startsWith("interaction:")) {
        const interaction = interactionCache[mrid];
        if (phem) {
            payload.ephemeral = true;
        }
        target = interaction;

        if (interaction.replied) {
            funcName = "followUp";
        } else {
            funcName = "reply";
        }
    }

    if (userMention && priv) {
        if (target) {
            throw new ChumError("Ambiguous message!");
        }

        const userId = mentionToID(userMention);
        const user = await client.users.fetch(userId);

        if (mrid) {
            const channel = user.dmChannel;
            const message = await channel.messages.fetch(mrid);
            target = message;
            funcName = "reply";
        } else {
            target = user;
            funcName = "send";
        }
    }

    if (fief && chan) {
        if (target) {
            throw new ChumError("Ambiguous message!");
        }

        const guilds = await client.guilds.fetch();
        let guild = guilds.find((g) => g.name === fief);
        guild = await guild.fetch();

        const channels = await guild.channels.fetch();
        const channel = channels.find((c) => c.name === chan);

        if (mrid) {
            const message = await channel.messages.fetch(mrid);
            target = message;
            funcName = "reply";
        } else {
            target = channel;
            funcName = "send";
        }
    }

    if (target && funcName) {
        const sent = await target[funcName](payload);
        return sent.id || sent.interaction?.id;
    } else {
        throw new ChumError("Ambiguous message!");
    }
}

module.exports = sendmesg;
