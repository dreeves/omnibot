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
            user: "<@1234>",
            mesg: "whisp",
            msid: "interaction:1234",
        },
        output: [
            {
                plat: "slack",
                mesg: sinon.match.string,
                phem: true,
                mrid: "interaction:1234",
            },
            {
                plat: "slack",
                priv: true,
                user: "<@1234>",
                mesg: sinon.match.string,
            },
        ],
    },
    {
        desc: "replies to whisp via DM (DM message)",
        input: {
            plat: "slack",
            priv: true,
            user: "<@1234>",
            mesg: "whisp",
            msid: "interaction:1234",
        },
        output: [
            {
                plat: "slack",
                mesg: sinon.match.string,
                user: "<@1234>",
                priv: true,
                mrid: "interaction:1234",
            },
        ],
    },
];

describe("running /omninom on Discord", function () {
    let interactionCache = {};

    before(async function () {
        registerPlatform("discord", (message) =>
            discordSendmesg(DiscordFake, interactionCache, message),
        );
    });

    afterEach(async function () {
        sinon.restore();
    });

    discordExpectations.forEach((exp) => {
        it(exp.desc, async function () {
            const sendmesg = sinon.fake.resolves();
            await omninom(sendmesg, exp.input);

            exp.output.forEach((out) => sinon.assert.calledWith(sendmesg, out));
        });

        it(`${exp.desc} without error`, async function () {
            const promise = omninom(sendmesg, exp.input);
            return expect(promise).to.be.fulfilled;
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
        it(exp.desc, async function () {
            const sendmesg = sinon.fake.resolves();
            await omninom(sendmesg, exp.input);

            exp.output.forEach((out) => sinon.assert.calledWith(sendmesg, out));
        });

        it(`${exp.desc} without error`, async function () {
            const promise = omninom(sendmesg, exp.input);
            return expect(promise).to.be.fulfilled;
        });
    });
});
