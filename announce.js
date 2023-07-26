const { version } = require("./package.json");
const ANNOUNCE_USER_IDS = ["298617884664528896", "376112731478163466"];

async function announceVersion(sendmesg) {
    for (let userId of ANNOUNCE_USER_IDS) {
        await sendmesg({
            plat: "discord",
            user: `<@${userId}>`,
            mesg: "New version of omnibot launched: " + version,
            priv: true,
        });
    }
}

module.exports = announceVersion;
