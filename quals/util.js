const chai = require("chai");
const expect = chai.expect;

const { laxeval } = require("../util.js");

describe("laxeval()", function () {
  // Replicata: /roll 2e0+4
  // Expectata: 2e0+4 evaluates to 6, so Omnibot rolls a D6.
  // Resultata: deoctalize turns "2e0+4" into "2e+4", so Omnibot rolls a D20000.
  // (And /roll 1e0 says "`1e0` doesn't evaluate to a number".)
  describe("keeps zeros that come right after the e of scientific notation", function () {
    for (const [expr, value] of [
      ["2e0+4", 6], ["1e0", 1], ["1e00", 1], ["0e0", 0], ["100e0", 100],
      ["10e0", 10], ["1.5e0", 1.5], ["2.0e0", 2], ["0.0e0", 0], ["3e0*2", 6],
      ["(1e0)", 1], ["1e0^2", 1], ["1e00+1", 2],
    ]) {
      it(`evaluates ${expr} to ${value}`, function () {
        expect(laxeval(expr)).to.equal(value);
      });
    }
  });

  describe("still drops leading zeros so numbers aren't read as octal", function () {
    for (const [expr, value] of [
      ["010", 10], ["007+1", 8], ["0.05", 0.05], ["1e10", 1e10], ["1e05", 1e5],
      ["1e-05", 1e-5], ["0", 0], ["00", 0], ["100", 100], ["1.05", 1.05],
      ["5e-1", 0.5], ["1e+0", 1], ["1e-0", 1], ["2^10", 1024], ["(1+2)*3", 9],
      ["7/2", 3.5],
    ]) {
      it(`evaluates ${expr} to ${value}`, function () {
        expect(laxeval(expr)).to.equal(value);
      });
    }
  });

  it("refuses anything outside its whitelist", function () {
    for (const s of ["a", "1+a", "constructor", "alert(1)", "[]", "[1]", "'1'",
      '"1"', "`1`", "$", "_", "Z", "1;2", "x=1", "{}"]) {
      expect(laxeval(s), s).to.equal(null);
    }
  });

  it("returns null for expressions that don't parse", function () {
    for (const s of ["1+", "(1", "e", "ee", "1e", ""]) {
      expect(laxeval(s), JSON.stringify(s)).to.equal(null);
    }
  });
});
