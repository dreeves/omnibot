// -----------------------------------------------------------------------------
const NOM = "omninom"; // name of this slash command

const packageData = require("../package.json"); // to see the version number

// Remember previous chum IDs so we can try out replying to earlier messages
let count = 0;
let chash = {};

function ordain(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

module.exports = async (sendmesg, { plat, fief, chan, user, mesg, msid, priv }) => {
  count++; // This is the count-th chum the /omninom command has received
  chash[count] = msid; 
  // hmm, but the incoming chum, at least on Discord, is not a public message in the
  // channel that can be replied to later. i think we need to remember the message ID
  // of our own response to this chum. if we want to later refer this invocation of
  // /omninom, it's the message ID of omnibot's reply we need to remember.
  
  // TODO: We want mesg to always be exactly what the user typed.
  // (Danny will finish refactoring this later.)
  mesg = `/${NOM} ${mesg}`;  // (just reconstructing it for now)
  let args = mesg.split(' ').slice(1).join(' ');
  if (args.length < 1) { args = "DEBUG-EMPTY" } // hmm, formatting breaks when ""

  const displat = (plat === "discord" ? "Discord" :
                   plat === "slack"   ? "Slack"   : plat);
  
  let outmesg = `\
This is Omnibot v${packageData.version} \
called by ${user} \
in channel #${chan} on ${displat}.\n\
You called /${NOM} with args = "\`${args}\`".\n\
This is your ${ordain(count)} call to /${NOM}.\n\
For testing, you can make args be one of the following to change how Omnibot \
replies:\n\
* whisp: Reply by DM, no one else sees that you invoked /${NOM}\n\
* holla: Echo your invocation of /${NOM}, reply publicly\n\
* blurt: No echo, reply publicly, out of the blue from others' perspective\n\
* phem: Similar to whisp but reply ephemerally in the channel\n` +
(mesg !== mesg.trim() ? `WARNING! A thing happened we thought never happens: \
\`${mesg}\` was not trimmed.` : '');

  if(priv) {
    const message = {plat, mrid: msid, mesg: outmesg}
    if (plat === "slack") {
      message.user = user;
      message.priv = true;
    }
    chash[count] = await sendmesg(message);
    console.log(`replied to /omninom command ${count} with message ${chash[count]}`);
    return chash[count]
  }

  if (args === "whisp") {
    console.log("whispering")
    // Why doesn't it work to let fief be whatever was passed in?
    //if (plat === "slack") { reply.fief = "noop" }
    const ack = "Got it. DMing you now.";
    const message = {plat, mesg: ack, mrid: msid, phem: true}
    if (plat === "slack") {
      message.chan = chan;
      message.user = user;
    }
    await sendmesg(message);
    chash[count] = await sendmesg({plat, user, mesg: outmesg, priv: true});
    console.log(`replied to /omninom command ${count} with message ${chash[count]}`);
    return chash[count];
  }

  if (args === "holla") {
    // Note that we need to also echo the invocation of the slash command.
    // In Slack there's a way to just have the user's invocation of the slash
    // command appear for everyone to see, but I'm not sure that's possible on
    // Discord. We're focusing on Discord for now...
    // This is analogous to when someone starts an auction with /bid which
    // should be publicly visible.
    outmesg = `${user}: ${mesg}\n\n${outmesg}`;
    chash[count] = await sendmesg({plat, fief, chan, mesg: outmesg, mrid: msid});
    console.log(`replied to /omninom command ${count} with message ${chash[count]}`);
    return chash[count];
  }

  if (args === "blurt") {
    const ack = "Got it. Only you see this ack but now also replying publicly.";
    const message  = {plat, fief, chan, mesg: ack, mrid: msid, phem: true};
    if (plat === "slack") {
      message.user = user;
    }
    await sendmesg(message);
    chash[count] = await sendmesg({plat, fief, chan, mesg: outmesg});
    console.log(`replied to /omninom command ${count} with message ${chash[count]}`);
    return chash[count];
  }

  if (args === "phem" || true) {
    console.log(`replying ephemerally to /omninom command ${count}`)
    const message = {plat,fief,chan, mesg:outmesg, mrid:msid, phem:true}
    if (plat === "slack") {
      message.user = user;
    }
    return await sendmesg(message);
  }
};
