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

    let commandReply = {
        plat,
        fief,
        chan,
        mesg: "Roger that",
        phem: true,
        mrid: msid,
    };

    if (mesg === "phem") {
        commandReply.mesg = mesg;

        return await sendmesg(commandReply);
    }

    if (mesg === "holla") {
        return await sendmesg({
            plat,
            fief,
            chan,
            mesg: output,
            mrid: msid,
        });
    }

    await sendmesg(commandReply);

    if (mesg === "blurt") {
        await sendmesg({
            plat,
            fief,
            chan,
            mesg: output,
        });
    } else {
        const reply = {
            plat,
            mesg: output,
            user,
            priv: true,
        };
        if (plat === "slack") {
            reply.fief = "noop";
        }
        await sendmesg(reply);
    }
};
