const { sendMessage } = require("./sendemitter.js");

async function sendmesg(message) {
    await sendMessage(message);
}

module.exports = sendmesg;
