"use strict";
const CLOG = console.log;
CLOG("Omnibot!");

// -----------------------------------------------------------------------------
// -------- Initialization, create and start server, log in to Discord ---------

require("dotenv").config(); // or import 'dotenv/config'

const fs = require("node:fs");
const path = require("node:path");

const { lexup } = require("./lexiguess.js");

const ws = require("ws");
const { generateSlug } = require("random-word-slugs");
const express = require("express");
const webApp = express();
const { discord, slack } = require("./platforms");

webApp.use(express.static("public"));
webApp.use("/lib", express.static("node_modules"));
webApp.get("/health", (req, res) => {
  res.status(200).send("Server is running!");
});

if (slack.receiver.router) {
  webApp.use("/", receiver.router);
}

(async () => {
  if (process.env.IS_PULL_REQUEST !== "true") {
    try {
      await discord.login(process.env.DISCORD_BOT_TOKEN);
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
    wsServer.handleUpgrade(request, socket, head, (socket) => {
      wsServer.emit("connection", socket, request);
    });
  });

  CLOG("Omnibot is running; listening for events from Slack / the web");
})();

// Web Client
const clientNames = {};
const wsServer = new ws.Server({ noServer: true });

const send = (socket, event, data) => {
  return socket.send(
    JSON.stringify({
      event,
      data,
    })
  );
};

wsServer.on("connection", (socket, req) => {
  const ip = req.socket.remoteAddress;

  send(socket, "chat", "Omnibot!");
  send(socket, "name", !!clientNames[ip]);

  socket.on("message", (message) => {
    if (!clientNames[ip]) {
      const used = Object.values(clientNames).includes(message);
      if (/^[a-zA-Z0-9 ]+$/.test(message) && !used) {
        clientNames[ip] = message;
        send(socket, "name", true);
        wsServer.clients.forEach((s) =>
          send(s, "chat", `${clientNames[ip]} has joined the game.`)
        );
      } else {
        send(socket, "name", false);
      }

      return;
    }

    const name = clientNames[ip];

    send(socket, "chat", `${name}: ${message}`);

    const match = message.match(/^\/([a-z]+)( (.*))?/i);
    if (match) {
      const cmdName = match[1];
      const cmdInput = match[2] || "";
      const botCmd = botCommands.find((cmd) => cmd.name === cmdName);

      if (botCmd) {
        let localReply = botCmd.execute({
          cid: "web",
          sender: name,
          input: cmdInput.trim(),
        });
        send(socket, "chat", `LEX: ${localReply.output}`);
      } else {
        send(socket, "chat", `No command named ${cmdName}`);
      }
    } else if (/^[a-z]{2,}$/i.test(message)) {
      wsServer.clients.forEach((s) => {
        if (s !== socket) {
          send(s, "chat", `${name}: ${message}`);
        }
      });
      let reply = lexup("webclient", message);
      if (reply)
        wsServer.clients.forEach((s) => send(s, "chat", `LEX: ${reply}`));
    }
  });

  socket.on("close", () => {
    const name = clientNames[ip];
    wsServer.clients.forEach((s) =>
      send(s, "chat", `${name} has left the game.`)
    );
    delete clientNames[ip];
  });
});

process.on("exit", () => {
  CLOG("Shutting down!");
  wsServer.clients.forEach((s) =>
    send(
      s,
      "chat",
      "Server is shutting down! This is most likely a deliberate act by the admin."
    )
  );
  discord.destroy();
});
