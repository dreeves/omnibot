const omninom = require("../commands/omninom.js");

const packageData = require("../package.json"); // to see the version number

const { expect } = require("chai");

function expectSendmesg(message) {
    return (plat, serv, chan, user, mesg, priv, mrid) => {
        expect(plat).to.equal(message.plat);
        expect(serv).to.equal(message.serv);
        expect(chan).to.equal(message.chan);
        expect(user).to.equal(message.user);
        expect(mesg).to.equal(message.mesg);
        expect(priv).to.equal(message.priv);
        expect(mrid).to.equal(message.mrid);
    };
}

describe('running the command with "foo" as an argument', function () {
    it("calls sendmesg with a whisper", function () {
        let message = {
            plat: "dummy",
            serv: "dummy",
            chan: "#botspam",
            user: "<@1234>",
            mesg: "foo",
            msid: "1234",
        };
        let output = `\
This is Omnibot v${packageData.version} \
called by ${message.user} \
in channel #${message.chan} on ${message.plat}.\n\
You called /omninom with arg1 = "\`${message.mesg}\`".\n\
For testing, you can make arg1 be "whisp", "holla", or "blurt" and /omninom \
will use that as the voxmode for this reply.\n\
Debugging factoid: If arg1 had leading or trailing whitespace,\
 it got trimmed before Omnibot saw it.`;
        omninom(
            message,
            expectSendmesg({ ...message, mesg: output, priv: true })
        );
    });
});
