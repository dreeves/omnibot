const Discord = require("discord.js");

const dispatch = require("../dispatch.js");
const { registerPlatform } = require("../sendemitter.js");

const discord = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
    ],
});

async function sendmesg({ fief, chan, mesg }) {
    const guilds = await discord.guilds.fetch();
    let guild = guilds.find((g) => g.name === fief);
    guild = await guild.fetch();

    const channels = await guild.channels.fetch();
    const channel = channels.find((c) => c.name === chan);

    await channel.send(mesg);
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

    await interaction.reply({ content: "running", ephemeral: true });

    try {
        dispatch({
            plat: "discord",
            fief: interaction.guild.name,
            chan: interaction.channel.name,
            user: `<@${interaction.user.id}>`,
            mesg: `/${command} ${input || ""}`,
            msid: interaction.id,
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
