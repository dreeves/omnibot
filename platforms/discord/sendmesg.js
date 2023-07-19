const { hasKeysExclusively } = require("../utils.js");

function mentionToID(mention) {
    const match = mention.match(/^<@(.*)>$/);
    if (match) {
        return match[1];
    } else {
        throw `Invalid mention: @{mention}`;
    }
}

async function sendmesg(client, interactionCache, message) {
    const { fief, chan, mesg, mrid, user, phem } = message;

    if (hasKeysExclusively(message, ["plat", "user", "priv", "mesg"])) {
        const userId = mentionToID(user);
        const discordUser = await client.users.fetch(userId);

        discordUser.send(mesg);
    } else if (
        hasKeysExclusively(message, ["plat", "fief", "chan", "mrid", "mesg"]) ||
        hasKeysExclusively(message, [
            "plat",
            "fief",
            "chan",
            "mrid",
            "phem",
            "mesg",
        ])
    ) {
        const guilds = await client.guilds.fetch();
        let guild = guilds.find((g) => g.name === fief);
        guild = await guild.fetch();

        const channels = await guild.channels.fetch();
        const channel = channels.find((c) => c.name === chan);

        if (mrid.startsWith("interaction:")) {
            const interaction = interactionCache[mrid];

            if (interaction.replied) {
                interaction.followUp({
                    content: mesg,
                    ephemeral: phem,
                });
            } else {
                interaction.reply({
                    content: mesg,
                    ephemeral: phem,
                });
            }
        } else {
            await channel.messages.fetch(mrid).then((m) => m.reply(mesg));
        }
    } else if (hasKeysExclusively(message, ["plat", "fief", "chan", "mesg"])) {
        const guilds = await client.guilds.fetch();
        let guild = guilds.find((g) => g.name === fief);
        guild = await guild.fetch();

        const channels = await guild.channels.fetch();
        const channel = channels.find((c) => c.name === chan);

        await channel.send(mesg);
    } else {
        throw (
            "Malformed message, Discord doesn't know what to do: " +
            JSON.stringify(message)
        );
    }
}

module.exports = sendmesg;
