const { ChumError } = require("../../sendemitter.js");
const { MessageFlags } = require("discord.js");

function mentionToID(mention) {
  const match = mention.match(/^<@(.*)>$/);
  if (match) {
    return match[1];
  } else {
    throw new ChumError(`Invalid mention: {mention}`);
  }
}

// Not sure we should need to specify priv. Specifying a user implies it's a DM.
async function sendmesg(client, interactionCache, message) {
  const { plat, fief, chan, chid, usid, mesg, mrid, phem, priv } = message;

  if (plat !== "discord")
    throw new ChumError(`Um, sir, this is a Discord (not a ${plat})`);
  if (!mesg) { throw new ChumError("Missing message!") }
  if (!(!fief && !chan && usid && priv) && !(fief && chan && !usid && !priv))
    throw new ChumError(`Must specify fief&chan XOR user&priv. Called with: \
fief=${fief}, chan=${chan}, usid=${usid}, priv=${priv}`);

  let target;
  let funcName;
  let payload = { content: mesg };

  if (mrid && mrid.startsWith("interaction:")) {
    const interaction = interactionCache[mrid];
    if (phem) { payload.flags = MessageFlags.Ephemeral }
    target = interaction;

    if (interaction.replied) { funcName = "followUp" } 
    else                     { funcName = "reply" }
  // seeming spaghetti-throwing from GPT-5.2:
  } else if (chid) {
    const channel = await client.channels.fetch(chid);
    if (mrid) {
      const message = await channel.messages.fetch(mrid);
      target = message;
      funcName = "reply";
    } else {
      target = channel;
      funcName = "send";
    }
  } else if (usid && priv) {
    const userId = mentionToID(usid);
    const userObj = await client.users.fetch(userId);

    if (mrid) {
      const channel = userObj.dmChannel;
      const message = await channel.messages.fetch(mrid);
      target = message;
      funcName = "reply";
    } else {
      target = userObj;
      funcName = "send";
    }
  } else if (fief && chan) {
    const guilds = await client.guilds.fetch();
    let guild = guilds.find((g) => g.name === fief);
    guild = await guild.fetch();

    const channels = await guild.channels.fetch();
    const channel = channels.find((c) => c.name === chan);
    if (!channel) {
      throw new ChumError(`No channel "${chan}" in guild "${fief}"`);
      // sus stuff from GPT-5.2:
      //const activeThreads = await guild.channels.fetchActiveThreads();
      //channel = activeThreads.threads.find((t) => t.name === chan);
    }

    if (mrid) {
      const message = await channel.messages.fetch(mrid);
      target = message;
      funcName = "reply";
    } else {
      target = channel;
      funcName = "send";
    }
  }

  if (target && funcName) {
    let sent = await target[funcName](payload);
    if (target.fetchReply) { sent = await target.fetchReply() }
    return sent.id;
  } else { throw new ChumError("Ambiguous message!") }
}

module.exports = sendmesg;
