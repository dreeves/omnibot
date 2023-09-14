const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const DiscordFake = require("./fakes/discord.js");
const SlackFake = require("./fakes/slack.js");
const omninom = require("../commands/omninom.js");
const { sendmesg, registerPlatform } = require("../sendemitter.js");

const discordSendmesg = require("../platforms/discord/sendmesg.js");
const slackSendmesg = require("../platforms/slack/sendmesg.js");

const packageData = require("../package.json"); // to see the version number

const discordExpectations = [
    {
        desc: "replies to whisp via DM (channel message)",
        input: {
            plat: "discord",
            fief: "testserver",
            chan: "botspam",
            user: "<@1234>",
            mesg: "whisp",
            msid: "interaction:1234",
        },
        output: [
            {
                plat: "discord",
                mesg: sinon.match.string,
                fief: "testserver",
                chan: "botspam",
                phem: true,
                mrid: "interaction:1234",
            },
            {
                plat: "discord",
                priv: true,
                user: "<@1234>",
                mesg: sinon.match.string,
            },
        ],
    },
    {
        desc: "replies to whisp via DM (DM message)",
        input: {
            plat: "discord",
            priv: true,
            user: "<@1234>",
            mesg: "whisp",
            msid: "interaction:1234",
        },
        output: [
            {
                plat: "discord",
                mesg: sinon.match.string,
                user: "<@1234>",
                priv: true,
                mrid: "interaction:1234",
            },
        ],
    },
];

const slackExpectations = [
    {
        desc: "replies to whisp via DM (channel message)",
        input: {
            plat: "slack",
            fief: "testserver",
            chan: "botspam",
            user: "<@U1234>",
            mesg: "whisp",
            msid: "command:1234",
        },
        output: [
            {
                plat: "slack",
                fief: "testserver",
                chan: "botspam",
                mesg: sinon.match.string,
                phem: true,
                user: "<@U1234>",
                mrid: "command:1234",
            },
            {
                plat: "slack",
                priv: true,
                user: "<@U1234>",
                mesg: sinon.match.string,
            },
        ],
    },
    {
        desc: "replies to whisp via DM (DM message)",
        input: {
            plat: "slack",
            priv: true,
            user: "<@U1234>",
            mesg: "whisp",
            msid: "command:1234",
        },
        output: [
            {
                plat: "slack",
                mesg: sinon.match.string,
                user: "<@U1234>",
                priv: true,
                mrid: "command:1234",
            },
        ],
    },
];

describe("running /omninom on Discord", function () {
    let interactionCache = {};

    before(async function () {
        registerPlatform("discord", (message) =>
            discordSendmesg(DiscordFake.client, interactionCache, message),
        );
    });

    afterEach(async function () {
        sinon.restore();
    });

    discordExpectations.forEach((exp) => {
        interactionCache[exp.input.msid] = {
            reply: function () {
                this.replied = true;
                return Promise.resolve({ id: "123" });
            },
            followUp: () => Promise.resolve({ id: "123" }),
            replied: false,
        };
        it(exp.desc, async function () {
            const sendmesg = sinon.fake.resolves();
            await omninom(sendmesg, exp.input);

            exp.output.forEach((out) => sinon.assert.calledWith(sendmesg, out));
        });

        it(`${exp.desc} without error`, async function () {
            await omninom(sendmesg, exp.input);
        });
    });
});

describe("running /omninom on Slack", function () {
    let interactionCache = {};

    before(async function () {
        registerPlatform("slack", (message) =>
            slackSendmesg(SlackFake, interactionCache, message),
        );
    });

    afterEach(async function () {
        sinon.restore();
    });

    slackExpectations.forEach((exp) => {
        interactionCache[exp.input.msid] = () => Promise.resolve();
        it(exp.desc, async function () {
            const sendmesg = sinon.fake.resolves();
            await omninom(sendmesg, exp.input);

            exp.output.forEach((out) => sinon.assert.calledWith(sendmesg, out));
        });

        it(`${exp.desc} without error`, async function () {
            await omninom(sendmesg, exp.input);
        });
    });
});
