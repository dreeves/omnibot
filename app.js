"use strict";
const CLOG = console.log;
CLOG("Omnibot!");

// -----------------------------------------------------------------------------
// -------- Initialization, create and start server, log in to Discord ---------

require("dotenv").config(); // or import 'dotenv/config'

const express = require("express");
const webApp = express();
const { discord, slack, web } = require("./platforms");
const announceVersion = require("./announce.js");
const { sendmesg } = require("./sendemitter.js");

webApp.use(express.static("public"));
webApp.use("/lib", express.static("node_modules"));
webApp.get("/health", (req, res) => {
  res.status(200).send("Server is running!");
});

if (slack.receiver.router) {
  webApp.use("/", slack.receiver.router);
}

(async () => {
  if (process.env.IS_PULL_REQUEST !== "true") {
    try {
      await discord.init(process.env.DISCORD_BOT_TOKEN);
    } catch (error) {
      console.log(error);
      console.log(
        `ERROR! Your login token was ${process.env.DISCORD_BOT_TOKEN}`
      );
    }
  }

  await slack.start();
  let server = webApp.listen(process.env.PORT || 3000);

  server.on("upgrade", (request, socket, head) => {
    web.handleUpgrade(request, socket, head, (socket) => {
      web.emit("connection", socket, request);
    });
  });

  CLOG("Omnibot is running; listening for events from Slack / the web");

  announceVersion(sendmesg);
})();

process.on("exit", () => {
  CLOG("Shutting down!");
});
