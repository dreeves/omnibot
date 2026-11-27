const chai = require("chai");
const expect = chai.expect;

const lexup = require("../lexiguess.js");

describe("Lexiguess", function () {
  let n = 0;
  const newGame = () => `qual-lexiguess-${++n}`; // a fresh game ID

  // Replicata: In a Lexiguess channel, start a new game by guessing
  // "constructor".
  // Expectata: Lexiguess introduces itself and narrows the range, as it does for
  // any other dictionary word.
  // Resultata: "ERROR: First guess somehow a repeat? Can't happen!"
  it("treats a first guess of 'constructor' like any other word", function () {
    expect(lexup(newGame(), "constructor")).to.match(/^Let Lexiguess commence!/);
  });

  // Replicata: Start a game by guessing "aardwolf", then guess "constructor".
  // Expectata: Lexiguess narrows the range with "constructor" (guess 2).
  // Resultata: 'Hello, McFly, you already guessed "constructor".'
  it("doesn't call 'constructor' a repeat when no one guessed it", function () {
    const game = newGame();
    lexup(game, "aardwolf");
    expect(lexup(game, "constructor")).to.match(/^\(2\) My word is between /);
  });

  it("knows 'constructor' is a word", function () {
    expect(lexup(newGame(), "constructor")).not.to.include("know the word");
  });

  it("still catches a genuine repeat of 'constructor'", function () {
    const game = newGame();
    lexup(game, "aardwolf");
    lexup(game, "constructor");
    expect(lexup(game, "Constructor")) // capitalized, so not an exact dup
      .to.match(/^Hello, McFly, you already guessed "constructor"/);
  });

  it("still catches a genuine repeat of an ordinary word", function () {
    const game = newGame();
    lexup(game, "aardwolf");
    expect(lexup(game, "AARDWOLF"))
      .to.match(/^Hello, McFly, you already guessed "aardwolf"/);
  });

  // Other names every plain object inherits only reach Lexiguess lowercased,
  // so they're just unknown words.
  for (const word of ["toString", "valueOf", "hasOwnProperty", "isPrototypeOf"]) {
    it(`treats "${word}" as an unknown word, not a repeat`, function () {
      expect(lexup(newGame(), word))
        .to.include(`know the word "${word.toLowerCase()}"`);
    });
  }
});
