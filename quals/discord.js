const sendmesg = require("../platforms/discord/sendmesg");

describe("sending a message to Discord", function () {
    describe("sending a non-ephemeral message", function () {
        xit("replies to a message if mrid and mesg are present", function () {});

        xit("sends a DM if priv, user, and message are present", function () {});

        xit("sends a message in a channel if fief, chan, and message are present", function () {});

        xit("throws an error if anything else is true", function () {});
    });

    describe("sending an ephemeral message", function () {
        xit("replies to a message if mrid is an interaction", function () {});

        xit("throws an error if anything else is true", function () {});
    });
});
