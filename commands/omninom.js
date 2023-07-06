const { sendmesg } = require("../sendemitter.js");
const NOM = "omninom"; // name of this slash command

const packageData = require("../package.json"); // to see the version number

module.exports = async ({ plat, fief, chan, user, mesg, msid }) => {
    let output =
        `\
This is Omnibot v${packageData.version} \
called by ${user} \
in channel #${chan} on ${plat}.\n\
You called /${NOM} with arg1 = "\`${mesg}\`".\n\
For testing, you can make arg1 be "whisp", "holla", or "blurt" and /omninom \
will use that as the voxmode for this reply.\n\
Debugging factoid: ` +
        (mesg === mesg.trim()
            ? "If arg1 had leading or trailing whitespace, it got trimmed before Omnibot " +
              "saw it."
            : "Interestingly, arg1's whitespace was not trimmed before Omnibot saw it.");

    if (mesg === "holla") {
        await sendmesg({
            plat,
            fief,
            chan,
            mesg: output,
            mrid: msid,
        });
    } else if (mesg === "blurt") {
        await sendmesg({
            plat,
            fief,
            chan,
            mesg: output,
        });
    } else if (mesg === "phem") {
        let message = {
            plat,
            fief,
            chan,
            mesg: output,
            phem: true,
        };
        if (plat === "discord") {
            message.mrid = msid;
        } else if (plat === "slack") {
            message.user = user;
        }
        await sendmesg(message);
    } else {
        await sendmesg({
            plat,
            mesg: output,
            user,
            priv: true,
        });
    }
};
