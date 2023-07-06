const platforms = {};

function registerPlatform(plat, handler) {
    platforms[plat] = handler;
}

async function sendmesg(message) {
    await platforms[message.plat](message);
}

module.exports = {
    registerPlatform,
    sendmesg,
};
