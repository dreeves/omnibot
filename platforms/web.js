const lexup = require("../lexiguess.js");
const dispatch = require("../dispatch.js");
const ws = require("ws");

const clientNames = {};
const clientIds = new WeakMap();
let nextClientId = 1;
const wsServer = new ws.Server({ noServer: true });

// Weirdly, ":coin:" isn't recognized as the coin emoji in web chat.
// Also shouldn't this be in convert-commands.js?
const translateWebChat = (data) => {
  if (typeof data === "string") return data.replace(/:coin:/g, "🪙");
  if (data && typeof data === "object" && typeof data.text === "string") {
    return { ...data, text: data.text.replace(/:coin:/g, "🪙") };
  }
  return data;
};

const send = (socket, event, data) => {
  const translated = event === "chat" ? translateWebChat(data) : data;
  return socket.send(JSON.stringify({ event, data: translated }))
};

const broadcast = (event, data) => {
  wsServer.clients.forEach((s) => send(s, event, data));
};

wsServer.on("connection", (socket, req) => {
  const ip = req.socket.remoteAddress;
  const clientId = nextClientId++;
  clientIds.set(socket, clientId);

  //send(socket, "chat", { kind: "bot", from: "Omnibot", text: "Welcome" });
  // send(socket, "name", !!clientNames[ip]);
  send(socket, "name", false);

  socket.on("message", async (data) => {
    const message = data.toString();
    // if (!clientNames[ip]) {
    const name = clientNames[clientId];
    if (!name) {
      const used = Object.values(clientNames).includes(message);
      if (/^[a-zA-Z0-9 ]+$/.test(message) && !used) {
        clientNames[clientId] = message;
        send(socket, "name", true);
        wsServer.clients.forEach((s) =>
          send(s, "chat", { kind: "system", text: `${clientNames[clientId]} has joined the chat` })
        );
      } else {
        send(socket, "name", false);
      }
      return;
    }

    // const name = clientNames[ip];
    // send(socket, "chat", `${name}: ${message}`);
    broadcast("chat", { kind: "user", from: name, text: message });

    const match = message.match(/^\/([a-z]+)( (.*))?/i);
    if (match) {
      const cmdName = match[1];
      const cmdInput = match[2] || "";
      // Oops we crash if we reach the next line: botCommands is not defined.
      // I think the right solution here is to follow the pattern of discord and
      // slack and use the dispatcher?
      // const botCmd = botCommands.find((cmd) => cmd.name === cmdName);
      //
      // if (botCmd) {
      //   let localReply = botCmd.execute({
      //     cid: "web",
      //     sender: name,
      //     input: cmdInput.trim(),
      //   });
      //   send(socket, "chat", `LEX: ${localReply.output}`);
      // } else {
      //   send(socket, "chat", `No command named ${cmdName}`);
      // }

      const sendmesg = async ({ mesg }) => {
        // send(socket, "chat", `LEX: ${mesg}`);
        broadcast("chat", { kind: "bot", from: "Omnibot", text: mesg });
      };

      await dispatch(sendmesg, {
        plat: "web",
        fief: "web",
        chan: "web",
        user: name,
        usid: `web[${ip}]`,
        mesg: `/${cmdName}${cmdInput}`,
        msid: `web:${ip}:${Date.now()}`,
        priv: false,
      });
    } else if (/^[a-z]{2,}$/i.test(message)) {
      // wsServer.clients.forEach((s) => {
      //   if (s !== socket) {
      //     send(s, "chat", `${name}: ${message}`);
      //   }
      // });
      let reply = lexup("webclient", message);
      if (reply)
        // wsServer.clients.forEach((s) => send(s, "chat", `LEX: ${reply}`));
        broadcast("chat", { kind: "bot", from: "Omnibot", text: reply });
    }
  });

  socket.on("close", () => {
    // const name = clientNames[ip];
    const name = clientNames[clientId];
    if (name) {
      wsServer.clients.forEach((s) => send(s, "chat", { kind: "system", text: `${name} has left the chat.` }));
    }
    delete clientNames[clientId];
  });
});

process.on("exit", () => { wsServer.clients.forEach((s) => send(
  s,
  "chat",
  { kind: "system", text: "Server is shutting down! This is most likely a deliberate act by the admin." },
))});

module.exports = wsServer;
