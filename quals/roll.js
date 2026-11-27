const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;

const roll = require("../commands/roll.js");

// What /roll sends for the given arguments, run on Discord in #botspam
async function rollReply(args) {
  const sendmesg = sinon.fake.resolves();
  await roll(sendmesg, {
    plat: "discord",
    fief: "testserver",
    chan: "botspam",
    user: "alice",
    usid: "<@123>",
    mesg: `/roll ${args}`,
    msid: "interaction:1",
  });
  sinon.assert.calledOnce(sendmesg);
  return sendmesg.firstCall.args[0];
}

// Replicata: /roll 2e0+4
// Expectata: Omnibot shows that 2e0+4 = 6 and rolls a D6.
// Resultata: It shows 2e0+4 = 20000 and rolls a D20000.
describe("/roll with scientific notation", function () {
  it("rolls a D6 for 2e0+4", async function () {
    const reply = await rollReply("2e0+4");
    expect(reply.mesg).to.include(":abacus: `2e0+4` = 6");
    expect(reply.mesg).to.include("Rolling a D6...");
  });

  it("rolls a D10 for 10e0", async function () {
    expect((await rollReply("10e0")).mesg).to.include("Rolling a D10...");
  });

  // Replicata: /roll 1e0
  // Expectata: Same as /roll 1, publicly.
  // Resultata: "Error: `1e0` doesn't evaluate to a number.", ephemerally.
  it("treats 1e0 as 1", async function () {
    const reply = await rollReply("1e0");
    expect(reply.mesg).to.include("Rolling a D1... it came up 1. Duh.");
    expect(reply.phem).to.equal(false);
  });

  it("flips a coin for 5e-1", async function () {
    expect((await rollReply("5e-1")).mesg)
      .to.include("Bernoulli trial with probability 0.5");
  });

  it("still rolls a D6 for 6", async function () {
    const reply = await rollReply("6");
    expect(reply.mesg).to.include("Rolling a D6...");
    expect(reply.phem).to.equal(false);
  });

  it("still answers help ephemerally", async function () {
    const reply = await rollReply("help");
    expect(reply.mesg).to.include("How to use /roll:");
    expect(reply.phem).to.equal(true);
  });

  it("still reports a non-number ephemerally", async function () {
    const reply = await rollReply("foo");
    expect(reply.mesg).to.include("`foo` doesn't evaluate to a number");
    expect(reply.phem).to.equal(true);
  });
});
