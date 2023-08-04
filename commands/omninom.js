// -----------------------------------------------------------------------------
const NOM = "omninom"; // name of this slash command

const packageData = require("../package.json"); // to see the version number

module.exports = async (sendmesg, { plat, fief, chan, user, mesg, msid }) => {
  // TODO: mesg is getting passed in with the slash command stripped off.
  // TODO: We want mesg to always be exactly what the user typed.
  mesg = `/${NOM} ${mesg}`;
  let args = mesg.split(' ').slice(1).join(' ');
  if (args.length < 1) { args = "DEBUG-EMPTY" }

  const displat = (plat === "discord" ? "Discord" :
                   plat === "slack"   ? "Slack"   : plat);
  
  let outmesg = `\
This is Omnibot v${packageData.version} \
called by ${user} \
in channel #${chan} on ${displat}.\n\
You called /${NOM} with args = "\`${args}\`".\n\
For testing, you can make args be one of the following to change how Omnibot \
replies:\n\
* whisp: Reply by DM, no one else sees that you invoked /${NOM}\n\
* holla: Echo your invocation of /${NOM}, reply publicly\n\
* blurt: No echo, reply publicly, out of the blue from others' perspective\n\
* phem: Similar to whisp but reply ephemerally in the channel\n` +
(mesg !== mesg.trim() ? `WARNING! A thing happened we thought never happens: \
\`${mesg}\` was not trimmed.` : '');

  if (args === "whisp") {
    // Why doesn't it work to let fief be whatever was passed in?
    //if (plat === "slack") { reply.fief = "noop" }
    const ack = "Got it. DMing you now.";
    await sendmesg({plat, fief, chan, mesg: ack, mrid: msid, phem: true});
    return await sendmesg({plat, user, mesg: outmesg, priv: true});
  }

  if (args === "holla") {
    // Note that we need to also echo the invocation of the slash command.
    // In Slack there's a way to just have the user's invocation of the slash
    // command appear for everyone to see, but I'm not sure that's possible on
    // Discord. We're focusing on Discord for now...
    // This is analogous to when someone starts an auction with /bid which
    // should be publicly visible.
    outmesg = `${user}: ${mesg}\n\n${outmesg}`;
    return await sendmesg({plat, fief, chan, mesg: outmesg, mrid: msid});
  }

  if (args === "blurt") {
    const ack = "Got it. Only you see this ack but now also replying publicly.";
    await sendmesg({plat, fief, chan, mesg: ack, mrid: msid, phem: true});
    return await sendmesg({plat, fief, chan, mesg: outmesg});
  }

  if (args === "phem" || true) {
    return await sendmesg({plat,fief,chan, mesg:outmesg, mrid:msid, phem:true});
  }
};
