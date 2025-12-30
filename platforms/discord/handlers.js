const CLOG = console.log;
const { ChannelType } = require("discord.js");
const dispatch = require("../../dispatch.js");
const { sendmesg } = require("../../sendemitter.js");
const { LEXIGUESS_REGEX, LEXIGUESS_CHANNEL_REGEX } = dispatch;

function ready(username) { console.log(`Logged in to Discord as ${username}`) }

async function interactionCreate(interactionCache, interaction) {
  if (!interaction.isChatInputCommand()) return;
  const input = interaction.options.getString("input") || "";

  const user = interaction.member?.displayName ?? interaction.user.username;
  const usid = `<@${interaction.user.id}>`;
  CLOG(`DEBUG1: ${user}/${usid} ${interaction.commandName} ${input}`);

  interactionCache[`interaction:${interaction.id}`] = interaction;
  CLOG(`DEBUG2: interaction = ${interaction}`);
  // For some reason interaction.channel is null when user is an unclaimed
  // account on Discord and the message they're sending is a DM to the bot.
  const channel = interaction.channel;
  CLOG(`DEBUG3: channel = ${channel}`);
  const ctype = channel?.type ?? null;
  const tmp = {
    plat: "discord",
    fief: interaction.guild?.name,   // will be null for DMs
    chan: interaction.channel?.name, // ditto
    // Guild (server) nickname if it exists, otherwise account username:
    user: interaction.member?.displayName ?? interaction.user.username,
    usid: `<@${interaction.user.id}>`,
    mesg: `/${interaction.commandName}${input==="" ? "" : " "}${input}`,
    msid: `interaction:${interaction.id}`,
    priv: ctype === null || ctype === ChannelType.DM,
  };
  CLOG(`DEBUG4: dispatching ${JSON.stringify(tmp)}`);
  await dispatch(sendmesg, {
    plat: "discord",
    fief: interaction.guild?.name,   // will be null for DMs
    chan: interaction.channel?.name, // ditto
    chid: interaction.channel?.id,
    //cid: interaction.channel?.id, // cruft from GPT-5.2
    // Guild (server) nickname if it exists, otherwise account username:
    user: interaction.member?.displayName ?? interaction.user.username,
    usid: `<@${interaction.user.id}>`,
    mesg: `/${interaction.commandName}${input==="" ? "" : " "}${input}`,
    msid: `interaction:${interaction.id}`,
    priv: ctype === null || ctype === ChannelType.DM,
  });
}

async function messageCreate(msg) {
  if (msg.author.bot) return;

  // GPT-5.2 added this but i'm guessing it belongs in dispatch.js
  if (
    msg.guild &&
    msg.channel.type === ChannelType.GuildText &&
    LEXIGUESS_CHANNEL_REGEX.test(msg.channel.name) &&
    LEXIGUESS_REGEX.test(msg.content)
  ) {
    const thread = await msg.startThread({
      // thread name can't have spaces i guess? oh right, the channel regex
      name: `lexiguess-for-${msg.content.toLowerCase()}`,
      autoArchiveDuration: 60,
    });
    return dispatch(sendmesg, {
      plat: "discord",
      fief: msg.guild.name,
      chan: thread.name,
      chid: thread.id,
      cid: thread.id,
      user: msg.member?.displayName ?? msg.author.username,
      usid: `<@${msg.author.id}>`,
      mesg: msg.content,
      msid: msg.id,
      priv: false,
    });
  }

  dispatch(sendmesg, {
    plat: "discord",
    fief: msg.guild?.name,   // will be null for DMs
    chan: msg.channel?.name, // ditto
    chid: msg.channel?.id,
    //cid: msg.channel?.id,
    user: msg.member?.displayName ?? msg.author.username,
    usid: `<@${msg.author.id}>`,
    mesg: msg.content,
    msid: msg.id,
    priv: msg.channel.type === ChannelType.DM,
  });
}

module.exports = { ready, messageCreate, interactionCreate };