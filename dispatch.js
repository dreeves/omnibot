const omninom = require("./commands/omninom.js");
const bid = require("./commands/bid.js");
const roll = require("./commands/roll.js");
const { lexup } = require("./lexiguess.js");
const { sendmesg } = require("./sendemitter.js");

/**
 * A message and its metadata from one of the supported chat
 * platforms.
 * @typedef {Object} Message
 * @property {string} plat - the originating platform
 * @property {string} serv - server the message was sent in
 * @property {string} chan - channel the message was sent in
 * @property {string} user - username of the message author
 * @property {string} mesg - literal content of the message
 * @property {string} msid - platform-assigned id of the message
 * @property {string} priv - whether the message was sent privately
 */

const LEXIGUESS_REGEX = /^[a-z]+$/i;
const LEXIGUESS_CHANNEL_REGEX = /^(?:botspam|games|lexi.*|spellingbee)$/;
const SLASH_COMMAND_REGEX = /^\/([a-z]+) /i;

/**
 * Send a message to the correct handler.
 * @param {Message} message - received message
 */
async function dispatch(message) {
    const { plat, fief, chan, user, mesg, msid, priv } = message;

    if (!LEXIGUESS_CHANNEL_REGEX.test(chan)) {
        return;
    }

    if (/(^|\W)@omnibot($|\W)/.test(mesg)) {
        await sendmesg({
            plat,
            fief,
            chan,
            user,
            mesg: "Hey there!",
            mrid: msid,
        });

        return;
    }

    if (LEXIGUESS_REGEX.test(mesg)) {
        const reply = lexup(chan, mesg);
        if (reply) {
            await sendmesg({ plat, fief, chan, mesg: reply });
        }
    }

    const match = mesg.match(SLASH_COMMAND_REGEX);

    if (!match) {
        return;
    }

    const commandName = match[1];
    const commandInput = mesg.substring(mesg.indexOf(" ") + 1);
    switch (commandName) {
        case "omninom":
            await omninom({
                plat,
                fief,
                chan,
                user,
                mesg: commandInput,
                msid,
                priv,
            });
            break;
        case "bid":
            await bid({
                plat,
                fief,
                chan,
                user,
                mesg: commandInput,
                msid,
                priv,
            });
            break;
        case "roll":
            await roll({
                plat,
                fief,
                chan,
                user,
                mesg: commandInput,
                msid,
                priv,
            });
            break;
        default:
            console.log(`no command /${commandName} found`);
            await sendmesg({
                ...message,
                mesg: `no command \`/${commandName}\` found`,
                priv: true,
            });
    }
}

module.exports = dispatch;
