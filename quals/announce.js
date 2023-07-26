const sinon = require("sinon");
const announceVersion = require("../announce.js");

describe("announce()", function () {
    it("only sends private messages", async function () {
        const sendmesg = sinon.fake.resolves();
        await announceVersion(sendmesg);

        sinon.assert.alwaysCalledWith(sendmesg, sinon.match.has("priv", true));
    });
    it("only sends messages to the correct users", async function () {
        const sendmesg = sinon.fake.resolves();
        await announceVersion(sendmesg);

        sinon.assert.alwaysCalledWith(
            sendmesg,
            sinon.match
                .has("user", "<@298617884664528896>")
                .or(sinon.match.has("user", "<@376112731478163466>"))
        );
    });
});
