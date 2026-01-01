const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised.default);

const proxyquire = require("proxyquire");
proxyquire.noPreserveCache();

let bid = require("../commands/bid.js");
const store = require("../store.js");
const { sendmesg, registerPlatform } = require("../sendemitter.js");
const discordSendmesg = require("../platforms/discord/sendmesg.js");
const slackSendmesg = require("../platforms/slack/sendmesg.js");
const DiscordFake = require("./fakes/discord.js");
const SlackFake = require("./fakes/slack.js");

const discordExpectations = [
  {
    desc: "fails loudly on invalid mention syntax",
    input: [
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid vote on lunch with <@!456>",
        msid: "interaction:1234",
      },
    ],
    output: [
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        mesg:
          "/bid vote on lunch with <@!456>\n" +
          "Invalid @-mention <@!456>. Expected <@ID> exactly.",
        phem: true,
        mrid: "interaction:1234",
      },
    ],
  },
  {
    desc: "runs an auction",
    input: [
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid vote on lunch with <@456>",
        msid: "interaction:1234",
      },
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid foo",
        msid: "interaction:5678",
      },
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        user: "<@456>",
        usid: "<@456>",
        mesg: "/bid bar",
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
        usid: "<@123>",
        mesg: "/bid vote on lunch with <@456>",
        msid: "interaction:1234",
      },
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid abort",
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
        usid: "<@123>",
        mesg: "/bid foo",
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
  {
    desc: "prints help information",
    input: [
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid help",
        msid: "interaction:5678",
      },
    ],
    output: [
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        mesg:
          "How to use /bid:\n" +
          "* `/bid stuff with @-mentions`\tStart new auction with the mentioned people\n" +
          "* `/bid stuff`\tSubmit your bid (fine to resubmit till last person bids)\n" +
          "* `/bid status`\tShow how current auction was initiated and who has bid\n" +
          "* `/bid abort`\tAbort the current auction, showing partial results\n" +
          "* `/bid help`\tShow this help (see doc.bmndr.co/sealedbids for gory details)",
        phem: true,
        mrid: "interaction:5678",
      },
    ],
  },
  {
    desc: "prints status information",
    input: [
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid status",
        msid: "interaction:5678",
      },
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid vote on lunch with <@456>",
        msid: "interaction:1234",
      },
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid status",
        msid: "interaction:9000",
      },
    ],
    output: [
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        mesg: "No current auction",
        phem: true,
        mrid: "interaction:5678",
      },
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
        mesg:
          "Currently active auction initiated by <@123> via:\n" +
          "/bid vote on lunch with <@456>\nGot bids from {}, waiting on {<@456>, <@123>}",
        mrid: "interaction:9000",
      },
    ],
  },
  {
    desc: "blocks mentions in bids",
    input: [
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid vote on lunch with <@456>",
        msid: "interaction:1234",
      },
      {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid foo <@1456>",
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
        mesg: "No @-mentions allowed in bids! Try `/bid help`",
        phem: true,
        mrid: "interaction:5678",
      },
    ],
  },
];

const slackExpectations = [
  {
    desc: "fails loudly on invalid mention syntax",
    input: [
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid vote on lunch with <@!456>",
        msid: "command:1234",
      },
    ],
    output: [
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        mesg:
          "/bid vote on lunch with <@!456>\n" +
          "Invalid @-mention <@!456>. Expected <@ID> exactly.",
        user: "<@123>",
        phem: true,
        mrid: "command:1234",
      },
    ],
  },
  {
    desc: "runs an auction",
    input: [
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid vote on lunch with <@456>",
        msid: "command:1234",
      },
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid foo",
        msid: "command:5678",
      },
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        user: "<@456>",
        usid: "<@456>",
        mesg: "/bid bar",
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
        mesg: "<@123>: `/bid foo`",
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
        usid: "<@123>",
        mesg: "/bid vote on lunch with <@456>",
        msid: "command:1234",
      },
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid abort",
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
        usid: "<@123>",
        mesg: "/bid foo",
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
  {
    desc: "prints help information",
    input: [
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid help",
        msid: "command:5678",
      },
    ],
    output: [
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        mesg:
          "How to use /bid:\n" +
          "* `/bid stuff with @-mentions`\tStart new auction with the mentioned people\n" +
          "* `/bid stuff`\tSubmit your bid (fine to resubmit till last person bids)\n" +
          "* `/bid status`\tShow how current auction was initiated and who has bid\n" +
          "* `/bid abort`\tAbort the current auction, showing partial results\n" +
          "* `/bid help`\tShow this help (see doc.bmndr.co/sealedbids for gory details)",
        user: "<@123>",
        phem: true,
        mrid: "command:5678",
      },
    ],
  },
  {
    desc: "prints status information",
    input: [
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid status",
        msid: "command:5678",
      },
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid vote on lunch with <@456>",
        msid: "command:1234",
      },
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid status",
        msid: "command:9000",
      },
    ],
    output: [
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        mesg: "No current auction",
        user: "<@123>",
        phem: true,
        mrid: "command:5678",
      },
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
        mesg:
          "Currently active auction initiated by <@123> via:\n" +
          "/bid vote on lunch with <@456>\nGot bids from {}, waiting on {<@456>, <@123>}",
        mrid: "command:9000",
      },
    ],
  },
  {
    desc: "blocks mentions in bids",
    input: [
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid vote on lunch with <@456>",
        msid: "command:1234",
      },
      {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        user: "<@123>",
        usid: "<@123>",
        mesg: "/bid foo <@1456>",
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
        mesg: "No @-mentions allowed in bids! Try `/bid help`",
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
    store.clear();
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

      // The old assertion used `sinon.assert.calledWith(sendmesg.getCall(idx), ...)`.
      // That passes a call object where Sinon expects a spy, producing misleading
      // failures. It should be safe to delete, but per agent rules we keep it.
      // exp.output.forEach((out, idx) =>
      //   sinon.assert.calledWith(sendmesg.getCall(idx), out),
      // );

      sinon.assert.callCount(sendmesg, exp.output.length);
      exp.output.forEach((out, idx) => {
        const actual = sendmesg.getCall(idx).args[0];
        sinon.assert.match(actual, out);
      });
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
    store.clear();
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

      // The old assertion used `sinon.assert.calledWith(sendmesg.getCall(idx), ...)`.
      // That passes a call object where Sinon expects a spy, producing misleading
      // failures. It should be safe to delete, but per agent rules we keep it.
      // exp.output.forEach((out, idx) =>
      //   sinon.assert.calledWith(sendmesg.getCall(idx), out),
      // );

      sinon.assert.callCount(sendmesg, exp.output.length);
      exp.output.forEach((out, idx) => {
        const actual = sendmesg.getCall(idx).args[0];
        sinon.assert.match(actual, out);
      });
    });

    it(`${exp.desc} without error`, async function () {
      await Promise.all(exp.input.map((inpt) => bid(sendmesg, inpt)));
    });
  });
});
