const platforms = {};

function registerPlatform(plat, handler) {
    platforms[plat] = handler;
}

async function sendMessage(message) {
    await platforms[message.plat](message);
}

module.exports = {
    registerPlatform,
    sendMessage,
};
