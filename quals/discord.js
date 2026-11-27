const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised.default);

const DiscordFake = require("./fakes/discord.js");

const { ChannelType, MessageFlags } = require("discord.js");

const sendmesg = require("../platforms/discord/sendmesg");
const { interactionCreate } = require("../platforms/discord/handlers");

describe("sending a message to Discord", function () {
  const interactionCache = {};

  afterEach(function () {
    sinon.restore();
  });

  describe("erroneous messages", function () {
    it("rejects the wrong platform", async function () {
      const message = {
        plat: "slack",
        fief: "testserver",
        chan: "botspam",
        mesg: "Hello, world!",
      };
      const result = sendmesg(DiscordFake.client, {}, message);
      return expect(result).to.be.rejectedWith(
        `Um, sir, this is a Discord (not a ${message.plat})`,
      );
    });
    it("rejects a missing message", async function () {
      const message = {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
      };

      const result = sendmesg(DiscordFake.client, {}, message);
      return expect(result).to.be.rejectedWith("Missing message!");
    });
    it("rejects ambiguity between channel message and private message", async function () {
      const message = {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        usid: "<@123>",
        priv: true,
        mesg: "Hello, world!",
      };

      const result = sendmesg(DiscordFake.client, {}, message);
      return expect(result).to.be.rejectedWith(
        "Must specify fief&chan XOR user&priv. Called with: fief=testserver, chan=botspam, usid=<@123>, priv=true",
      );
    });
    it("rejects message that is neither a channel message nor a private message", async function () {
      const message = {
        plat: "discord",
        mesg: "Hello, world!",
      };

      const result = sendmesg(DiscordFake.client, {}, message);
      return expect(result).to.be.rejectedWith(
        "Must specify fief&chan XOR user&priv. Called with: fief=undefined, chan=undefined, usid=undefined, priv=undefined",
      );
    });
    it("rejects fief with a missing chan", async function () {
      const message = {
        plat: "discord",
        fief: "testserver",
        mesg: "Hello, world!",
      };

      const result = sendmesg(DiscordFake.client, {}, message);
      return expect(result).to.be.rejectedWith(
        "Must specify fief&chan XOR user&priv. Called with: fief=testserver, chan=undefined, usid=undefined, priv=undefined",
      );
    });
    it("rejects chan with a missing fief", async function () {
      const message = {
        plat: "discord",
        chan: "botspam",
        mesg: "Hello, world!",
      };

      const result = sendmesg(DiscordFake.client, {}, message);
      return expect(result).to.be.rejectedWith(
        "Must specify fief&chan XOR user&priv. Called with: fief=undefined, chan=botspam, usid=undefined, priv=undefined",
      );
    });
    it("rejects user with a missing priv", async function () {
      const message = {
        plat: "discord",
        usid: "<@123>",
        mesg: "Hello, world!",
      };

      const result = sendmesg(DiscordFake.client, {}, message);
      return expect(result).to.be.rejectedWith(
        "Must specify fief&chan XOR user&priv. Called with: fief=undefined, chan=undefined, usid=<@123>, priv=undefined",
      );
    });
    it("rejects priv with a missing user", async function () {
      const message = {
        plat: "discord",
        priv: true,
        mesg: "Hello, world!",
      };

      const result = sendmesg(DiscordFake.client, {}, message);
      return expect(result).to.be.rejectedWith(
        "Must specify fief&chan XOR user&priv. Called with: fief=undefined, chan=undefined, usid=undefined, priv=true",
      );
    });
  });

  describe("channel messages", function () {
    it("sends a channel message if fief and chan are present", async function () {
      const message = {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        mesg: "Hello, world!",
      };

      const result = sendmesg(DiscordFake.client, {}, message);
      await expect(result).to.be.fulfilled;
      sinon.assert.calledWith(DiscordFake.channel.send, {
        content: message.mesg,
      });
    });

    it("replies to a channel message if fief, chan, and mrid are present", async function () {
      const message = {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        mrid: "123",
        mesg: "Hello, world!",
      };

      const result = sendmesg(DiscordFake.client, {}, message);
      await expect(result).to.be.fulfilled;
      sinon.assert.calledWith(DiscordFake.message.reply, {
        content: message.mesg,
      });
    });
  });

  describe("private messages", function () {
    it("sends a private message if user and priv are present", async function () {
      const message = {
        plat: "discord",
        usid: "<@123>",
        priv: true,
        mesg: "Hello, world!",
      };

      const result = sendmesg(DiscordFake.client, {}, message);
      await expect(result).to.be.fulfilled;
      sinon.assert.calledWith(DiscordFake.user.send, {
        content: message.mesg,
      });
    });

    it("replies to a private message if user, priv, and mrid are present", async function () {
      const message = {
        plat: "discord",
        usid: "<@123>",
        priv: true,
        mrid: "123",
        mesg: "Hello, world!",
      };

      const result = sendmesg(DiscordFake.client, {}, message);
      await expect(result).to.be.fulfilled;
      sinon.assert.calledWith(DiscordFake.dm.reply, {
        content: message.mesg,
      });
    });
  });

  describe("command replies", function () {
    it('replies to a command if mrid starts with "interaction:"', async function () {
      const message = {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        mrid: "interaction:123",
        mesg: "Hello, world!",
      };

      const interaction = {
        reply: sinon.fake.resolves(),
        fetchReply: () => Promise.resolve({ id: "123" }),
      };
      interactionCache[message.mrid] = interaction;
      const result = sendmesg(
        DiscordFake.client,
        interactionCache,
        message,
      );
      await expect(result).to.eventually.equal("123");
      sinon.assert.calledWith(interaction.reply, {
        content: message.mesg,
      });
    });

    it("replies to a command ephemerally if phem is present", async function () {
      const message = {
        plat: "discord",
        fief: "testserver",
        chan: "botspam",
        mrid: "interaction:123",
        mesg: "Hello, world!",
        phem: true,
      };

      const interaction = {
        reply: sinon.fake.resolves(),
        fetchReply: () => Promise.resolve({ id: "123" }),
      };
      interactionCache[message.mrid] = interaction;
      const result = sendmesg(
        DiscordFake.client,
        interactionCache,
        message,
      );
      await expect(result).to.eventually.equal("123");
      sinon.assert.calledWith(interaction.reply, {
        content: message.mesg,
        flags: MessageFlags.Ephemeral,
      });
    });
  });
});

describe("handling direct messages", function () {
  const directMessage = {
    commandName: "/bid",
    options: {
      getString: () => "Hello, world!",
    },
    user: { id: 1234 },
    id: 1234,
    isChatInputCommand: () => true,
    channel: {
      type: ChannelType.DM,
    },
  };

  it("doesn't throw an error", async function () {
    const cache = {};
    const promise = interactionCreate(cache, directMessage);

    return expect(promise).to.be.fulfilled;
  });
});

// Replicata: Ask Discord's sendmesg to DM a usid that isn't in <@ID> form, e.g.
// POST {"plat":"discord","usid":"bob","priv":true,"mesg":"hi"} to /sendmesg.
// Expectata: A ChumError whose message names the malformed mention:
// "Invalid mention: bob".
// Resultata: The message is literally "Invalid mention: {mention}".
describe("sending a Discord DM to a malformed mention", function () {
  const { ChumError } = require("../sendemitter.js");

  // What sendmesg rejects with when asked to DM the given usid
  const dmError = (usid) => sendmesg(DiscordFake.client, {},
    { plat: "discord", usid, priv: true, mesg: "Hello, world!" })
    .then(() => null, (err) => err);

  for (const usid of ["bob", "<@123", "123>", "@123", "<#123>", "123"]) {
    it(`names "${usid}" in a ChumError`, async function () {
      const err = await dmError(usid);
      expect(err).to.be.instanceOf(ChumError);
      expect(err.message).to.equal(`Invalid mention: ${usid}`);
    });
  }
});

// Replicata: Say "k" in a Discord Lexiguess channel such as #games.
// Expectata: Omnibot ignores it, since Lexiguess only plays words of at least
// 2 letters.
// Resultata: Omnibot opens a "lexiguess-for-k" thread and starts a game there.
describe("handling a short Discord message in a Lexiguess channel", function () {
  const proxyquire = require("proxyquire");
  let n = 0;

  // handlers.js, with sendmesg replaced by the given fake
  const handlersSaying = (say) => proxyquire("../platforms/discord/handlers.js",
    { "../../sendemitter.js": { sendmesg: say } });

  // A guild text message in the given channel. Its startThread resolves to
  // msg.thread.
  function guildMessage(content, channelName = "games") {
    n++;
    const thread = { name: `lexiguess-for-${content.toLowerCase()}`, id: `qual-thread-${n}` };
    return {
      author: { bot: false, id: "123", username: "alice" },
      member: { displayName: "alice" },
      guild: { name: "testserver" },
      channel: { type: ChannelType.GuildText, name: channelName, id: `qual-channel-${n}` },
      content,
      id: `qual-message-${n}`,
      thread,
      startThread: sinon.fake.resolves(thread),
    };
  }

  it("doesn't open a Lexiguess thread for one letter", async function () {
    const say = sinon.fake.resolves();
    const msg = guildMessage("k");
    await handlersSaying(say).messageCreate(msg);
    sinon.assert.notCalled(msg.startThread);
    sinon.assert.notCalled(say);
  });

  it("ignores one letter in every Lexiguess channel, in either case", async function () {
    const say = sinon.fake.resolves();
    const { messageCreate } = handlersSaying(say);
    for (const channelName of
      ["games", "botspam", "lexiguess", "spellingbee", "gambolhall", "the-saloon"]) {
      for (const letter of ["a", "I", "k", "Z"]) {
        const msg = guildMessage(letter, channelName);
        await messageCreate(msg);
        sinon.assert.notCalled(msg.startThread);
      }
    }
    sinon.assert.notCalled(say);
  });

  it("still opens a thread and plays a two-letter word", async function () {
    const say = sinon.fake.resolves();
    const msg = guildMessage("ox");
    await handlersSaying(say).messageCreate(msg);
    sinon.assert.calledOnceWithExactly(msg.startThread,
      { name: "lexiguess-for-ox", autoArchiveDuration: 60 });
    sinon.assert.calledOnce(say);
    sinon.assert.calledWithMatch(say,
      { plat: "discord", chan: "lexiguess-for-ox", chid: msg.thread.id });
    expect(say.firstCall.args[0].mesg).to.match(/^Let Lexiguess commence!/);
  });
});

// Replicata: Log Omnibot in to Discord (discord.js 14.25 or later).
// Expectata: Omnibot logs "Logged in to Discord as ..." when discord.js emits
// clientReady.
// Resultata: Omnibot listens for the deprecated "ready" event, so every login
// prints a DeprecationWarning, and under discord.js v15 the login line would
// never appear.
describe("logging in to Discord", function () {
  const proxyquire = require("proxyquire");
  const { EventEmitter } = require("node:events");

  // Load platforms/discord/index.js against the given discord.js client class,
  // with handlers.js's ready() replaced by the returned fake
  function loadWith(Client) {
    const ready = sinon.fake();
    proxyquire("../platforms/discord/index.js", {
      "discord.js": { Client, GatewayIntentBits: {}, "@noCallThru": true },
      "./handlers.js": {
        ready,
        messageCreate() {},
        interactionCreate() {},
        "@noCallThru": true,
      },
      "../../sendemitter.js": { registerPlatform() {}, "@noCallThru": true },
    });
    return ready;
  }

  // A stand-in discord.js client; the last one constructed is in `client`
  let client;
  class FakeClient extends EventEmitter {
    constructor() {
      super();
      client = this;
      this.user = { tag: "Omnibot#0001" };
    }
    destroy() {}
  }

  it("announces the login on clientReady", function () {
    const ready = loadWith(FakeClient);
    client.emit("clientReady", client);
    sinon.assert.calledOnceWithExactly(ready, "Omnibot#0001");
  });

  it("announces the login only once", function () {
    const ready = loadWith(FakeClient);
    client.emit("clientReady", client);
    client.emit("clientReady", client);
    sinon.assert.calledOnce(ready);
  });

  it("doesn't listen for the deprecated ready event", function () {
    loadWith(FakeClient);
    expect(client.listenerCount("ready")).to.equal(0);
  });

  it("logs in under real discord.js without a DeprecationWarning", function () {
    const Discord = require("discord.js");
    let realClient;
    class SpyClient extends Discord.Client {
      constructor(options) {
        super(options);
        realClient = this;
      }
    }
    const ready = sinon.fake();
    proxyquire("../platforms/discord/index.js", {
      "discord.js": { Client: SpyClient },
      "./handlers.js": {
        ready,
        messageCreate() {},
        interactionCreate() {},
        "@noCallThru": true,
      },
      "../../sendemitter.js": { registerPlatform() {}, "@noCallThru": true },
    });
    const emitWarning = sinon.spy(process, "emitWarning");
    try {
      realClient.user = { tag: "Omnibot#0001" };
      realClient.ws.triggerClientReady(); // what discord.js does on login
    } finally {
      emitWarning.restore();
    }
    sinon.assert.calledOnceWithExactly(ready, "Omnibot#0001");
    sinon.assert.neverCalledWithMatch(emitWarning,
      sinon.match(/renamed to clientReady/));
  });
});

// Replicata: In Discord, run "/bid lunch @Omnibot @alice". Omnibot first acks
// the @-mention as the interaction's reply, then posts "Auction started!" as a
// follow-up.
// Expectata: sendmesg returns the ID of the follow-up it just sent, so the
// auction results later reply to "Auction started!".
// Resultata: sendmesg calls fetchReply() after the follow-up and returns the
// ID of the interaction's first reply, the @-mention ack.
describe("following up on a Discord slash command", function () {
  // An interaction that has already been replied to once
  const answered = () => ({
    replied: true,
    followUp: sinon.fake.resolves({ id: "456" }),
    fetchReply: sinon.fake.resolves({ id: "123" }),
  });
  // Send through the given interaction to #botspam
  const via = (interaction, fields = {}) => sendmesg(
    DiscordFake.client,
    { "interaction:followup": interaction },
    {
      plat: "discord",
      fief: "testserver",
      chan: "botspam",
      mrid: "interaction:followup",
      mesg: "Hello, world!",
      ...fields,
    },
  );

  it("returns the ID of the follow-up message", async function () {
    const interaction = answered();
    await expect(via(interaction)).to.eventually.equal("456");
    sinon.assert.calledOnceWithExactly(interaction.followUp, {
      content: "Hello, world!",
    });
  });

  it("doesn't fetch the original reply after a follow-up", async function () {
    const interaction = answered();
    await via(interaction);
    sinon.assert.notCalled(interaction.fetchReply);
  });

  it("returns the ID of an ephemeral follow-up", async function () {
    const interaction = answered();
    await expect(via(interaction, { phem: true })).to.eventually.equal("456");
    sinon.assert.calledOnceWithExactly(interaction.followUp, {
      content: "Hello, world!",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("still returns the reply's ID for a first reply", async function () {
    const interaction = {
      replied: false,
      reply: sinon.fake.resolves(),
      fetchReply: sinon.fake.resolves({ id: "123" }),
    };
    await expect(via(interaction)).to.eventually.equal("123");
    sinon.assert.calledOnce(interaction.fetchReply);
  });

  it("threads /bid's results under 'Auction started!' when Omnibot is @-mentioned", async function () {
    const dispatch = require("../dispatch.js");
    const store = require("../store.js");
    const chan = "qual-bid-followup";
    const savedClientId = process.env.DISCORD_CLIENT_ID;
    process.env.DISCORD_CLIENT_ID = "900"; // Omnibot's user ID, for dispatch

    const channel = {
      name: chan,
      send: sinon.fake.resolves({ id: "channel-post" }),
      messages: {
        fetch: sinon.fake.resolves({ reply: sinon.fake.resolves({ id: "results" }) }),
      },
    };
    const guild = {
      name: "testserver",
      fetch: async () => guild,
      channels: { fetch: async () => [channel] },
    };
    const client = {
      guilds: { fetch: async () => [guild] },
      users: { fetch: async () => ({ send: sinon.fake.resolves({ id: "dm" }) }) },
      channels: { fetch: async () => channel },
    };
    // A fresh interaction whose reply, follow-up, and fetchReply return the
    // given message IDs
    const interaction = (replyId, followUpId) => {
      const i = {
        replied: false,
        reply: sinon.fake(async () => { i.replied = true }),
        followUp: sinon.fake.resolves({ id: followUpId }),
        fetchReply: sinon.fake.resolves({ id: replyId }),
      };
      return i;
    };
    const cache = {
      "interaction:start": interaction("mention-ack", "auction-started"),
      "interaction:abort": interaction("abort-ack", "abort-followup"),
    };
    const chum = (mesg, msid) => ({
      plat: "discord", fief: "testserver", chan, chid: "qual-channel",
      user: "alice", usid: "<@123>", mesg, msid, priv: false,
    });
    const send = (message) => sendmesg(client, cache, message);

    try {
      await dispatch(send, chum("/bid lunch <@900> <@456>", "interaction:start"));
      expect(store.get("beebot.auctions." + chan).initialMsid)
        .to.equal("auction-started");

      await dispatch(send, chum("/bid abort", "interaction:abort"));
      sinon.assert.calledWith(channel.messages.fetch, "auction-started");
    } finally {
      if (savedClientId === undefined) delete process.env.DISCORD_CLIENT_ID;
      else process.env.DISCORD_CLIENT_ID = savedClientId;
      store.del("beebot.auctions." + chan);
      store.del("beebot.auctions." + chan + ".bids");
    }
  });
});
