const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const omninom = require("../commands/omninom.js");

const packageData = require("../package.json"); // to see the version number

describe('running the command with "foo" as an argument', function () {
    it("calls sendmesg with a whisper", async function () {
        const sendmesg = sinon.fake.returns(Promise.resolve());
        let message = {
            plat: "dummy",
            fief: "dummy",
            chan: "#botspam",
            user: "<@1234>",
            mesg: "foo",
            msid: "1234",
        };
        await omninom(sendmesg, message);
        sinon.assert.calledWith(sendmesg, {
            plat: message.plat,
            fief: message.fief,
            chan: message.chan,
            mesg: sinon.match(/.*/),
            mrid: message.msid,
            phem: true,
        });
    });

    it("responds to a Slack DM with a DM", async function () {
        const sendmesg = sinon.fake.returns(Promise.resolve());
        let message = {
            plat: "slack",
            user: "<@1234>",
            mesg: "holla",
            msid: "1234",
            priv: true,
        };
        await omninom(sendmesg, message);
        sinon.assert.calledWith(sendmesg, {
            plat: message.plat,
            mrid: message.msid,
            user: message.user,
            mesg: sinon.match.string,
            priv: true,
        });
    });
});
