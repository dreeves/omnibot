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

    if (typeof message === "string" && myName && message.startsWith(`${myName}:`)) {
      li.classList.add("msg--me");
    } else if (typeof message === "string" && message.startsWith("LEX:")) {
      li.classList.add("msg--bot");
    } else {
      li.classList.add("msg--system");
    }

    li.innerHTML = md.render(message);
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
      pushChat(emoji.emojify(message.data));
    } else {
      console.log(`Unrecognized event ${message.event} from server.`);
    }
  });

  chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
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
