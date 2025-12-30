const lexup = require("../lexiguess.js");
const dispatch = require("../dispatch.js");
const ws = require("ws");

const clientNames = {};
const wsServer = new ws.Server({ noServer: true });

const send = (socket, event, data) => { return socket.send(
  JSON.stringify({event, data})
)};

const broadcast = (event, data) => {
  wsServer.clients.forEach((s) => send(s, event, data));
};

wsServer.on("connection", (socket, req) => {
  const ip = req.socket.remoteAddress;

  send(socket, "chat", "Omnibot!");
  send(socket, "name", !!clientNames[ip]);

  socket.on("message", async (data) => {
    const message = data.toString();
    if (!clientNames[ip]) {
      const used = Object.values(clientNames).includes(message);
      if (/^[a-zA-Z0-9 ]+$/.test(message) && !used) {
        clientNames[ip] = message;
        send(socket, "name", true);
        wsServer.clients.forEach((s) =>
          send(s, "chat", `${clientNames[ip]} has joined the chat.`)
        );
      } else {
        send(socket, "name", false);
      }
      return;
    }

    const name = clientNames[ip];
    // send(socket, "chat", `${name}: ${message}`);
    broadcast("chat", `${name}: ${message}`);

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
        broadcast("chat", `OMNIBOT: ${mesg}`);
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
        broadcast("chat", `OMNIBOT: ${reply}`);
    }
  });

  socket.on("close", () => {
    const name = clientNames[ip];
    wsServer.clients.forEach((s) =>
      send(s, "chat", `${name} has left the left.`)
    );
    delete clientNames[ip];
  });
});

process.on("exit", () => { wsServer.clients.forEach((s) => send(
  s,
  "chat",
  "Server is shutting down! This is most likely a deliberate act by the admin.",
))});

module.exports = wsServer;
