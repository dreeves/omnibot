function mentionToID(mention) {
    const match = mention.match(/^<@(.*)>$/);
    if (match) {
        return match[1];
    } else {
        throw `Invalid mention: {mention}`;
    }
}

async function sendmesg(client, interactionCache, message) {
    const { chan, fief, mesg, mrid, phem, priv, user: userMention } = message;

    let target;
    let funcName;
    let payload = {
        content: mesg,
    };

    if (userMention && priv) {
        if (target) {
            throw "Ambiguous message!";
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
            throw "Ambiguous message!";
        }

        const guilds = await client.guilds.fetch();
        let guild = guilds.find((g) => g.name === fief);
        guild = await guild.fetch();

        const channels = await guild.channels.fetch();
        const channel = channels.find((c) => c.name === chan);

        if (mrid && mrid.startsWith("interaction:")) {
            const interaction = interactionCache[mrid];
            payload.ephemeral = phem;
            target = interaction;

            if (interaction.replied) {
                funcName = "followUp";
            } else {
                funcName = "reply";
            }
        } else if (mrid) {
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
        throw "Ambiguous message!";
    }
}

module.exports = sendmesg;
