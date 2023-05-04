const bid = require("../commands/bid.js");

const { expect } = require("chai");

describe("running an auction", function () {
  it("starts the auction", function () {
    const { output, voxmode } = bid.execute({
      channel: "001",
      input: "with <@UIEBO6EECEC>",
      sender: "<@UEECHOH1OOX>",
    });

    expect(output).to.equal(
      "Auction started! Got bids from {}, waiting on {<@UIEBO6EECEC>, <@UEECHOH1OOX>}"
    );
    expect(voxmode).to.equal("holla");
  });

  it("accepts bids", function () {
    const { output, voxmode } = bid.execute({
      channel: "001",
      input: "I vote for tonight @8pm",
      sender: "<@UIEBO6EECEC>",
    });

    expect(output).to.equal(
      "New bid from <@UIEBO6EECEC>! Got bids from {<@UIEBO6EECEC>}, waiting on {<@UEECHOH1OOX>}"
    );
    expect(voxmode).to.equal("blurt");
  });

  it("prints the result when the auction is done", function () {
    const { output, voxmode } = bid.execute({
      channel: "001",
      input: "I vote for tonight @7pm",
      sender: "<@UEECHOH1OOX>",
    });

    expect(output).to.match(
      new RegExp(
        "Got final bid from <@UEECHOH1OOX>! :tada: Results:\n" +
          "\t<@UIEBO6EECEC>: I vote for tonight @8pm\n" +
          "\t<@UEECHOH1OOX>: I vote for tonight @7pm\n\n" +
          "_/roll [0-9]+ → [0-9]+ not [0-9]+ ∴ no payments! :sweat_smile:_"
      )
    );
    expect(voxmode).to.equal("blurt");
  });
});
