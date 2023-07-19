const Discord = require("discord.js");

const { registerPlatform } = require("../../sendemitter.js");
const sendmesg = require("./sendmesg.js");
const { ready, messageCreate, interactionCreate } = require("./handlers.js");

const discord = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
    ],
});

let interactionCache = {};

registerPlatform("discord", (message) => sendmesg(discord, message));

discord.once("ready", () => ready(discord.user.tag));

discord.on("interactionCreate", (interaction) =>
    interactionCreate(interactionCache, interaction)
);

discord.on("messageCreate", messageCreate);

process.on("exit", () => {
    discord.destroy();
});

function init(token) {
    return discord.login(token);
}

module.exports = {
    init,
};
