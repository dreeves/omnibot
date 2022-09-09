"use strict";
const CLOG = console.log
CLOG("Omnibot / Lexiguess!")

// -----------------------------------------------------------------------------
// -------- Initialization, create and start server, log in to Discord ---------

require('dotenv').config() // or import 'dotenv/config'

const { lexup } = require('./lexiguess.js')

const ws = require('ws')
const { generateSlug } = require('random-word-slugs')
const express = require('express')
const { App, ExpressReceiver } = require("@slack/bolt")
const receiver = new ExpressReceiver({ 
  signingSecret: process.env.SLACK_SIGNING_SECRET
})
receiver.router.use(express.static('public'))
receiver.router.use('/lib', express.static('node_modules'))
//receiver.router.use(express.json()) // if we wanted more than static pages
const app = new App({ token: process.env.SLACK_BOT_TOKEN, receiver })
;(async () => { 
  const server = await app.start(process.env.PORT || 3000)
  server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
      wsServer.emit('connection', socket, request)
    })
  })

  CLOG('Lexiguess app is running; listening for events from Slack / the web')
})()

const Discord = require("discord.js")
const discord = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] })
discord.login(process.env.DISCORD_BOT_TOKEN)
discord.once('ready', () => {
  CLOG(`Lexiguess app is running; logged in to Discord as ${discord.user.tag}`)
})
CLOG('Packages loaded')

// discord botspam channel id = 847897704632942632

// -----------------------------------------------------------------------------
// ------------------------------ Event Handlers -------------------------------

discord.on("messageCreate", async msg => {
  if (msg.author.bot) {
    return
  }

  const cid = msg.channel.name // string identifier for this server/channel
  const usaid = msg.content
  if (!/^[a-z]{2,}$/i.test(usaid)) return // DRY up this regex
  if (!/^(?:botspam|games|lexi.*|spellingbee)$/.test(cid)) return
  const reply = lexup(cid, usaid)
  //CLOG(`${cid}: ${usaid} -> ${reply}`)
  if (reply !== null) await msg.reply(reply) // alt.: msg.channel.send(reply)
})

// Someone says a single strictly alphabetic word in a channel our bot is in
app.message(/^\s*([a-z]{2,})\s*$/i, async ({ context, say }) => { // DRY me
  const cid = context.teamId // string identifier for this server/channel
  const usaid = context.matches[0] // the string the user typed
  const reply = lexup(cid, usaid)
  //CLOG(`${cid}: ${usaid} -> ${reply}`)
  if (reply !== null) await say(reply)  
})

// Someone clicks on the Home tab of our app in Slack; render the page
app.event('app_home_opened', async ({event, context}) => {
  try {
    CLOG(`Home tab opened in Slack by user ${event.user}`)
    await app.client.views.publish({
      token: context.botToken,
      user_id: event.user,             // user who opened our app's app home tab
      view: {               // the view payload that appears in the app home tab
        type: 'home',
        callback_id: 'home_view',
        blocks: [                                            // body of the view
          { "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Welcome to Lexiguess :books:",
            }
          },
          { "type": "divider" },
          { "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `\
Instructions: The bot totally ignores anything that isn't a single word \
(at least 2 letters, no punctuation). \
That's really all you need to know. \
Everything else should be self-explanatory.`,
            }
          },
        ]
      }
    })
  } catch (error) { console.error(error) }
})


// Web Client
const clientNames = {}
const wsServer = new ws.Server({ noServer: true })
wsServer.on('connection', (socket, req) => {
  const ip = req.socket.remoteAddress
  if (!clientNames[ip]) {
    clientNames[ip] = generateSlug(2)
  }

  const name = clientNames[ip]

  socket.send('Lexiguess!')
  wsServer.clients.forEach(s => s.send(`${name} has joined the game.`))

  socket.on('message', message => {
    wsServer.clients.forEach(s => s.send(`${name}: ${message}`))
    if (!/^[a-z]{2,}$/i.test(message)) return null // DRY up this regex
    const reply = lexup('webclient', message)
    if (reply !== null) wsServer.clients.forEach(s => 
      s.send(`LEX: ${reply}`))
  })

  socket.on('close', () => {
    wsServer.clients.forEach(s => s.send(`${name} has left the game.`))
  })
})

process.on('SIGINT', () => {
  CLOG('Shutting down!')
  wsServer.clients.forEach(s => s.send('Server is shutting down! This is most likely a deliberate act by the admin.'))
  discord.destroy()
  process.exit()
})
