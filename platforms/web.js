const { lexup } = require("../lexiguess.js");
const ws = require("ws");

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
                wsServer.clients.forEach((s) =>
                    send(s, "chat", `LEX: ${reply}`)
                );
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
    wsServer.clients.forEach((s) =>
        send(
            s,
            "chat",
            "Server is shutting down! This is most likely a deliberate act by the admin."
        )
    );
});

module.exports = wsServer;
