const NOM = "omninom"; // name of this slash command
const CLOG = console.log;
const { version } = require("../package.json");
const { ordain } = require('../util.js');
const botid = process.env.DISCORD_CLIENT_ID; // for @-mentioning omnibot
// -----------------------------------------------------------------------------

// Remember previous chum IDs so we can try out replying to earlier messages
let count = 0;
let chash = {};

async function omninom(sendmesg, chum) {
  const { plat, fief, chan, user, usid, mesg, msid, priv } = chum;

  count++; // This is the count-th chum this slash command has received
  //chash[count] = msid; 
  // Problem: The incoming chum, at least on Discord when invoking a slash
  // command, is not a public message in the channel and thus cannot be replied
  // to later. We need to remember the message ID of the bot's response (what 
  // we're generating here) to this chum.
  
  let args = mesg.split(' ').slice(1).join(' '); // what user typed after cmd
  CLOG(`DEBUG/ASSERT: "/${NOM} ${args}" === "${mesg}"`); // actual assert?

  const displatform = (plat === "discord" ? `Discord` :
                       plat === "slack"   ? `Slack`   : 
                       plat === "web"     ? `Web`     : plat);
  const dispmedium = (
    !chan && !fief && usid &&  priv                    ? `private DM` :
    plat === 'web' && chan === 'web' && fief === 'web' ? `the web UI` :
    chan &&  fief && usid && !priv                     ? `channel #${chan} on `
      + `the ${fief} ${displatform}` : // eg "the Beeminder Discord"
    `[ERROR: Unexpected combo:\
 chan=${chan} fief=${fief} usid=${usid} priv=${priv}]`);
  
  let outmesg = `\
This is Omnibot version ${version}.
User ${user} (${usid}) called /${NOM}${priv ? " " : " publicly "}in \
${dispmedium} with ${args.length < 1 ? "no args" : "args = \`" + args + "\`"}.
This is the ${ordain(count)} call to /${NOM} since Omnibot last rebooted.
[IDs for debugging: msid=${msid}, usid=\`${usid}\`.]
For testing, call /${NOM} with one of the following to change how Omnibot \
replies:
* \`whisp\`: Reply by DM, no one else sees that you invoked /${NOM}
* \`ephem\`: Similar to whisp but reply ephemerally/privately in the channel
* \`holla\`: Echo your invocation of /${NOM}, reply publicly (holler back)
* \`blurt\`: No echo, reply publicly, out of the blue from others' perspective
(The default response mode if you don't specify any of those is \`ephem\`.)
`;

  if (args === "whisp" && priv) {
    outmesg += `
(Note: You invoked /${NOM} in a DM to Omnibot so only \`whisp\` mode actually \
makes sense.)`;
    const message = {plat, user, usid, priv, mrid: msid, mesg: outmesg};
    chash[count] = await sendmesg(message);
  } else if (args === "whisp") {
    //CLOG("whispering");
    // Why doesn't it work to let fief be whatever was passed in?
    //if (plat === "slack") { reply.fief = "noop" }
    const ack = `${usid}: ${mesg}\n<@${botid}> DM'd you :white_check_mark:`;
    const message = {plat, fief, chan, mesg: ack, mrid: msid, phem: true}
    // shouldn't the following line be in convert-command.js or something?
    if (plat === "slack") { message.user = usid }
    await sendmesg(message); // ephemeral ack, then full reply as DM
    chash[count] = await sendmesg({plat, user, usid, mesg:outmesg, priv:true});
    //CLOG(`replied to /${NOM} command ${count} with message ${chash[count]}`);
  } else if (args === "holla" && priv) {
    outmesg = `\
${usid}: ${mesg}

${outmesg}
(Note: You invoked /${NOM} in a DM to Omnibot so \`holla\` mode \
doesn't quite make sense.)`;
    const message = {plat, user, usid, priv, mrid: msid, mesg: outmesg};
    chash[count] = await sendmesg(message);
  } else if (args === "holla") {
    // Note that we need to also echo the invocation of the slash command.
    // In Slack there's a way to just have the user's invocation of the slash
    // command appear for everyone to see, but I'm not sure that's possible on
    // Discord. We're focusing on Discord for now.
    // This is like when someone starts an auction with /bid where it should be
    // publicly visible in the channel exactly what they typed to invoke it.
    outmesg = `${usid}: ${mesg}\n\n${outmesg}`;
    const message = {plat, fief, chan, mesg: outmesg, mrid: msid};
    chash[count] = await sendmesg(message);
    //CLOG(`replied to /${NOM} command ${count} with message ${chash[count]}`);
  } else if (args === "blurt" && priv) {
    outmesg += `
(Note: You invoked /${NOM} in a DM to Omnibot so \`blurt\` mode doesn't \
quite make sense.)`;
    // unDRY warning with the normal blurt case below
    // First ack the slash command invocation, which on Discord we have to do
    // else we get an ugly "The application did not respond" in the channel.
    const ack = `${usid}: ${mesg}`;
    let message  = {plat, user, usid, priv, mrid:msid, mesg:ack, phem:true};
    if (plat === "slack") { message.user = usid }
    await sendmesg(message);
    message = { plat, user, usid, priv, mrid: msid, mesg: outmesg };
    chash[count] = await sendmesg(message);
  } else if (args === "blurt") {
    // First ack the slash command invocation, which on Discord we have to do
    // else we get an ugly "The application did not respond" in the channel.
    const ack = `${usid}: ${mesg}`;
    const message  = {plat, fief, chan, mesg: ack, mrid: msid, phem: true};
    if (plat === "slack") { message.user = usid }
    await sendmesg(message);
    chash[count] = await sendmesg({plat, fief, chan, mesg: outmesg});
    //CLOG(`replied to /${NOM} command ${count} with message ${chash[count]}`);
  } else if (priv) {
    const message = {plat, user, usid, priv, mrid:msid, mesg:outmesg, phem:true}
    if (plat === "slack") { message.user = usid }
    chash[count] = await sendmesg(message);
  } else {
    const message = {plat, fief, chan, mesg:outmesg, mrid:msid, phem:true};
    if (plat === "slack") { message.user = usid }
    chash[count] = await sendmesg(message);
  }
  return chash[count]
}

module.exports = omninom; // elsewhere do const omninom = require('./omninom')