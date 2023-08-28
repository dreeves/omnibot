const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const { ChannelType } = require("discord.js");

const sendmesg = require("../platforms/discord/sendmesg");
const { interactionCreate } = require("../platforms/discord/handlers");

describe("sending a message to Discord", function () {
    const interactionCache = {};

    const fakeUser = { send: sinon.fake.resolves({ id: "123" }) };
    const fakeMessage = { reply: sinon.fake.returns({ id: "123" }) };
    const fakeCollection = (item) => ({
        fetch: (id) => (id ? Promise.resolve(item) : Promise.resolve([item])),
    });
    const fakeChannel = {
        name: "botspam",
        send: sinon.fake.resolves({ id: "123" }),
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
            expect(fakeMessage.reply.calledWith({ content: message.mesg })).to
                .be.true;
        });

        it("sends a DM if priv, user, and mesg are present", async function () {
            const message = {
                plat: "discord",
                user: "<@123>",
                priv: true,
                mesg: "Hello, world!",
            };

            await sendmesg(fakeClient, interactionCache, message);
            expect(fakeUser.send.calledWith({ content: message.mesg })).to.be
                .true;
        });

        it("sends a message in a channel if fief, chan, and mesg are present", async function () {
            const message = {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: "Hello, world!",
            };

            await sendmesg(fakeClient, interactionCache, message);
            expect(fakeChannel.send.calledWith({ content: message.mesg })).to.be
                .true;
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

            return expect(sendmesg(fakeClient, interactionCache, message)).to.be
                .rejected;
        });
    });

    describe("sending an ephemeral message", function () {
        it("replies to a message if mrid is an interaction", async function () {
            const message = {
                plat: "discord",
                mrid: "interaction:123",
                mesg: "Hello, world!",
                phem: true,
            };

            const interaction = {
                reply: sinon.fake.returns({ id: "123" }),
            };
            interactionCache[message.mrid] = interaction;
            await sendmesg(fakeClient, interactionCache, message);
            const called = interaction.reply.calledWith({
                content: message.mesg,
                ephemeral: message.phem,
            });
            expect(called).to.be.true;
        });

        it("throws an error if anything else is true", async function () {
            const message = {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mrid: "123",
                mesg: "Hello, world!",
                phem: true,
            };

            const interaction = {
                reply: sinon.fake(),
            };
            interactionCache[message.mrid] = interaction;
            await sendmesg(fakeClient, interactionCache, message);
            const called = interaction.reply.calledWith({
                content: message.mesg,
                ephemeral: message.phem,
            });
            expect(called).to.be.false;
        });
    });
});

describe("handling direct messages", function () {
    const directMessage = {
        commandName: "/bid",
        options: {
            getString: () => "Hello, world!",
        },
        user: { id: 1234 },
        id: 1234,
        isChatInputCommand: () => true,
        channel: {
            type: ChannelType.DM,
        },
    };

    it("doesn't throw an error", async function () {
        const cache = {};
        const promise = interactionCreate(cache, directMessage);

        return expect(promise).to.be.fulfilled;
    });
});
