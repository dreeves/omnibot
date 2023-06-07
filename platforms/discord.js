const Discord = require("discord.js");

const { lexup } = require("../lexiguess.js");

const discord = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
    ],
});

discord.commands = new Discord.Collection();

discord.once("ready", () => {
    console.log(
        `Omnibot is running; logged in to Discord as ${discord.user.tag}`
    );
});
discord.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        );
        return;
    }

    try {
        await command.execute(interaction);
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

    const cid = msg.channel.name; // string identifier for this server/channel
    const usaid = msg.content;
    if (!/^[a-z]{2,}$/i.test(usaid)) return; // DRY up this regex
    if (!/^(?:botspam|games|lexi.*|spellingbee)$/.test(cid)) return;
    const reply = lexup(cid, usaid);
    if (reply !== null) await msg.reply(reply);
});

module.exports = discord;
