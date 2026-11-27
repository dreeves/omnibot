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

// Replicata: Say "k" in a Lexiguess channel such as #games.
// Expectata: Omnibot ignores it, since Lexiguess only plays words of at least
// 2 letters.
// Resultata: Omnibot starts a Lexiguess game and snarks that it doesn't know
// the word "k".
describe("dispatch() with short messages in a Lexiguess channel", function () {
  let n = 0;

  // Dispatch mesg as a Discord message in the given channel, in a fresh game;
  // return the sendmesg fake
  async function lexiSay(mesg, chan = "games") {
    n++;
    const sendmesg = sinon.fake.resolves();
    await dispatch(sendmesg, {
      plat: "discord",
      fief: "testserver",
      chan,
      chid: `qual-dispatch-lexi-${n}`,
      user: "<@123>",
      usid: "<@123>",
      mesg,
      msid: `qual-${n}`,
    });
    return sendmesg;
  }

  it("doesn't start a Lexiguess game for one letter", async function () {
    sinon.assert.notCalled(await lexiSay("k"));
  });

  it("ignores every single letter, in either case", async function () {
    for (const letter of "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      sinon.assert.notCalled(await lexiSay(letter));
    }
  });

  it("ignores one letter in every Lexiguess channel", async function () {
    for (const chan of
      ["botspam", "games", "lexiguess", "spellingbee", "gambolhall", "the-saloon"]) {
      sinon.assert.notCalled(await lexiSay("k", chan));
    }
  });

  it("still plays a two-letter word", async function () {
    sinon.assert.calledOnce(await lexiSay("ox"));
  });

  it("still plays longer words, in any case", async function () {
    for (const word of ["zebra", "ZEBRA", "Zebra"]) {
      sinon.assert.calledOnce(await lexiSay(word));
    }
  });
});

// The spec for which messages Lexiguess treats as guesses: a single word of at
// least 2 letters, nothing else (README: "Ignore anything with punctuation or
// less than 2 letters").
describe("LEXIGUESS_REGEX", function () {
  const { expect } = require("chai");
  const { LEXIGUESS_REGEX } = dispatch;

  it("rejects a single letter", function () {
    for (const s of ["a", "k", "I", "Z"]) {
      expect(LEXIGUESS_REGEX.test(s), s).to.equal(false);
    }
  });

  it("accepts two or more letters, in any case", function () {
    for (const s of ["ox", "OX", "zebra", "Zymurgy"]) {
      expect(LEXIGUESS_REGEX.test(s), s).to.equal(true);
    }
  });

  it("rejects anything that isn't all letters", function () {
    for (const s of ["", " ox", "ox ", "o x", "ox!", "o-x", "x1", "1x", "ox\n", "öx"]) {
      expect(LEXIGUESS_REGEX.test(s), JSON.stringify(s)).to.equal(false);
    }
  });
});
