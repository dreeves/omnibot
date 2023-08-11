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
  const priv = !interaction.channel;

  await dispatch(sendmesg, {
    plat: "discord",
    fief: interaction.guild?.name,
    chan: interaction.channel?.name,
    user: `<@${interaction.user.id}>`,
    mesg: fauxInput,
    msid: `interaction:${interaction.id}`,
    priv,
  });
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
