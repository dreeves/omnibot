const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const proxyquire = require("proxyquire");
proxyquire.noPreserveCache();

let bid = require("../commands/bid.js");

describe("the bid command", function () {
    beforeEach(() => {
        bid = proxyquire("../commands/bid.js", {});
    });

    it("starts the auction", async function () {
        const sendmesg = sinon.fake();

        const result = bid(sendmesg, {
            plat: "test",
            fief: "test server",
            chan: "botspam",
            user: "<@123>",
            mesg: "vote on lunch with <@456>",
            msid: "1234",
        });

        sinon.assert.calledOnceWithExactly(sendmesg, {
            plat: "test",
            fief: "test server",
            chan: "botspam",
            mesg: "Auction started! Got bids from {}, waiting on {<@456>, <@123>}",
            mrid: "1234",
        });
    });

    it("quietly receives bids", async function () {
        const sendmesg = sinon.fake();

        await bid(sendmesg, {
            plat: "test",
            fief: "test server",
            chan: "botspam",
            user: "<@123>",
            mesg: "vote on lunch with <@456>",
            msid: "1234",
        });

        await bid(sendmesg, {
            plat: "test",
            fief: "test server",
            chan: "botspam",
            user: "<@123>",
            mesg: "cool bid",
            msid: "4567",
        });

        sinon.assert.calledWith(sendmesg, {
            plat: "test",
            mesg: "Roger that",
            user: "<@123>",
            phem: true,
            mrid: "4567",
        });

        sinon.assert.calledWith(sendmesg, {
            plat: "test",
            fief: "test server",
            chan: "botspam",
            mesg: "New bid from <@123>! Got bids from {<@123>}, waiting on {<@456>}",
        });
    });

    it("replies to the original command with the results", async function () {
        const sendmesg = sinon.fake();

        await bid(sendmesg, {
            plat: "test",
            fief: "test server",
            chan: "botspam",
            user: "<@123>",
            mesg: "vote on lunch with <@456>",
            msid: "1234",
        });

        await bid(sendmesg, {
            plat: "test",
            fief: "test server",
            chan: "botspam",
            user: "<@123>",
            mesg: "cool bid",
            msid: "4567",
        });

        await bid(sendmesg, {
            plat: "test",
            fief: "test server",
            chan: "botspam",
            user: "<@456>",
            mesg: "another bid",
            msid: "8900",
        });

        sinon.assert.calledWith(sendmesg, {
            plat: "test",
            fief: "test server",
            chan: "botspam",
            mesg: sinon.match(/Got final bid from <@456>/),
            mrid: "1234",
        });
    });

    it("doesn't reply to the original command on Slack", async function () {
        const sendmesg = sinon.fake();

        await bid(sendmesg, {
            plat: "slack",
            fief: "test server",
            chan: "botspam",
            user: "<@123>",
            mesg: "vote on lunch with <@456>",
            msid: "1234",
        });

        await bid(sendmesg, {
            plat: "slack",
            fief: "test server",
            chan: "botspam",
            user: "<@123>",
            mesg: "cool bid",
            msid: "command:4567",
        });

        await bid(sendmesg, {
            plat: "slack",
            fief: "test server",
            chan: "botspam",
            user: "<@456>",
            mesg: "another bid",
            msid: "8900",
        });

        sinon.assert.calledWith(sendmesg, {
            plat: "slack",
            fief: "test server",
            chan: "botspam",
            mesg: sinon.match.string,
        });
    });
});

describe("auctions in DMs", function () {
    it("not supported on Discord", async function () {
        const sendmesg = sinon.fake();

        await bid(sendmesg, {
            plat: "discord",
            user: "<@123>",
            mesg: "vote on lunch with <@456>",
            msid: "interaction:1234",
            priv: true,
        });

        sinon.assert.calledOnceWithExactly(sendmesg, {
            plat: "discord",
            mesg: sinon.match.string,
            mrid: "interaction:1234",
        });
    });
});
