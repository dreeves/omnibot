const bid = require("../commands/bid.js");
const { toSlack } = require("../convert-commands.js");

const chai = require("chai");
chai.should();

describe("running an auction on slack", function () {
  let command = toSlack(bid);

  it("starts the auction", async function () {
    await command({
      command: {
        channel_id: "001",
        text: "with <@UIEBO6EECEC|foo>",
        user_id: "UEECHOH1OOX",
      },
      ack: async () => {},
      respond: async (result) => {
        result.should.equal(
          "Auction started! Got bids from {}, waiting on {<@UIEBO6EECEC>, <@UEECHOH1OOX>}"
        );
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
      ack: async () => {},
      respond: async (result) => {
        result.should.equal(
          "New bid from <@UIEBO6EECEC>! Got bids from {<@UIEBO6EECEC>}, waiting on {<@UEECHOH1OOX>}"
        );
      },
    });
  });

  it("prints the result when the auction is done", async function () {
    await command({
      command: {
        channel_id: "001",
        text: "I vote for tonight @7pm",
        user_id: "UEECHOH1OOX",
      },
      ack: async () => {},
      respond: async (result) => {
        result.should.match(
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
