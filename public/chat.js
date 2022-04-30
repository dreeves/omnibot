import { Terminal } from "xterm";
import { Readline } from "xterm-readline"
import emoji from 'node-emoji'

window.addEventListener("load", () => {
    const term = new Terminal()
    const rl = new Readline()

    term.loadAddon(rl)
    term.open(document.getElementById("terminal"))
    term.focus()

    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    const socket = new WebSocket(
        `${protocol}:${window.location.hostname}:${window.location.port}`
    )

    socket.addEventListener("message", (e) => {
        term.writeln(emoji.emojify(e.data))
    })

    const prompt = () => rl.read('').then((text) => socket.send(text)).then(prompt)

    prompt()
})
