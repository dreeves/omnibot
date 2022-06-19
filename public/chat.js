import { Terminal } from "xterm";
import { Readline } from "xterm-readline";
import emoji from "node-emoji";
import { FitAddon } from "xterm-addon-fit";

window.addEventListener("load", () => {
  const term = new Terminal();
  const rl = new Readline();
  const fit = new FitAddon();

  term.loadAddon(rl);
  term.loadAddon(fit);
  term.open(document.getElementById("terminal"));
  term.focus();
  fit.fit();

  new ResizeObserver(fit.fit.bind(fit)).observe(
    document.getElementById("terminal")
  );

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(
    `${protocol}:${window.location.hostname}:${window.location.port}`
  );

  socket.addEventListener("message", (e) => {
    term.writeln(emoji.emojify(e.data));
  });

  const prompt = () =>
    rl
      .read("")
      .then((text) => socket.send(text))
      .then(prompt);

  prompt();
});
