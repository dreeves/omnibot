import emoji from "node-emoji";

window.addEventListener("load", () => {
  let history = []
  const chatHistory = document.getElementById('chat-history')
  const chatInput = document.getElementById('chat-input')

  function pushChat (message) {
    history.push(message)
    chatHistory.innerHTML = history.map((line) => `<li>${line}</li>`).join('\n')
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(
    `${protocol}:${window.location.hostname}:${window.location.port}`
  );

  socket.addEventListener("message", (e) => {
    pushChat(emoji.emojify(e.data));
  });

  chatInput.addEventListener('keypress', (event) => {
    if (event.key === "Enter") {
      socket.send(chatInput.value)
      chatInput.value = ''
    }
  })
});
