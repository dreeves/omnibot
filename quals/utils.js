const chai = require("chai");
const expect = chai.expect;

const { hasKeysExclusively } = require("../platforms/utils.js");

describe("hasKeysExclusively()", function () {
    it("returns true if the keys match exactly", function () {
        const object = {
            alpha: "asdf",
            bravo: "asdf",
            charlie: "asdf",
        };

        const keys = ["alpha", "bravo", "charlie"];

        expect(hasKeysExclusively(object, keys)).to.be.true;
    });

    it("returns false if the object has wrong keys", function () {
        const object = {
            alpha: "asdf",
            bravo: "asdf",
            echo: "asdf",
        };

        const keys = ["alpha", "bravo", "charlie"];

        expect(hasKeysExclusively(object, keys)).to.be.false;
    });

    it("returns false if the object is missing keys", function () {
        const object = {
            alpha: "asdf",
            bravo: "asdf",
        };

        const keys = ["alpha", "bravo", "charlie"];

        expect(hasKeysExclusively(object, keys)).to.be.false;
    });

    it("returns false if the object has extra keys", function () {
        const object = {
            alpha: "asdf",
            bravo: "asdf",
            charlie: "asdf",
        };

        const keys = ["alpha", "bravo"];

        expect(hasKeysExclusively(object, keys)).to.be.false;
    });
});
