const sinon = require("sinon");

const bid = require("../commands/bid.js");

describe("the bid command", function () {
    it("starts the auction", async function () {
        const sendmesg = sinon.fake();

        await bid(sendmesg, {
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
            mesg: "cool bid",
            msid: "4567",
        });

        sinon.assert.calledWithExactly(sendmesg, {
            plat: "test",
            fief: "test server",
            chan: "botspam",
            mesg: "Roger that",
            user: "<@123>",
            phem: true,
            mrid: "4567",
        });

        sinon.assert.calledWithExactly(sendmesg, {
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
            user: "<@456>",
            mesg: "another bid",
            msid: "8900",
        });

        sinon.assert.calledWithExactly(sendmesg, {
            plat: "test",
            fief: "test server",
            chan: "botspam",
            mesg: sinon.match(/Got final bid from <@456>/),
            mrid: "1234",
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
            msid: "1234",
            priv: true,
        });

        sinon.assert.calledOnceWithExactly(sendmesg, {
            plat: "discord",
            mesg: "Auctions in DMs aren't supported on Discord.",
            mrid: "1234",
            user: "<@123>",
            priv: true,
        });
    });
});
