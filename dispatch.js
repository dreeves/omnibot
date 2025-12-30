const omninom = require("./commands/omninom.js");
const omnecho = require("./commands/omnecho.js");
const bid     = require("./commands/bid.js");
const roll    = require("./commands/roll.js");
const lexup   = require("./lexiguess.js");
const CLOG = console.log;

/**
 * A message and its metadata, aka "chum", for "channel / user / message".
 * @typedef {Object} Chum
 * @property {string} plat - the originating platform (like slack or discord)
 * @property {string} fief - server/workspace the message was sent in
 * @property {string} chan - channel the message was sent in
 * @property {string} chid - channel ID (or thread ID) the message was sent in
 * @property {string} user - username of the message author
 * @property {string} usid - user ID of the message author
 * @property {string} mesg - the exact string the user typed
 * @property {string} msid - platform-assigned ID of the message
 * @property {string} priv - whether the message was sent privately
 */

const LEXIGUESS_REGEX = /^[a-z]+$/i; // Lexiguess responds to single words...
const LEXIGUESS_CHANNEL_REGEX =      // ...in certain channels.
  /^(?:botspam|games|lexi.*|spellingbee|gambol.*)$/;
const SLASH_COMMAND_REGEX = /^\/([a-z]+) ?/i;

/**
 * Route a chum to the correct handler.
 * @param {Chum} the incoming channel/user/message
 */
async function dispatch(sendmesg, chum) {
  let { plat, fief, chan, chid, user, usid, mesg, msid, priv } = chum;
  const botIDs = [process.env.DISCORD_CLIENT_ID, 
                  process.env.SLACK_CLIENT_ID];

  // Would this be cleaner if each slash command handler or module/game like
  // Lexiguess got invoked with the chum? Each thing could first test if the
  // chum is applicable for it and return if not. There's no difference
  // computationally. One advantage could be if we ever wanted more than one
  // module to fire for a given chum.

  // Whether Omnibot is @-mentioned in this chum:
  if (botIDs.some(rx => new RegExp(`<@${rx}(|.*)?>`).test(mesg))) {
    //CLOG(`Omnibot was @-mentioned in ${plat} ${fief} ${chan} by ${user}`);
    let ack = `Acknowledging your @-mentioning of Omnibot`;
    await sendmesg({plat,fief, chan,chid, mesg:ack, mrid:msid}); // holla-style
    ack = `\
Acknowledging your @-mentioning of Omnibot just now in ${fief} #${chan}. \
This is for debugging purposes for now.`;
    await sendmesg({plat, user, usid, mesg: ack, priv: true}); // DM
    // return // it's possible something has an @-mention AND is a slash command
  }

  // Whether this is a word Lexiguess can respond to:
  if (LEXIGUESS_CHANNEL_REGEX.test(chan) && LEXIGUESS_REGEX.test(mesg)) {
    const reply = lexup(chid, mesg);
    if (reply) await sendmesg({ plat, fief, chan, chid, mesg: reply })
  }
  const match = mesg.match(SLASH_COMMAND_REGEX);
  if (!match) { return }     // if we make it past here, chum is a slash command
  const cmd = match[1];
  // Currently we're throwing away the slash command part but we want to 
  // refactor this so that mesg is exactly what the user typed. Then the 
  // individual commands can pull out just the args if they want.
  //const origmesg = mesg;
  //mesg = mesg.substring(mesg.indexOf(" ")+1);
  //CLOG(`DEBUG-DISPATCH: /${cmd} command; mesg "${origmesg}" -> "${mesg}"`);
  //CLOG(`DEBUG-DISPATCH: /${cmd} invoked by ${user}/${usid}: "${mesg}"`);
  chum = { plat, fief, chan, user, usid, mesg, msid, priv };
  if      (cmd === 'omninom') await omninom(sendmesg, chum);
  else if (cmd === 'omnecho') await omnecho(sendmesg, chum);
  else if (cmd === 'bid')     await bid(sendmesg, chum);
  else if (cmd === 'roll')    await roll(sendmesg, chum);
  else { // probably this can't actually happen
    const err = `ERROR: no command /${cmd} found`;
    CLOG(err);
    await sendmesg({plat,fief, chan,chid, mesg:err, mrid:msid}) // channel reply
    await sendmesg({plat, user, usid, mesg: err, priv: true}); // DM reply
  }
}

// TODO: refactor so this is all handled here, not in sendmesg.js
dispatch.LEXIGUESS_REGEX = LEXIGUESS_REGEX;
dispatch.LEXIGUESS_CHANNEL_REGEX = LEXIGUESS_CHANNEL_REGEX;

module.exports = dispatch;