const NOM = "omnecho"; // name of this slash command
//const CLOG = console.log;

async function omnecho(sendmesg, chum) {
  const { plat, fief, chan, user, usid, mesg, msid, priv } = chum;
  let args = mesg.split(' ').slice(1).join(' '); // what user typed after cmd

  if(priv) {
    const message = {plat, user, usid, priv, mrid: msid, mesg: args};
    return await sendmesg(message)
  }

  // First ack the slash command invocation, which on Discord we have to do
  // else we get an ugly "The application did not respond" in the channel.
  const ack = `${usid}: ${mesg}`;
  const message  = {plat, fief, chan, mesg: ack, mrid: msid, phem: true};
  if (plat === "slack") { message.user = usid }
  await sendmesg(message); // ephemeral reply to acknowledge the command

  // Separate message sent to channel from bot consisting of what the user typed
  return await sendmesg({plat, fief, chan, mesg: args});
};

module.exports = omnecho;