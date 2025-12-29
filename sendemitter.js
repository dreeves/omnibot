class ChumError extends Error {
  constructor(message) {
    super(message);
    this.name = "ChumError";
  }
}

const platforms = {};
function registerPlatform(plat, handler) { platforms[plat] = handler }

/**
 * Send a message to one of the supported platforms.
 *
 * @param {object} message - the message to send
 * @param {string} message.plat - target platform
 * @param {string} message.fief - target server or workspace
 * @param {string} message.chan - target channel
 * @param {string} message.user - username of who should see the message
 * @param {string} message.usid - userID of who should see the message
 * @param {string} message.mesg - literal content of the message
 * @param {string} message.mrid - platform-assigned ID of a message to reply to
 * @param {boolean} message.priv - whether the message should be a DM
 * @param {boolean} message.phem - whether the message should only be visible to
 * the given user
 */
async function sendmesg(msg) { return await platforms[msg.plat](msg) }

module.exports = { registerPlatform, sendmesg, ChumError };