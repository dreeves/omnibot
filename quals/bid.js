const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const proxyquire = require("proxyquire");
proxyquire.noPreserveCache();

let bid = require("../commands/bid.js");
const { sendmesg, registerPlatform } = require("../sendemitter.js");
const discordSendmesg = require("../platforms/discord/sendmesg.js");
const slackSendmesg = require("../platforms/slack/sendmesg.js");
const DiscordFake = require("./fakes/discord.js");
const SlackFake = require("./fakes/slack.js");

const discordExpectations = [
    {
        desc: "runs an auction",
        input: [
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                user: "<@123>",
                mesg: "vote on lunch with <@456>",
                msid: "interaction:1234",
            },
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                user: "<@123>",
                mesg: "foo",
                msid: "interaction:5678",
            },
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                user: "<@456>",
                mesg: "bar",
                msid: "interaction:9000",
            },
        ],
        output: [
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: "Auction started! Got bids from {}, waiting on {<@456>, <@123>}",
                mrid: "interaction:1234",
            },
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: sinon.match.string,
                phem: true,
                mrid: "interaction:5678",
            },
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: "New bid from <@123>! Got bids from {<@123>}, waiting on {<@456>}",
            },
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: sinon.match.string,
                phem: true,
                mrid: "interaction:9000",
            },
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: sinon.match.string,
                mrid: "123",
            },
        ],
    },
    {
        desc: "aborts an auction",
        input: [
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                user: "<@123>",
                mesg: "vote on lunch with <@456>",
                msid: "interaction:1234",
            },
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                user: "<@123>",
                mesg: "abort",
                msid: "interaction:5678",
            },
        ],
        output: [
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: "Auction started! Got bids from {}, waiting on {<@456>, <@123>}",
                mrid: "interaction:1234",
            },
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: sinon.match.string,
                phem: true,
                mrid: "interaction:5678",
            },
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: sinon.match.string,
                mrid: "123",
            },
        ],
    },
    {
        desc: "warns of no current auction",
        input: [
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                user: "<@123>",
                mesg: "foo",
                msid: "interaction:5678",
            },
        ],
        output: [
            {
                plat: "discord",
                fief: "testserver",
                chan: "botspam",
                mesg: "/bid foo\nNo current auction! Try `/bid help`",
                phem: true,
                mrid: "interaction:5678",
            },
        ],
    },
];

const slackExpectations = [
    {
        desc: "runs an auction",
        input: [
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                user: "<@123>",
                mesg: "vote on lunch with <@456>",
                msid: "command:1234",
            },
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                user: "<@123>",
                mesg: "foo",
                msid: "command:5678",
            },
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                user: "<@456>",
                mesg: "bar",
                msid: "command:9000",
            },
        ],
        output: [
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mesg: "Auction started! Got bids from {}, waiting on {<@456>, <@123>}",
                mrid: "command:1234",
            },
            {
                plat: "slack",
                mesg: "Roger that",
                user: "<@123>",
                phem: true,
                mrid: "command:5678",
                fief: "testserver",
                chan: "botspam",
            },
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mesg: "New bid from <@123>! Got bids from {<@123>}, waiting on {<@456>}",
            },
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mesg: sinon.match.string,
                mrid: "command:9000",
            },
        ],
    },
    {
        desc: "aborts an auction",
        input: [
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                user: "<@123>",
                mesg: "vote on lunch with <@456>",
                msid: "command:1234",
            },
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                user: "<@123>",
                mesg: "abort",
                msid: "command:5678",
            },
        ],
        output: [
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mesg: "Auction started! Got bids from {}, waiting on {<@456>, <@123>}",
                mrid: "command:1234",
            },
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mesg: sinon.match.string,
                mrid: "command:5678",
            },
        ],
    },
    {
        desc: "warns of no current auction",
        input: [
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                user: "<@123>",
                mesg: "foo",
                msid: "command:5678",
            },
        ],
        output: [
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mesg: "/bid foo\nNo current auction! Try `/bid help`",
                user: "<@123>",
                phem: true,
                mrid: "command:5678",
            },
        ],
    },
];

describe("running /bid on Discord", function () {
    let interactionCache = {};

    before(async function () {
        registerPlatform("discord", (message) =>
            discordSendmesg(DiscordFake.client, interactionCache, message),
        );
    });

    beforeEach(() => {
        bid = proxyquire("../commands/bid.js", {});
    });

    afterEach(async function () {
        sinon.restore();
    });

    discordExpectations.forEach((exp) => {
        exp.input.forEach(({ msid }) => {
            interactionCache[msid] = {
                reply: function () {
                    this.replied = true;
                    return Promise.resolve("123");
                },
                followUp: () => Promise.resolve("123"),
                replied: false,
            };
        });

        it(exp.desc, async function () {
            const sendmesg = sinon.fake.resolves("123");

            for (const inpt of exp.input) {
                await bid(sendmesg, inpt);
            }

            exp.output.forEach((out, idx) =>
                sinon.assert.calledWith(sendmesg.getCall(idx), out),
            );
        });

        it(`${exp.desc} without error`, async function () {
            await Promise.all(exp.input.map((inpt) => bid(sendmesg, inpt)));
        });
    });
});

describe("running /bid on Slack", function () {
    let interactionCache = {};

    before(async function () {
        registerPlatform("slack", (message) =>
            slackSendmesg(SlackFake, interactionCache, message),
        );
    });

    beforeEach(() => {
        bid = proxyquire("../commands/bid.js", {});
    });

    afterEach(async function () {
        sinon.restore();
    });

    slackExpectations.forEach((exp) => {
        exp.input.forEach(({ msid }) => {
            interactionCache[msid] = () => Promise.resolve();
        });

        it(exp.desc, async function () {
            const sendmesg = sinon.fake.resolves();

            for (const inpt of exp.input) {
                await bid(sendmesg, inpt);
            }

            exp.output.forEach((out, idx) =>
                sinon.assert.calledWith(sendmesg.getCall(idx), out),
            );
        });

        it(`${exp.desc} without error`, async function () {
            await Promise.all(exp.input.map((inpt) => bid(sendmesg, inpt)));
        });
    });
});
