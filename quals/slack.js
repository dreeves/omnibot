const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const sendmesg = require("../platforms/slack/sendmesg");

describe("sending a message to Slack", function () {
    const commandCache = {};

    const chatAPI = {
        postEphemeral: Promise.resolve(),
        postMessage: Promise.resolve(),
    };
    const fakeClient = {
        chat: chatAPI,
    };

    describe("erroneous messages", function () {
        it("rejects the wrong platform", async function () {
            const message = {
                plat: "discord",
                chan: "botspam",
                mesg: "Hello, world!",
            };

            const result = sendmesg(fakeClient, commandCache, message);
            return expect(result).to.be.rejectedWith(
                `Slack got erroneous platform ${message.plat}`,
            );
        });
        it("rejects a missing message", async function () {
            const message = {
                plat: "slack",
                chan: "botspam",
            };

            const result = sendmesg(fakeClient, commandCache, message);
            return expect(result).to.be.rejectedWith("Missing message!");
        });
        it("rejects missing user for priv", async function () {
            const message = {
                plat: "slack",
                mesg: "Hello, world!",
                priv: true,
            };

            const result = sendmesg(fakeClient, commandCache, message);
            return expect(result).to.be.rejectedWith("Missing target user!");
        });
        it("rejects missing user for phem", async function () {
            const message = {
                plat: "slack",
                mesg: "Hello, world!",
                phem: true,
            };

            const result = sendmesg(fakeClient, commandCache, message);
            return expect(result).to.be.rejectedWith("Missing target user!");
        });
        it("rejects ambiguity between channel messages and private messages", async function () {
            const message = {
                plat: "slack",
                mesg: "Hello, world!",
                chan: "botspam",
                user: "<@123>",
                priv: true,
            };

            const result = sendmesg(fakeClient, commandCache, message);
            return expect(result).to.be.rejectedWith(
                "Unclear whether to send a private message!",
            );
        });
    });

    describe("sending a channel message", function () {
        it("sends a message in a channel if chan, and mesg are present", async function () {
            const message = {
                plat: "slack",
                chan: "botspam",
                mesg: "Hello, world!",
            };

            chatAPI.postMessage = sinon.fake.resolves();
            await sendmesg(fakeClient, commandCache, message);

            sinon.assert.calledWith(chatAPI.postMessage, {
                channel: message.chan,
                text: message.mesg,
            });
        });

        it("sends an ephemeral message if phem and user are present", async function () {
            const message = {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mesg: "Hello, world!",
                user: "<@U123>",
                phem: true,
            };

            chatAPI.postEphemeral = sinon.fake.resolves();
            await sendmesg(fakeClient, commandCache, message);
            sinon.assert.calledWith(chatAPI.postEphemeral, {
                user: "U123",
                channel: message.chan,
                text: message.mesg,
            });
        });

        it("replies to a message if chan, mrid, and mesg are present", async function () {
            const message = {
                plat: "slack",
                chan: "botspam",
                mrid: "123",
                mesg: "Hello, world!",
            };

            chatAPI.postMessage = sinon.fake.resolves();
            await sendmesg(fakeClient, commandCache, message);
            sinon.assert.calledWith(chatAPI.postMessage, {
                thread_ts: message.mrid,
                channel: message.chan,
                text: message.mesg,
            });
        });

        it("replies to a message ephemerally if chan, mrid, user, phem, and mesg are present", async function () {
            const message = {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mrid: "123",
                mesg: "Hello, world!",
                user: "<@U123>",
                phem: true,
            };

            chatAPI.postEphemeral = sinon.fake.resolves();
            await sendmesg(fakeClient, commandCache, message);
            sinon.assert.calledWith(chatAPI.postEphemeral, {
                user: "U123",
                thread_ts: message.mrid,
                channel: message.chan,
                text: message.mesg,
            });
        });
    });

    describe("sending a private message", function () {
        it("sends a DM if priv, user, and mesg are present", async function () {
            const message = {
                plat: "slack",
                user: "<@U123>",
                priv: true,
                mesg: "Hello, world!",
            };

            chatAPI.postMessage = sinon.fake.resolves();
            await sendmesg(fakeClient, commandCache, message);

            sinon.assert.calledWith(chatAPI.postMessage, {
                text: message.mesg,
                channel: "U123",
                user: "U123",
            });
        });

        it("won't send an ephemeral DM", async function () {
            const message = {
                plat: "slack",
                fief: "testserver",
                user: "<@U123>",
                priv: true,
                mesg: "Hello, world!",
                phem: true,
            };

            return expect(sendmesg(fakeClient, commandCache, message)).to.be
                .rejected;
        });

        it("replies to a message if chan, mrid, and mesg are present", async function () {
            const message = {
                plat: "slack",
                user: "<@U123>",
                mrid: "123",
                priv: true,
                mesg: "Hello, world!",
            };

            chatAPI.postMessage = sinon.fake.resolves();
            await sendmesg(fakeClient, commandCache, message);

            sinon.assert.calledWith(chatAPI.postMessage, {
                thread_ts: message.mrid,
                text: message.mesg,
                channel: "U123",
                user: "U123",
            });
        });
    });
});
