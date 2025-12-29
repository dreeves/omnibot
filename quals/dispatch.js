const dispatch = require("../dispatch.js");
const sinon = require("sinon");

describe("dispatch()", function () {
  describe("calling known commands", function () {
    it("should ack a /bid command", async function () {
      const sendmesg = sinon.fake.resolves();
      await dispatch(sendmesg, {
        plat: "discord",
        fief: "123",
        chan: "botspam",
        user: "<@123>",
        mesg: "/bid test",
        msid: "123",
      });
      sinon.assert.calledWith(sendmesg, sinon.match.has("mrid", "123"));
    });

    it("should ack an /omninom command", async function () {
      const sendmesg = sinon.fake.resolves();
      await dispatch(sendmesg, {
        plat: "discord",
        fief: "123",
        chan: "botspam",
        user: "<@123>",
        mesg: "/omninom test",
        msid: "123",
      });
      sinon.assert.calledWith(sendmesg, sinon.match.has("mrid", "123"));
    });

    it("should ack a /roll command", async function () {
      const sendmesg = sinon.fake.resolves();
      await dispatch(sendmesg, {
        plat: "discord",
        fief: "123",
        chan: "botspam",
        user: "<@123>",
        mesg: "/roll test",
        msid: "123",
      });
      sinon.assert.calledWith(sendmesg, sinon.match.has("mrid", "123"));
    });
  });
});
