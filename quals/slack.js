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

// Replicata: In Slack, open Omnibot's Home tab, so Slack fires app_home_opened.
// Expectata: Omnibot publishes its Home tab view for that user (views.publish).
// Resultata: The app_home_opened listener rejects with "ReferenceError:
// homeHandler is not defined" and nothing is published.
describe("opening Omnibot's Home tab in Slack", function () {
  const proxyquire = require("proxyquire");

  // Load platforms/slack/index.js against a stand-in for Bolt. Return the
  // event listeners it registers and the fake Slack client it was handed.
  function loadSlackApp() {
    const listeners = {};
    const client = { views: { publish: sinon.fake.resolves() } };
    class App {
      constructor() { this.client = client }
      command() {}
      message() {}
      event(name, listener) { (listeners[name] ??= []).push(listener) }
    }
    class ExpressReceiver {}
    proxyquire("../platforms/slack/index.js", {
      "@slack/bolt": { App, ExpressReceiver, "@noCallThru": true },
      "../../sendemitter.js": { registerPlatform() {} },
    });
    return { listeners, client };
  }

  // Open the Home tab as the given Slack user; return the views.publish fake
  async function openHomeTab(user) {
    const { listeners, client } = loadSlackApp();
    await listeners.app_home_opened[0]({
      event: { user },
      context: { botToken: "xoxb-fake" },
    });
    return client.views.publish;
  }

  it("publishes the home view for the user who opened it", async function () {
    const publish = await openHomeTab("U123");
    sinon.assert.calledOnce(publish);
    sinon.assert.calledWithMatch(publish, {
      user_id: "U123",
      view: { type: "home" },
    });
  });

  it("publishes for whichever user opened the tab", async function () {
    const publish = await openHomeTab("U999");
    sinon.assert.calledWithMatch(publish, { user_id: "U999" });
  });

  it("publishes with the bot token from the event's context", async function () {
    const publish = await openHomeTab("U123");
    sinon.assert.calledWithMatch(publish, { token: "xoxb-fake" });
  });

  it("shows the welcome text and the Lexiguess instructions", async function () {
    const publish = await openHomeTab("U123");
    const text = publish.firstCall.args[0].view.blocks
      .map((block) => block.text?.text ?? "")
      .join("\n");
    expect(text).to.include("Welcome to Omnibot :books:");
    expect(text).to.include("Instructions for Lexiguess");
    expect(text).to.include("(at least 2 letters, no punctuation)");
  });

  it("registers exactly one app_home_opened listener", function () {
    const { listeners } = loadSlackApp();
    expect(listeners.app_home_opened).to.have.lengthOf(1);
  });
});

// Replicata: In Slack, say "aardwolf" in #games and then "zebra" in #botspam.
// Expectata: Each channel has its own Lexiguess game, so both words get
// Lexiguess's introduction.
// Resultata: All Slack channels share one game, so "zebra" in #botspam is
// treated as the second guess in #games' game.
describe("playing Lexiguess in Slack channels", function () {
  const proxyquire = require("proxyquire");
  const realDispatch = require("../dispatch.js");
  let run = 0;

  // Send [channel name, text] messages through Slack's real message handler
  // and dispatch. Each call uses fresh channel IDs, so games left over from
  // other quals can't interfere. Returns what Omnibot sent (say), a spy on
  // dispatch, and the channels.
  async function play(...messages) {
    run++;
    const say = sinon.fake.resolves();
    const dispatch = sinon.spy(realDispatch);
    const { messageHandler } = proxyquire("../platforms/slack/handlers.js", {
      "../../sendemitter.js": { sendmesg: say },
      "../../dispatch": dispatch,
    });
    const channels = [
      { id: `CQGAMES${run}`, name: "games" },
      { id: `CQBOTSPAM${run}`, name: "botspam" },
    ];
    for (const [i, [name, text]] of messages.entries()) {
      const { id } = channels.find((c) => c.name === name);
      await messageHandler(channels,
        { channel: id, user: "U1", text, ts: `${run}.${i}` });
    }
    await new Promise((resolve) => setImmediate(resolve));
    return { say, dispatch, channels };
  }

  it("gives each channel its own game", async function () {
    const { say } = await play(["games", "aardwolf"], ["botspam", "zebra"]);
    sinon.assert.callCount(say, 2);
    expect(say.getCall(0).args[0].mesg).to.match(/^Let Lexiguess commence!/);
    expect(say.getCall(1).args[0].mesg).to.match(/^Let Lexiguess commence!/);
  });

  it("doesn't carry one channel's range into another's game", async function () {
    const { say } = await play(["games", "aardwolf"], ["botspam", "zebra"]);
    expect(say.getCall(1).args[0].mesg).not.to.include("aardwolf");
  });

  it("keeps one game going within a channel", async function () {
    const { say } = await play(["games", "aardwolf"], ["games", "zebra"]);
    expect(say.getCall(1).args[0].mesg).to.match(/^\(2\) My word is between /);
  });

  it("tags the chum with the Slack channel's ID", async function () {
    const { dispatch, channels } = await play(["games", "aardwolf"]);
    expect(dispatch.firstCall.args[1].chid).to.equal(channels[0].id);
  });

  it("still sends the reply to the channel by name", async function () {
    const { say } = await play(["games", "aardwolf"]);
    sinon.assert.calledWithMatch(say, { plat: "slack", chan: "games" });
  });

  // Replicata: In Slack, say "k" (or "I") in #games.
  // Expectata: Omnibot ignores it; Lexiguess only plays words of 2+ letters.
  // Resultata: Omnibot starts a game and snarks that it doesn't know "k".
  it("ignores one-letter messages", async function () {
    const { say } = await play(["games", "k"], ["games", "I"]);
    sinon.assert.notCalled(say);
  });
});

// Replicata: In Slack, run /roll 6 in a channel that conversations.list
// doesn't return, such as a private channel Omnibot isn't in.
// Expectata: Omnibot answers the slash command.
// Resultata: sendmesg looks up the channel before acking, throws "TypeError:
// Cannot read properties of undefined (reading 'id')", and never acks.
describe("replying to a Slack slash command", function () {
  // A Slack client whose conversations.list sees only #botspam (unless given
  // another implementation), and which records whether it was asked
  const fakeClient = (list) => ({
    chat: {
      postEphemeral: sinon.fake.resolves(),
      postMessage: sinon.fake.resolves(),
    },
    conversations: {
      list: sinon.spy(list ?? (async () => ({ channels: [{ id: "123", name: "botspam" }] }))),
    },
  });
  const failingList = async () => { throw new Error("ratelimited") };
  const ackFor = (fields) =>
    ({ plat: "slack", mrid: "command:1234", mesg: "Hello, world!", ...fields });

  it("acks without needing to find the channel", async function () {
    const ack = sinon.fake.resolves();
    await sendmesg(fakeClient(), { "command:1234": ack },
      ackFor({ chan: "privategroup" }));
    sinon.assert.calledOnceWithExactly(ack, {
      response_type: "in_channel",
      text: "Hello, world!",
    });
  });

  it("doesn't call conversations.list to ack", async function () {
    const client = fakeClient();
    await sendmesg(client, { "command:1234": sinon.fake.resolves() },
      ackFor({ chan: "botspam" }));
    sinon.assert.notCalled(client.conversations.list);
  });

  it("acks even when conversations.list fails", async function () {
    const ack = sinon.fake.resolves();
    await sendmesg(fakeClient(failingList), { "command:1234": ack },
      ackFor({ chan: "botspam" }));
    sinon.assert.calledOnce(ack);
  });

  it("acks ephemerally in a channel it can't find", async function () {
    const ack = sinon.fake.resolves();
    await sendmesg(fakeClient(), { "command:1234": ack },
      ackFor({ chan: "privategroup", user: "<@U123>", phem: true }));
    sinon.assert.calledOnceWithExactly(ack, {
      response_type: "ephemeral",
      text: "Hello, world!",
    });
  });

  it("acks a command in a DM even when conversations.list fails", async function () {
    const ack = sinon.fake.resolves();
    await sendmesg(fakeClient(failingList), { "command:1234": ack },
      ackFor({ user: "<@U123>", priv: true }));
    sinon.assert.calledOnce(ack);
  });

  it("returns undefined after acking", async function () {
    const result = await sendmesg(fakeClient(),
      { "command:1234": sinon.fake.resolves() }, ackFor({ chan: "botspam" }));
    expect(result).to.equal(undefined);
  });

  it("still rejects an ambiguous ack without sending it", async function () {
    const ack = sinon.fake.resolves();
    await expect(sendmesg(fakeClient(), { "command:1234": ack },
      ackFor({ user: "<@U123>", priv: true, phem: true })))
      .to.be.rejectedWith("Ambiguous message");
    sinon.assert.notCalled(ack);
  });

  it("still rejects an empty ack without sending it", async function () {
    const ack = sinon.fake.resolves();
    await expect(sendmesg(fakeClient(), { "command:1234": ack },
      ackFor({ chan: "botspam", mesg: "" })))
      .to.be.rejectedWith("Missing message!");
    sinon.assert.notCalled(ack);
  });

  it("still looks up the channel for messages that aren't acks", async function () {
    const client = fakeClient();
    await sendmesg(client, {},
      { plat: "slack", chan: "botspam", mesg: "Hello, world!" });
    sinon.assert.calledOnce(client.conversations.list);
    sinon.assert.calledOnceWithExactly(client.chat.postMessage,
      { channel: "123", text: "Hello, world!" });
  });
});

// Replicata: In Slack, run /roll 6, /omnecho hello, or /omninom whisp.
// Expectata: As on Discord, the chum carries the invoker's ID as usid, so
// /roll's reply starts "<@U123>: `/roll 6`" and /omnecho and /omninom can
// reach the invoker.
// Resultata: Slack's handler never sets usid. /roll's reply starts
// "undefined:", and /omnecho and /omninom reject with "Missing target user!",
// which crashes the bot.
describe("running slash commands in Slack", function () {
  const proxyquire = require("proxyquire");
  const dispatch = require("../dispatch.js");

  // A Slack slash-command payload as Bolt delivers it
  const slashCommand = (fields) => ({
    trigger_id: "1.2.abc",
    team_id: "T123",
    channel_id: "C123",
    channel_name: "botspam",
    user_id: "U123",
    user_name: "alice",
    command: "/roll",
    text: "6",
    ...fields,
  });

  // The chum Slack's commandHandler hands to dispatch for this command
  async function chumFor(command) {
    const fakeDispatch = sinon.fake.resolves();
    const { commandHandler } = proxyquire("../platforms/slack/handlers.js",
      { "../../dispatch": fakeDispatch });
    await commandHandler({}, command, sinon.fake.resolves());
    return fakeDispatch.firstCall.args[1];
  }

  // Run the command end to end: Slack's handler, dispatch, the command
  // itself, then the real Slack sendmesg over a fake client that knows
  // #botspam (C123). Returns the ack fake and the client.
  async function run(command) {
    const chum = await chumFor(command);
    const ack = sinon.fake.resolves();
    const client = {
      chat: {
        postEphemeral: sinon.fake.resolves(),
        postMessage: sinon.fake.resolves(),
      },
      conversations: {
        list: sinon.fake.resolves({ channels: [{ id: "C123", name: "botspam" }] }),
      },
    };
    await dispatch(
      (message) => sendmesg(client, { [chum.msid]: ack }, message), chum);
    return { ack, client };
  }

  it("gives the chum the invoker's usid", async function () {
    expect((await chumFor(slashCommand())).usid).to.equal("<@U123>");
  });

  it("gives DM chums the invoker's usid too", async function () {
    const chum = await chumFor(slashCommand({ channel_name: "directmessage" }));
    expect(chum).to.include({ usid: "<@U123>", priv: true });
  });

  it("starts /roll's reply with the invoker, not 'undefined'", async function () {
    const { ack } = await run(slashCommand());
    expect(ack.firstCall.args[0].text).to.match(/^<@U123>: `\/roll 6`/);
  });

  it("acks /omnecho to the invoker and echoes the text in the channel", async function () {
    const { ack, client } =
      await run(slashCommand({ command: "/omnecho", text: "hello" }));
    sinon.assert.calledOnceWithExactly(ack, {
      response_type: "ephemeral",
      text: "<@U123>: /omnecho hello",
    });
    sinon.assert.calledOnceWithExactly(client.chat.postMessage,
      { text: "hello", channel: "C123" });
  });

  it("acks /omninom whisp and DMs the invoker", async function () {
    const { ack, client } =
      await run(slashCommand({ command: "/omninom", text: "whisp" }));
    expect(ack.firstCall.args[0].response_type).to.equal("ephemeral");
    sinon.assert.calledOnce(client.chat.postMessage);
    sinon.assert.calledWithMatch(client.chat.postMessage,
      { channel: "U123", user: "U123" });
  });

  it("gives plain Slack messages the author's usid", async function () {
    const fakeDispatch = sinon.fake.resolves();
    const { messageHandler } = proxyquire("../platforms/slack/handlers.js",
      { "../../dispatch": fakeDispatch });
    await messageHandler([{ id: "C123", name: "botspam" }],
      { channel: "C123", user: "U1", text: "hello", ts: "1.1" });
    expect(fakeDispatch.firstCall.args[1].usid).to.equal("<@U1>");
  });
});
