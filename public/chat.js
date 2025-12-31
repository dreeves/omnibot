//import emoji from "node-emoji";
//import default from 'node-emoji';
import * as emoji from 'node-emoji';
// import { emojify } from 'node-emoji';
import { Remarkable } from "remarkable";
const md = new Remarkable({ html: false, breaks: true });

let named = null;
let myName = null;

window.addEventListener("load", () => {
  const body = document.body;
  const chatHistory = document.getElementById("chat-history");
  const chatInput = document.getElementById("chat-input");
  const nameInput = document.getElementById("name-input");

  function pushChat(message) {
    const li = document.createElement("li");
    li.classList.add("msg");

    let kind = "system";
    let from = null;
    let text = message;

    if (message && typeof message === "object") {
      kind = message.kind || kind;
      from = message.from || null;
      text = message.text;
    }

    if (kind === "user" && myName && from === myName) {
      li.classList.add("msg--me");
    } else if (kind === "bot") {
      li.classList.add("msg--bot");
    } else {
      li.classList.add("msg--system");
    }

    if ((kind === "user" || kind === "bot") && from && !(kind === "user" && myName && from === myName)) {
      const meta = document.createElement("div");
      meta.className = "msg__meta";
      meta.textContent = from;
      li.appendChild(meta);
    }

    const body = document.createElement("div");
    body.className = "msg__body";
    body.innerHTML = md.render(text);
    li.appendChild(body);

    chatHistory.appendChild(li);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(
    `${protocol}:${window.location.hostname}:${window.location.port}`
  );

  socket.addEventListener("message", (e) => {
    let message = JSON.parse(e.data);

    if (message.event === "name") {
      let prevNamed = named;
      named = message.data;
      body.classList.remove("waiting");
      if (named === false) {
        body.classList.add("naming");

        if (prevNamed !== null) {
          body.classList.add("name-rejected");
        }

        nameInput.focus();
      } else if (named === true) {
        body.classList.remove("naming");
        body.classList.add("chatting");

        chatInput.focus();
      }
    } else if (message.event === "chat") {
      if (typeof message.data === "string") {
        pushChat(emoji.emojify(message.data));
      } else if (message.data && typeof message.data === "object") {
        if (typeof message.data.text !== "string") {
          throw new Error(`Expected chat payload text to be a string, got ${typeof message.data.text}`);
        }
        pushChat({ ...message.data, text: emoji.emojify(message.data.text) });
      } else {
        throw new Error(`Expected chat payload to be string or object, got ${typeof message.data}`);
      }
    } else {
      console.log(`Unrecognized event ${message.event} from server.`);
    }
  });

  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      socket.send(chatInput.value);
      chatInput.value = "";
    }
  });

  nameInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      myName = nameInput.value;
      socket.send(nameInput.value);
      chatInput.value = "";
    }
  });
});
