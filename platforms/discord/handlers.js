const dispatch = require("../../dispatch.js");
const { sendmesg } = require("../../sendemitter.js");

function ready(username) {
  console.log(`Logged in to Discord as ${username}`);
}

async function interactionCreate(interactionCache, interaction) {
  if (!interaction.isChatInputCommand()) return;
  
  const command = interaction.commandName;
  const input = interaction.options.getString("input");
  
  const fauxInput = `/${command} ${input || ""}`;
  interactionCache[`interaction:${interaction.id}`] = interaction;
  
  try {
    await dispatch(sendmesg, {
      plat: "discord",
      fief: interaction.guild ? interaction.guild.name : null,
      chan: interaction.channel ? interaction.channel.name : null,
      user: `<@${interaction.user.id}>`,
      mesg: fauxInput,
      msid: `interaction:${interaction.id}`,
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: `ERROR: ${JSON.stringify(error)} -- ` +
        `probably Omnibot tried to reply to a slash command from inside a DM?`,
      ephemeral: true,
    });
  }
}

async function messageCreate(msg) {
  if (msg.author.bot) return;

  dispatch(sendmesg, {
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
