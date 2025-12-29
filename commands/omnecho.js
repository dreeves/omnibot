const NOM = "omnecho"; // name of this slash command

// unDRY: so far this is copied from commands/omninom.js

const CLOG = console.log;

module.exports = async (sendmesg, 
                        { plat, fief, chan, user, usid, mesg, msid, priv }) => {

  let args = mesg.split(' ').slice(1).join(' '); // what user typed after cmd

  const displatform = (plat === "discord" ? `Discord` :
                       plat === "slack"   ? `Slack`   : plat);
  const dispmedium = (
    !chan && !fief && usid &&  priv ? `private DM` :
     chan &&  fief && usid && !priv ? 
    `channel #${chan} on the ${fief} ${displatform}` :
    `[ERROR: Unexpected combo:\
 chan=${chan} fief=${fief} usid=${usid} priv=${priv}]`);
  
  if(priv) {
    const message = {plat, user, usid, priv, mrid: msid, mesg: args};
    CLOG(`replying to /${NOM}`);
    return await sendmesg(message);
  }


  if (args === "holla") {
    // Note that we need to also echo the invocation of the slash command.
    // In Slack there's a way to just have the user's invocation of the slash
    // command appear for everyone to see, but I'm not sure that's possible on
    // Discord. We're focusing on Discord for now...
    // This is analogous to when someone starts an auction with /bid which
    // should be publicly visible.
    outmesg = `${usid}: ${mesg}\n\n${outmesg}`;
    const message = {plat, fief, chan, mesg: outmesg, mrid: msid};
    chash[count] = await sendmesg(message);
    CLOG(`replied to /${NOM} command ${count} with message ${chash[count]}`);
    return chash[count];
  }

  if (args === "blurt") {
    // First ack the slash command invocation, which on Discord we have to do
    // else we get an ugly "The application did not respond" in the channel.
    const ack = `${usid}: ${mesg}`;
    const message  = {plat, fief, chan, mesg: ack, mrid: msid, phem: true};
    if (plat === "slack") { message.user = usid }
    await sendmesg(message);
    chash[count] = await sendmesg({plat, fief, chan, mesg: outmesg});
    CLOG(`replied to /${NOM} command ${count} with message ${chash[count]}`);
    return chash[count];
  }

};
