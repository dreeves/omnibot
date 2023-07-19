const dispatch = require("../../dispatch.js");

function ready(username) {
    console.log(`Omnibot is running; logged in to Discord as ${username}`);
}

async function interactionCreate(interactionCache, interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;
    const input = interaction.options.getString("input");

    const fauxInput = `/${command} ${input || ""}`;
    interactionCache[`interaction:${interaction.id}`] = interaction;

    try {
        await dispatch({
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
}

async function messageCreate(msg) {
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
}

module.exports = {
    ready,
    messageCreate,
    interactionCreate,
};
