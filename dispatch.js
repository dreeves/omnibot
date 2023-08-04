// -----------------------------------------------------------------------------
const omninom   = require("./commands/omninom.js");
const bid       = require("./commands/bid.js");
const roll      = require("./commands/roll.js");
const { lexup } = require("./lexiguess.js");

/**
 * A message and its metadata, aka "chum", for "channel / user / message".
 * @typedef {Object} Chum
 * @property {string} plat - the originating platform (like slack or discord)
 * @property {string} fief - server/workspace the message was sent in
 * @property {string} chan - channel the message was sent in
 * @property {string} user - username of the message author
 * @property {string} mesg - the exact string the user typed
 * @property {string} msid - platform-assigned ID of the message
 * @property {string} priv - whether the message was sent privately
 */

const LEXIGUESS_REGEX = /^[a-z]+$/i;
const LEXIGUESS_CHANNEL_REGEX = /^(?:botspam|games|lexi.*|spellingbee)$/;
const SLASH_COMMAND_REGEX = /^\/([a-z]+) /i;

/**
 * Route a chum to the correct handler.
 * @param {Chum} the incoming message
 */
async function dispatch(sendmesg, chum) {
  const { plat, fief, chan, user, mesg, msid, priv } = chum;
  const botIDs = [process.env.DISCORD_BOT_ID, process.env.SLACK_BOT_ID];

  // Whether Omnibot is @-mentioned in this chum.
  const mentioned = botIDs.some(rx => new RegExp(`<@${rx}(|.*)?>`).test(mesg));
  if (mentioned) {
    const ack = "Acknowledging your @-mentioning of Omnibot!";
    return await sendmesg({plat, fief, chan, mesg: ack, mrid: msid});
  }

  if (LEXIGUESS_CHANNEL_REGEX.test(chan) && LEXIGUESS_REGEX.test(mesg)) {
    const reply = lexup(chan, mesg);
    if (reply) { await sendmesg({ plat, fief, chan, mesg: reply }) }
  }
  
  const match = mesg.match(SLASH_COMMAND_REGEX);  
  if (!match) { return }     // if we make it past here, chum is a slash command

  const commandName = match[1];
  const tmp = mesg.substring(mesg.indexOf(" ")+1); // i'm about to refactor this
  switch (commandName) {
    case "omninom":
      await omninom(sendmesg, { plat, fief, chan, user, mesg:tmp, msid, priv });
      break;
    case "bid":
      await bid(sendmesg, { plat, fief, chan, user, mesg:tmp, msid, priv });
      break;
    case "roll":
      await roll(sendmesg, { plat, fief, chan, user, mesg:tmp, msid, priv });
      break;
    default:
      const err = `no command /${commandName} found`;
      console.log(err);
      await sendmesg({ ...chum, mesg: err, priv: true });
  }
}

module.exports = dispatch;