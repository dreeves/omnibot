const NOM = "omninom"; // name of this slash command

const packageData = require("../package.json"); // to see the version number

module.exports = ({ plat, fief, chan, user, mesg, msid }, sendmesg) => {
    let voxmode = { user, priv: true };

    if (mesg === "holla") {
        voxmode = {
            mrid: msid,
            priv: false,
        };
    }
    if (mesg === "blurt") {
        voxmode = { priv: false };
    }

    if (mesg === "phem") {
        voxmode = { phem: true, mrid: msid, user };
    }

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

    sendmesg({
        plat,
        fief,
        chan,
        user: voxmode.user,
        mesg: output,
        priv: voxmode.priv,
        mrid: voxmode.mrid,
        phem: voxmode.phem,
    });
};
