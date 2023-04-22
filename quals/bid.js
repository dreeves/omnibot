const bid = require("../commands/bid.js");
const { toSlack, toDiscord } = require("../convert-commands.js");

const { expect } = require("chai");

describe("running an auction on slack", function () {
  let command = toSlack(bid);
  let acked;

  beforeEach(() => {
    acked = false;
  });

  it("starts the auction", async function () {
    await command({
      command: {
        channel_id: "001",
        text: "with <@UIEBO6EECEC|foo>",
        user_id: "UEECHOH1OOX",
      },
      ack: async (result) => {
        expect(result.text).to.equal(
          "Auction started! Got bids from {}, waiting on {<@UIEBO6EECEC>, <@UEECHOH1OOX>}"
        );
      },
      respond: async (result) => {
        expect(result).to.be.undefined;
      },
    });
  });

  it("accepts bids", async function () {
    await command({
      command: {
        channel_id: "001",
        text: "I vote for tonight @8pm",
        user_id: "UIEBO6EECEC",
      },
      ack: async (result) => {
        expect(result).to.be.undefined;
        acked = true;
      },
      respond: async (result) => {
        expect(result.text).to.equal(
          "New bid from <@UIEBO6EECEC>! Got bids from {<@UIEBO6EECEC>}, waiting on {<@UEECHOH1OOX>}"
        );
      },
    });

    expect(acked).to.be.true;
  });

  it("prints the result when the auction is done", async function () {
    await command({
      command: {
        channel_id: "001",
        text: "I vote for tonight @7pm",
        user_id: "UEECHOH1OOX",
      },
      ack: async (result) => {
        expect(result).to.be.undefined;
        acked = true;
      },
      respond: async (result) => {
        expect(result.text).to.match(
          new RegExp(
            "Got final bid from <@UEECHOH1OOX>! :tada: Results:\n" +
              "\t<@UIEBO6EECEC>: I vote for tonight @8pm\n" +
              "\t<@UEECHOH1OOX>: I vote for tonight @7pm\n\n" +
              "_/roll [0-9]+ → [0-9]+ not [0-9]+ ∴ no payments! :sweat_smile:_"
          )
        );
      },
    });

    expect(acked).to.be.true;
  });
});

describe("running an auction on Discord", function () {
  let { execute: command } = toDiscord(bid);

  it("starts the auction", async function () {
    await command({
      channelId: "001",
      options: { getString: () => "with <@UIEBO6EECEC|foo>" },
      user: { id: "UEECHOH1OOX" },
      reply: async (result) => {
        expect(result).to.equal(
          "Auction started! Got bids from {}, waiting on {<@UIEBO6EECEC>, <@UEECHOH1OOX>}"
        );
      },
    });
  });

  it("accepts bids", async function () {
    await command({
      channelId: "001",
      options: { getString: () => "I vote for tonight @8pm" },
      user: { id: "UIEBO6EECEC" },
      reply: async (result) => {
        expect(result).to.equal(
          "New bid from <@UIEBO6EECEC>! Got bids from {<@UIEBO6EECEC>}, waiting on {<@UEECHOH1OOX>}"
        );
      },
    });
  });

  it("prints the result when the auction is done", async function () {
    await command({
      channelId: "001",
      options: { getString: () => "I vote for tonight @7pm" },
      user: { id: "UEECHOH1OOX" },
      reply: async (result) => {
        expect(result).to.match(
          new RegExp(
            "Got final bid from <@UEECHOH1OOX>! :tada: Results:\n" +
              "\t<@UIEBO6EECEC>: I vote for tonight @8pm\n" +
              "\t<@UEECHOH1OOX>: I vote for tonight @7pm\n\n" +
              "_/roll [0-9]+ → [0-9]+ not [0-9]+ ∴ no payments! :sweat_smile:_"
          )
        );
      },
    });
  });
});
