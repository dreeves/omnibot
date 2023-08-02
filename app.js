process.on('uncaughtException', function (exception) {
  console.log(exception); // to see your exception details in the console
  // if you are on production, maybe you can send the exception details to your
  // email as well ?
});

"use strict";
const CLOG = console.log;
CLOG("Omnibot!");

const fs = require("node:fs");

if (fs.existsSync("omnibot.lock")) {
  CLOG("Lockfile already exists!");
  process.exit();
}
fs.writeFileSync("omnibot.lock", `${process.pid}`);

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
  CLOG("Shutting down: exiting!");
  fs.unlinkSync("omnibot.lock");
});

process.on("SIGINT", () => {
  process.exit();
});

process.on("SIGTERM", () => {
  process.exit();
});
