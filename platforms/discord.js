const Discord = require("discord.js");

const { hasKeysExclusively } = require("./utils.js");
const dispatch = require("../dispatch.js");
const { registerPlatform } = require("../sendemitter.js");

const discord = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
    ],
});

let interactionCache = {};

function mentionToID(mention) {
    const match = mention.match(/^<@(.*)>$/);
    if (match) {
        return match[1];
    } else {
        throw `Invalid mention: @{mention}`;
    }
}

async function sendmesg(message) {
    const { fief, chan, mesg, mrid, user, phem } = message;

    if (hasKeysExclusively(message, ["plat", "user", "priv", "mesg"])) {
        const userId = mentionToID(user);
        const discordUser = await discord.users.fetch(userId);

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
        const guilds = await discord.guilds.fetch();
        let guild = guilds.find((g) => g.name === fief);
        guild = await guild.fetch();

        const channels = await guild.channels.fetch();
        const channel = channels.find((c) => c.name === chan);

        // HACK
        let realMrid = mrid;

        if (mrid.startsWith("interaction:") && phem) {
            const { interaction } = interactionCache[mrid];
            interaction.followUp({
                content: mesg,
                ephemeral: true,
            });
        } else if (mrid.startsWith("interaction:")) {
            const { interaction } = interactionCache[mrid];
            const fauxMessage = await interaction.channel.send(
                interactionCache[mrid].fauxInput
            );
            realMrid = fauxMessage.id;
        }

        await channel.messages.fetch(realMrid).then((m) => m.reply(mesg));
    } else if (hasKeysExclusively(message, ["plat", "fief", "chan", "mesg"])) {
        const guilds = await discord.guilds.fetch();
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

registerPlatform("discord", sendmesg);

discord.once("ready", () => {
    console.log(
        `Omnibot is running; logged in to Discord as ${discord.user.tag}`
    );
});

discord.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;
    const input = interaction.options.getString("input");

    await interaction.reply({
        content: "running",
        ephemeral: true,
    });

    const fauxInput = `/${command} ${input || ""}`;
    interactionCache[`interaction:${interaction.id}`] = {
        interaction,
        fauxInput,
    };

    try {
        dispatch({
            plat: "discord",
            fief: interaction.guild.name,
            chan: interaction.channel.name,
            user: `<@${interaction.user.id}>`,
            mesg: fauxInput,
            msid: `interaction:${interaction.id}`,
        });
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
});

discord.on("messageCreate", async (msg) => {
    if (msg.author.bot) {
        return;
    }

    dispatch({
        plat: "discord",
        fief: msg.guild.name,
        chan: msg.channel.name,
        user: `<@${msg.author.id}>`,
        mesg: msg.content,
        msid: msg.id,
    });
});

process.on("exit", () => {
    discord.destroy();
});

function init(token) {
    return discord.login(token);
}

module.exports = {
    init,
};
