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

    describe("sending a non-ephemeral message", function () {
        it("replies to a message if fief, chan, mrid, and mesg are present", async function () {
            const message = {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mrid: "123",
                mesg: "Hello, world!",
            };

            chatAPI.postMessage = sinon.fake.resolves();
            await sendmesg(fakeClient, commandCache, message);
            expect(
                chatAPI.postMessage.calledWith({
                    thread_ts: message.mrid,
                    channel: message.chan,
                    text: message.mesg,
                }),
            ).to.be.true;
        });

        it("sends a DM if fief, priv, user, and mesg are present", async function () {
            const message = {
                plat: "slack",
                fief: "testserver",
                user: "<@U123>",
                priv: true,
                mesg: "Hello, world!",
            };

            chatAPI.postMessage = sinon.fake.resolves();
            await sendmesg(fakeClient, commandCache, message);
            expect(
                chatAPI.postMessage.calledWith({
                    thread_ts: undefined,
                    channel: "U123",
                    text: message.mesg,
                }),
            ).to.be.true;
        });

        it("sends a message in a channel if fief, chan, and mesg are present", async function () {
            const message = {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mesg: "Hello, world!",
            };

            chatAPI.postMessage = sinon.fake.resolves();
            await sendmesg(fakeClient, commandCache, message);
            expect(
                chatAPI.postMessage.calledWith({
                    thread_ts: undefined,
                    channel: message.chan,
                    text: message.mesg,
                }),
            ).to.be.true;
        });

        it("throws an error if anything else is true", async function () {
            const message = {
                plat: "slack",
                user: "<@123>",
                priv: true,
                mesg: "Hello, world!",
                fief: "testserver",
                chan: "botspam",
                mesg: "Hello, world!",
            };

            return expect(sendmesg(fakeClient, commandCache, message)).to.be
                .rejected;
        });
    });

    describe("sending an ephemeral message", function () {
        it("replies to a message if fief, chan, mrid, and mesg are present", async function () {
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
            expect(
                chatAPI.postEphemeral.calledWith({
                    user: "U123",
                    thread_ts: message.mrid,
                    channel: message.chan,
                    text: message.mesg,
                }),
            ).to.be.true;
        });

        it("won't send a DM", async function () {
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

        it("sends a message in a channel if fief, chan, and mesg are present", async function () {
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
            expect(
                chatAPI.postEphemeral.calledWith({
                    user: "U123",
                    thread_ts: undefined,
                    channel: message.chan,
                    text: message.mesg,
                }),
            ).to.be.true;
        });

        it("throws an error if the user is missing", async function () {
            const message = {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mesg: "Hello, world!",
                phem: true,
            };

            return expect(sendmesg(fakeClient, commandCache, message)).to.be
                .rejected;
        });
    });
});
