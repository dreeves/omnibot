const http = require("node:http");
const WebSocket = require("ws");
const chai = require("chai");
const expect = chai.expect;

const web = require("../platforms/web.js");

// Lexiguess's 2-letter minimum, as seen from the web chat, which has its own
// check in platforms/web.js. (Same rule as on Discord and Slack.)
describe("Lexiguess in the web chat", function () {
  this.timeout(5000);
  let server;
  let url;

  before(async function () {
    server = http.createServer();
    server.on("upgrade", (request, socket, head) => { // wired up as in app.js
      web.handleUpgrade(request, socket, head,
        (ws) => web.emit("connection", ws, request));
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    url = `ws://127.0.0.1:${server.address().port}`;
  });

  after(function () { server.close() });

  it("ignores one-letter words and plays two-letter ones", async function () {
    const ws = new WebSocket(url);
    const botSaid = [];
    let named;
    const isNamed = new Promise((resolve) => { named = resolve });
    ws.on("message", (raw) => {
      const { event, data } = JSON.parse(raw);
      if (event === "name" && data === true) named();
      if (event === "chat" && data.kind === "bot") botSaid.push(data.text);
    });
    await new Promise((resolve) => ws.on("open", resolve));
    ws.send("qual tester");
    await isNamed;

    ws.send("k");
    ws.send("ox");
    while (botSaid.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    ws.close();

    expect(botSaid[0]).to.include('"ox"');
  });
});
