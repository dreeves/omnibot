const Discord = require("discord.js");

const dispatch = require("../dispatch.js");

const discord = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
    ],
});

async function sendmesg({ serv, chan, mrid, user, mesg }) {
    const guild = discord.guilds.cache.find((g) => g.id === serv);
    const channel = guild.channels.cache.find((c) => c.name === chan);

    if (mrid) {
        await channel.messages
            .fetch(mrid)
            .then(async (message) => await message.reply(mesg));
    } else {
        await channel.send(mesg);
    }
}

function maybePriv(interaction) {
    const command = interaction.commandName;
    const input = interaction.options.getString("input");

    return async (message) => {
        if (message.priv) {
            await interaction.followUp({
                content: message.mesg,
                ephemeral: message.priv,
            });
        } else if (message.mrid === interaction.id) {
            await interaction.followUp(`/${command} ${input || ""}`);
            await interaction.followUp(message.mesg);
        } else {
            sendmesg(message);
        }
    };
}

discord.once("ready", () => {
    console.log(
        `Omnibot is running; logged in to Discord as ${discord.user.tag}`
    );
});

discord.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;
    const input = interaction.options.getString("input");

    await interaction.deferReply({ ephemeral: true });

    try {
        dispatch(
            {
                plat: "discord",
                serv: interaction.guildId,
                chan: interaction.channel.name,
                user: `<@${interaction.user.id}>`,
                mesg: `/${command} ${input || ""}`,
                msid: interaction.id,
            },
            maybePriv(interaction)
        );
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

    dispatch(
        {
            plat: "discord",
            serv: msg.guildId,
            chan: msg.channel.name,
            user: `<@${msg.author.id}>`,
            mesg: msg.content,
            msid: msg.id,
        },
        sendmesg
    );
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
