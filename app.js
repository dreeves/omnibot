"use strict";
const CLOG = console.log
CLOG("Omnibot / Lexiguess!")

// -----------------------------------------------------------------------------
// -------- Initialization, create and start server, log in to Discord ---------

require('dotenv').config() // or import 'dotenv/config'

const { lexup } = require('./lexiguess.js')

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

process.on('exit', () => {
  CLOG('Shutting down!')
  discord.destroy()
})
