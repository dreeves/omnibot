"use strict";
const CLOG = console.log;
CLOG("Omnibot!");

// -----------------------------------------------------------------------------
// -------- Initialization, create and start server, log in to Discord ---------

require("dotenv").config(); // or import 'dotenv/config'

const express = require("express");
const bodyParser = require("body-parser");
const webApp = express();
const { discord, slack, web } = require("./platforms");
const announceVersion = require("./announce.js");
const { sendmesg, ChumError } = require("./sendemitter.js");

webApp.use(bodyParser.json());
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
        `ERROR! Your login token was ${process.env.DISCORD_BOT_TOKEN}`,
      );
    }
  }

  console.log("starting slack")
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

class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = "RateLimitError";
  }
}

let lastMessage;
const HOUR_IN_MS = 1000 * 60 * 60;
function rateLimit() {
  const now = Date.now();
  lastMessage = lastMessage || 0;
  const remaining = Math.max(0, lastMessage + HOUR_IN_MS - now);
  if (!remaining) {
    lastMessage = now;
  } else {
    const seconds = Math.ceil(remaining / 1000);
    throw new RateLimitError(`Try again in ${seconds} seconds.`);
  }
}

webApp.post("/sendmesg", async (req, res) => {
  const chum = req.body;
  try {
    rateLimit();
    await sendmesg(chum);
    res.status(200).json(chum);
  } catch (err) {
    if (err instanceof ChumError) {
      lastMessage = 0;
      res.status(400);
    } else if (err instanceof RateLimitError) {
      res.status(401);
    } else {
      res.status(500);
    }

    res.json({
      error: err.name,
      details: err.message,
    });
  }
});

process.on("exit", () => {
  CLOG("Shutting down!");
});
