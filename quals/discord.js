const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const sendmesg = require("../platforms/discord/sendmesg");

describe("sending a message to Discord", function () {
    const interactionCache = {};

    const fakeUser = { send: sinon.fake.resolves() };
    const fakeMessage = { reply: sinon.fake() };
    const fakeCollection = (item) => ({
        fetch: (id) => (id ? Promise.resolve(item) : Promise.resolve([item])),
    });
    const fakeChannel = {
        name: "botspam",
        send: sinon.fake.resolves(),
        messages: fakeCollection(fakeMessage),
    };
    const fakeGuild = {
        name: "testserver",
        fetch: () => Promise.resolve(fakeGuild),
        channels: fakeCollection(fakeChannel),
    };

    const fakeClient = {
        guilds: fakeCollection(fakeGuild),
        users: fakeCollection(fakeUser),
    };

    describe("sending a non-ephemeral message", function () {
        it("replies to a message if fief, chan, mrid, and mesg are present", async function () {
            const message = {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mrid: "123",
                mesg: "Hello, world!",
            };

            await sendmesg(fakeClient, interactionCache, message);
            expect(fakeMessage.reply.calledWith(message.mesg)).to.be.true;
        });

        it("sends a DM if priv, user, and mesg are present", async function () {
            const message = {
                plat: "discord",
                user: "<@123>",
                priv: true,
                mesg: "Hello, world!",
            };

            await sendmesg(fakeClient, interactionCache, message);
            expect(fakeUser.send.calledWith(message.mesg)).to.be.true;
        });

        it("sends a message in a channel if fief, chan, and mesg are present", async function () {
            const message = {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: "Hello, world!",
            };

            await sendmesg(fakeClient, interactionCache, message);
            expect(fakeChannel.send.calledWith(message.mesg)).to.be.true;
        });

        it("throws an error if anything else is true", async function () {
            const message = {
                plat: "discord",
                user: "<@123>",
                priv: true,
                mesg: "Hello, world!",
                fief: "testserver",
                chan: "botspam",
                mesg: "Hello, world!",
            };

            expect(sendmesg(fakeClient, interactionCache, message)).to.be
                .rejected;
        });
    });

    describe("sending an ephemeral message", function () {
        xit("replies to a message if mrid is an interaction", function () {});

        xit("throws an error if anything else is true", function () {});
    });
});
