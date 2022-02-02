"use strict";
const CLOG = console.log
CLOG("Omnibot / Lexiguess!")

// -----------------------------------------------------------------------------
// -------- Initialization, create and start server, log in to Discord ---------

const { lexup } = require('./lexiguess.js')

const express = require('express')
const { App, ExpressReceiver } = require("@slack/bolt")
const receiver = new ExpressReceiver({ 
  signingSecret: process.env.SLACK_SIGNING_SECRET
})
receiver.router.use(express.static('public'))
//receiver.router.use(express.json()) // if we wanted more than static pages
const app = new App({ token: process.env.SLACK_BOT_TOKEN, receiver })
;(async () => { 
  await app.start(process.env.PORT || 3000)
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

discord.on("messageCreate", msg => {
  const cid = msg.channel.name // string identifier for this server/channel
  const usaid = msg.content
  if (!/^[a-z]{2,}$/i.test(usaid)) return null // DRY up this regex
  if (!/^(?:botspam|games|lexi.*|spellingbee)$/.test(cid)) return null
  const reply = lexup(cid, usaid)
  //CLOG(`${cid}: ${usaid} -> ${reply}`)
  if (reply !== null) msg.reply(reply) // alt.: msg.channel.send(reply)
})

// Someone says a single strictly alphabetic word in a channel our bot is in
app.message(/^\s*([a-z]{2,})\s*$/i, async ({ context, say }) => { // DRY me
  const cid = context.teamId // string identifier for this server/channel
  const usaid = context.matches[0] // the string the user typed
  const reply = lexup(cid, usaid)
  //CLOG(`${cid}: ${usaid} -> ${reply}`)
  if (reply !== null) await say(reply)  
})

// Someone clicks on the Home tab of our app; render the page
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

