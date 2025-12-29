const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised.default);

const sendmesg = require("../platforms/slack/sendmesg");
const SlackFake = require("./fakes/slack.js");

describe("sending a message to Slack", function () {
  afterEach(() => {
    sinon.restore();
  });

  describe("erroneous messages", function () {
    it("rejects the wrong platform", async function () {
      const message = {
        plat: "discord",
        chan: "botspam",
        mesg: "Hello, world!",
      };

      const result = sendmesg(SlackFake, {}, message);
      return expect(result).to.be.rejectedWith(
        `Slack got erroneous platform ${message.plat}`,
      );
    });
    it("rejects a missing message", async function () {
      const message = {
        plat: "slack",
        chan: "botspam",
      };

      const result = sendmesg(SlackFake, {}, message);
      return expect(result).to.be.rejectedWith("Missing message!");
    });
    it("rejects missing user for priv", async function () {
      const message = {
        plat: "slack",
        mesg: "Hello, world!",
        priv: true,
      };

      const result = sendmesg(SlackFake, {}, message);
      return expect(result).to.be.rejectedWith("Missing target user!");
    });
    it("rejects missing user for phem", async function () {
      const message = {
        plat: "slack",
        mesg: "Hello, world!",
        phem: true,
      };

      const result = sendmesg(SlackFake, {}, message);
      return expect(result).to.be.rejectedWith("Missing target user!");
    });
    it("rejects ambiguity between channel messages and private messages", async function () {
      const message = {
        plat: "slack",
        mesg: "Hello, world!",
        chan: "botspam",
        user: "<@123>",
        priv: true,
      };

      const result = sendmesg(SlackFake, {}, message);
      return expect(result).to.be.rejectedWith(
        "Unclear whether to send a private message!",
      );
    });
    it("does not support replying to messages", async function () {
      const message = {
        plat: "slack",
        chan: "botspam",
        mrid: "123",
        mesg: "Hello, world!",
      };

      const result = sendmesg(SlackFake, {}, message);
      return expect(result).to.be.rejectedWith(
        "Replies are not supported on Slack",
      );
    });
  });

  describe("sending a channel message", function () {
    it("sends a message in a channel if chan, and mesg are present", async function () {
      const message = {
        plat: "slack",
        chan: "botspam",
        mesg: "Hello, world!",
      };

      await sendmesg(SlackFake, {}, message);

      sinon.assert.calledWith(SlackFake.chat.postMessage, {
        channel: "123",
        text: message.mesg,
      });
    });

    it("sends an ephemeral message if phem and user are present", async function () {
      const message = {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        mesg: "Hello, world!",
        user: "<@U123>",
        phem: true,
      };

      await sendmesg(SlackFake, {}, message);
      sinon.assert.calledWith(SlackFake.chat.postEphemeral, {
        user: "U123",
        channel: "123",
        text: message.mesg,
      });
    });

    it('replies to a command if mrid starts with "command:"', async function () {
      const message = {
        plat: "slack",
        chan: "botspam",
        mrid: "command:123",
        mesg: "Hello, world!",
      };

      const ack = sinon.fake.resolves();
      const commandCache = {
        "command:123": ack,
      };
      await sendmesg(SlackFake, commandCache, message);
      sinon.assert.calledWith(ack, {
        response_type: "in_channel",
        text: message.mesg,
      });
    });

    it('replies to a command ephemerally if mrid starts with "command:"and phem is present', async function () {
      const message = {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        mrid: "command:123",
        mesg: "Hello, world!",
        user: "<@U123>",
        phem: true,
      };

      const ack = sinon.fake.resolves();
      const commandCache = {
        "command:123": ack,
      };
      await sendmesg(SlackFake, commandCache, message);
      sinon.assert.calledWith(ack, {
        response_type: "ephemeral",
        text: message.mesg,
      });
    });
  });

  describe("sending a private message", function () {
    it("sends a DM if priv, user, and mesg are present", async function () {
      const message = {
        plat: "slack",
        user: "<@U123>",
        priv: true,
        mesg: "Hello, world!",
      };

      await sendmesg(SlackFake, {}, message);

      sinon.assert.calledWith(SlackFake.chat.postMessage, {
        text: message.mesg,
        channel: "U123",
        user: "U123",
      });
    });

    it("won't send an ephemeral DM", async function () {
      const message = {
        plat: "slack",
        fief: "testserver",
        user: "<@U123>",
        priv: true,
        mesg: "Hello, world!",
        phem: true,
      };

      return expect(sendmesg(SlackFake, {}, message)).to.be.rejected;
    });
  });
});
