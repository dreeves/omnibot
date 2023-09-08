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

    let fakeUser;
    let fakeMessage;
    let fakeCollection = (item) => ({
        fetch: (id) => (id ? Promise.resolve(item) : Promise.resolve([item])),
    });
    let fakeChannel;
    let fakeGuild;
    let fakeClient;
    let fakeDM;
    let fakeDMChannel;
    beforeEach(function () {
        fakeMessage = { reply: sinon.fake.resolves({ id: "123" }) };
        fakeDM = { reply: sinon.fake.resolves({ id: "123" }) };
        fakeDMChannel = {
            messages: fakeCollection(fakeDM),
        };
        fakeUser = {
            send: sinon.fake.resolves({ id: "123" }),
            dmChannel: fakeDMChannel,
        };
        fakeChannel = {
            name: "botspam",
            send: sinon.fake.resolves({ id: "123" }),
            messages: fakeCollection(fakeMessage),
        };
        fakeGuild = {
            name: "testserver",
            fetch: () => Promise.resolve(fakeGuild),
            channels: fakeCollection(fakeChannel),
        };
        fakeClient = {
            guilds: fakeCollection(fakeGuild),
            users: fakeCollection(fakeUser),
        };
    });

    describe("erroneous messages", function () {
        it("rejects the wrong platform", async function () {
            const message = {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mesg: "Hello, world!",
            };
            const result = sendmesg(fakeClient, {}, message);
            return expect(result).to.be.rejectedWith(
                `Discord got erroneous platform ${message.plat}`,
            );
        });
        it("rejects a missing message", async function () {
            const message = {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
            };

            const result = sendmesg(fakeClient, {}, message);
            return expect(result).to.be.rejectedWith("Missing message!");
        });
        it("rejects ambiguity between channel message and private message", async function () {
            const message = {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                user: "<@123>",
                priv: true,
                mesg: "Hello, world!",
            };

            const result = sendmesg(fakeClient, {}, message);
            return expect(result).to.be.rejectedWith(
                "Unclear whether to send a private message!",
            );
        });
        it("rejects message that is neither a channel message nor a private message", async function () {
            const message = {
                plat: "discord",
                mesg: "Hello, world!",
            };

            const result = sendmesg(fakeClient, {}, message);
            return expect(result).to.be.rejectedWith(
                "Messages require either fief and chan or user and priv!",
            );
        });
        it("rejects fief with a missing chan", async function () {
            const message = {
                plat: "discord",
                fief: "testserver",
                mesg: "Hello, world!",
            };

            const result = sendmesg(fakeClient, {}, message);
            return expect(result).to.be.rejectedWith("Missing chan!");
        });
        it("rejects chan with a missing fief", async function () {
            const message = {
                plat: "discord",
                chan: "botspam",
                mesg: "Hello, world!",
            };

            const result = sendmesg(fakeClient, {}, message);
            return expect(result).to.be.rejectedWith("Missing fief!");
        });
        it("rejects user with a missing priv", async function () {
            const message = {
                plat: "discord",
                user: "<@123>",
                mesg: "Hello, world!",
            };

            const result = sendmesg(fakeClient, {}, message);
            return expect(result).to.be.rejectedWith("Missing priv!");
        });
        it("rejects priv with a missing user", async function () {
            const message = {
                plat: "discord",
                priv: true,
                mesg: "Hello, world!",
            };

            const result = sendmesg(fakeClient, {}, message);
            return expect(result).to.be.rejectedWith("Missing user!");
        });
    });

    describe("channel messages", function () {
        it("sends a channel message if fief and chan are present", async function () {
            const message = {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: "Hello, world!",
            };

            const result = sendmesg(fakeClient, {}, message);
            await expect(result).to.be.fulfilled;
            sinon.assert.calledWith(fakeChannel.send, {
                content: message.mesg,
            });
        });

        it("replies to a channel message if fief, chan, and mrid are present", async function () {
            const message = {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mrid: "123",
                mesg: "Hello, world!",
            };

            const result = sendmesg(fakeClient, {}, message);
            await expect(result).to.be.fulfilled;
            sinon.assert.calledWith(fakeMessage.reply, {
                content: message.mesg,
            });
        });
    });

    describe("private messages", function () {
        it("sends a private message if user and priv are present", async function () {
            const message = {
                plat: "discord",
                user: "<@123>",
                priv: true,
                mesg: "Hello, world!",
            };

            const result = sendmesg(fakeClient, {}, message);
            await expect(result).to.be.fulfilled;
            sinon.assert.calledWith(fakeUser.send, {
                content: message.mesg,
            });
        });

        it("replies to a private message if user, priv, and mrid are present", async function () {
            const message = {
                plat: "discord",
                user: "<@123>",
                priv: true,
                mrid: "123",
                mesg: "Hello, world!",
            };

            const result = sendmesg(fakeClient, {}, message);
            await expect(result).to.be.fulfilled;
            sinon.assert.calledWith(fakeDM.reply, {
                content: message.mesg,
            });
        });
    });

    describe("command replies", function () {
        it('replies to a command if mrid starts with "interaction:"', async function () {
            const message = {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mrid: "interaction:123",
                mesg: "Hello, world!",
            };

            const interaction = { reply: sinon.fake.resolves("123") };
            interactionCache[message.mrid] = interaction;
            const result = sendmesg(fakeClient, interactionCache, message);
            await expect(result).to.be.fulfilled;
            sinon.assert.calledWith(interaction.reply, {
                content: message.mesg,
            });
        });

        it("replies to a command ephemerally if phem is present", async function () {
            const message = {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mrid: "interaction:123",
                mesg: "Hello, world!",
                phem: true,
            };

            const interaction = { reply: sinon.fake.resolves("123") };
            interactionCache[message.mrid] = interaction;
            const result = sendmesg(fakeClient, interactionCache, message);
            await expect(result).to.be.fulfilled;
            sinon.assert.calledWith(interaction.reply, {
                content: message.mesg,
                ephemeral: true,
            });
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
