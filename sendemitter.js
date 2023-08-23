const platforms = {};

function registerPlatform(plat, handler) {
    platforms[plat] = handler;
}

/**
 * Send a message to one of the supported platforms.
 *
 * @param {object} message - the message to send
 * @param {string} message.plat - target platform
 * @param {string} message.fief - target server or workspace
 * @param {string} message.chan - target channel
 * @param {string} message.user - user who should see the message
 * @param {string} message.mesg - literal content of the message
 * @param {string} message.mrid - platform-assigned id of a message to reply
 * to
 * @param {boolean} message.priv - whether the message should be a DM
 * @param {boolean} message.phem - whether the message should only be visible
 * to the given user
 */
async function sendmesg(message) {
    return await platforms[message.plat](message);
}

module.exports = {
    registerPlatform,
    sendmesg,
};
