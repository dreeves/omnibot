## Adding Omnibot to Your Server

### Discord

Use this oauth2 link to add omnibot to your Discord server:
https://discord.com/api/oauth2/authorize?client_id=911686934206771212&permissions=2048&scope=bot%20applications.commands

### Slack

Use this oauth2 link to add omnibot to your Slack workspace:
https://slack.com/oauth/v2/authorize?client_id=17414190871.1067129823393&scope=channels:history,channels:read,chat:write,commands,im:history,im:read,mpim:history,users:read,groups:history,groups:read,im:write,mpim:read&user_scope=

## Building and Running

### Discord Setup

1. Go to the Discord app portal and create a new application:
   https://discord.com/developers/applications/
2. In the bot user's settings, Enable the server members intent and
   the message content intent.
3. Add client id, client secret, and bot token to .env file
4. Create an invite link with the following permissions:
   - [ ] applications.commands
   - [ ] bot
   - [ ] Send Messages

### Slack Setup

1. Go to your Slack applications and create a new application:
   https://api.slack.com/apps
2. Use the manifest provided in this repo to create the application
3. click Install to Workspace and click Allow
4. Copy app id, client id, and client secret into .env file
5. Generate an app token with the connections:write scope and copy it
   to the .env file
6. Go to Oauth menu and copy bot token to .env file
7. Invite Omnibot to your #games channel

### Enable Socket Mode for Slack

Slack bots need to serve an endpoint to receive Slack events. 
This would make development painful, so there's "socket mode" which doesn't have
the endpoint requirement. 
Socket mode is recommended only for development by the documentation for reasons
not given.

Omnibot currently looks for the environment variable DEBUG when it starts up. 
If this variable is set to anything (and environment variables are strings, so I
do mean anything: even false, 0, etc.), Omnibot uses socket mode.

In order to use socket mode, however, socket mode must be toggled on in the 
app's configuration.

In order to use socket mode locally, you have to both set DEBUG in your 
environment and make sure socket mode is turned on in the app's configuration. 
This will likely cause live instances of Omnibot to fail on Slack. 
When you're finished testing locally, you'll need to make sure to turn socket 
mode off again.

https://api.slack.com/apis/connections/socket

### Locally

1. Install the npm packages.
```
npm install
```

2. If you've made changes to the bot command definitions, *excluding changes to
   the body of the execute function*, you will need to register those changes 
   with Discord.
```
npm run register
```

3. Build and run the server.
```
npm run start
```

### Render.com

1. Navigate to **Settings**, then to **Build & Deploy**.
2. Set **Build Command** to `npm install && npm run build`.
3. Set **Start Command** to `npm run start`.

### Registering Bot Commands

Whenever a new command is defined or an existing command is *redefined*, the 
commands need to be registered with Discord. 
Run `node run register` to do this.

Discord rate-limits command registrations.

Note that you do *not* need to re-register commands if you've only changed the 
contents of the command's execute function.

## Lexiguess Background

Lexiguess was inspired by https://hryanjones.com/guess-my-word/
There are many other implementations out there as well, like Betweenle.

## Core Data Structure

The core data struction for Omnibot is called a chum -- CHannel-User-Message.
An incoming chum has the following fields:

* plat -- The platform, like Discord or Slack or Web.
* fief -- What Discord calls a server and Slack calls a workspace.
* chan -- Channel.
* user -- Username of the person who sent this message. [deprecated]
* usid -- The user's ID. [look up the username with this as needed]
* mesg -- The contents of the message.
* msid -- The message ID or interaction ID.
* priv -- Whether it's a DM.

For outgoing chums we need:

* plat
* fief/chan XOR usid/priv
* mesg
* mrid -- The ID of the message this message is replying to.

Wait, this is dumb, there's no "outgoing chum", we just want two versions of 
sendmesg:

sendDM(plat, fief, usid, mesg, mrid)
sendCH(plat, fief, chan, mesg, mrid)

Also I don't think we want a boolean for whether a chum is a DM.
Rather, we want a magic string for the channel (I think maybe Discord already
uses something like "@me" for the channel when it's a DM?).
And then fief can just be ignored for Discord.
For Slack, DMs are specific to the workspace you're in, so fief matters for DMs
on Slack.

Now I'm having second thoughts about two versions of sendmesg. Consider:

sendmesg(plat, fief, chan, usid, mesg, mrid)

If that's a channel message: usid is ignored, or must be null.
If that's a DM: chan will be "@me" or whatever magic string, fief will be
ignored in the case of Discord (but maybe needed for Slack), and mrid can be
omitted if what you're sending isn't a reply to any message.


In any case, I don't like shoehorning chums for the parameters to sendmesg.
Incoming and outgoing chums conceptually have the following in common:
  plat, fief, chan, mesg
Incoming chums additionally have usid.
Outgoing chums only have usid if chan is DM (or overload chan as usid?).

Could chan be overloaded so it's just the user ID itself if the channel is a DM?
I guess channel IDs and user IDs would have to be structurally distinct, if we
want to avoid a separate this-is-a-DM field.


Randomly, I'm fond of the fro/yon fields we use internally for Beeminder's 
honey money credit entries.
Probably that doesn't make sense here though.
We're either processing an incoming chum from a user which is necessarily to
Omnibot, or we're calling sendmesg which is necessarily from Omnibot.

## Platform-specific notes

### Discord

- Received commands must be replied to within 3 seconds, or the user will see an
error message.
The time limit could be extended to 15 minutes if we used deferred replies.
- Replies _after_ the initial reply may be sent within a 15-minute window after
the initial reply. 
This cannot be extended.
- Ephemeral messages can only be created as a reply to a command. 
When using `phem`, `mrid` must be the ID of a command (prefixed with 
"interaction:"). 
Specifying `user` is meaningless and therefore prohibited.
- `sendmesg` returns the ID of the sent message.

### Slack

- Same as Discord, received commands must be replied to within 3 seconds, or the
user will see an error message.
- `fief` does nothing on Slack, as using it requires an enterprise account. 
It's still required by sendmesg in order to maintain consistency with other 
platforms and reduce the amount of platform-specific code in sendmesg.
- `sendmesg` does not return the ID of the sent message.

## CHANGELOG

```
2025-12-28: Fix regression with /bid
2025-10-30: Much better /roll command
2025-10-29: More robust /omninom command, lots of refactoring
2025-10-18: More fussing and improvements I lost track of
2025-05-11: Lots of refactoring and polishing
2025-04-08: Attempted fixes for the /roll command
2023-05-12: Oops we haven't updated the changelog in ages
2022-09-27: Bumping the discord.js version fixed the duplicate replies bug
2022-03-10: Added template.env, greater portability
2021-12-19: Works in Slack and Discord and can serve web pages
2021-12-05: A bunch of words contributed by Madge Castle
2021-12-04: Over 500 words in the list the bot chooses from
2021-12-01: Refactor to use a state object/hash
2021-04-20: Update the README
2020-04-19: Various tweaks and fixes the last few days
2020-04-14: Bugfix with when to complain about out-of-range words
2020-04-14: Bugfix with dups
2020-04-13: Ignore anything with punctuation or less than 2 letters
2020-04-12: Initial version
```

## Namestorming

Omnibot stuck for a while and it's a fine name but a little grandiose-sounding and technically taken by a 1980s toy.
I've grabbed two candidate domain names -- beelzebot.com and motleybot.com.

1. Beelzebot, or beelz for short. 
beelzebot.com
(Beelzebub, pronounced bee-EL-zuh-bub, is an ancient name for the devil. 
See also the amazing 
[Stephen Lynch song](https://www.youtube.com/watch?v=5BeYXjBfrdg "My real name is Beelzebub but you can call me Beelz. I like to watch Fox News and then go club some baby seals").)

2. Motleybot, or botley for short. 
motleybot.com 
(Motley means made up of incongruous elements.)

Runners up: 
* botany (the any-bot) I still love, especially because it can also be read as a Bethany portmanteau. The closest domain, botanybot.com, costs $1.2k.
* Botshalom or shabbot or shabot or shabbotshalom -- hilarious but maybe too unclear which of those variants to go with.

Goal: totally general bot where we separate the business logic from the slack/sms/whatever connectivity, let it also have a web interface so anyone can try it out instantly at a certain URL and it just does all the things...

Domain names:
beelzebot.com
motleybot.com

Namestorming: http://allourideas.org/bot

omnibot, beebot, botbrain, beebotty, diabot, diabotical, unibot, beezlebot, cosmobot, ubiquibot, globot, panbot, infinibot, pluribot, communibot, cobot, loquella, shabotshalom, botshalom, beelzebot, nobotty, spottybot, motleybot, botley, cybot, jreeves, botchy, botulism, botany, bottum, bottabing, decepticon, lexibot, biddybot, botler the butler bot, urbot

rejects:  
beeotch, beeot, collocutio, locutio, yootlebot, tweedlebot, waddlebot, botbot, ubeequibot, poobot, transbot, brobot, probot, cybeeriad, cybernetica, lobotomy, lobot, gobot, autobot, botsoule, botsel, botch, skynet

## Other Bot Ideas

1. guestbot (but this is more about a web UI proxy to slack)
2. lexiguess of course 
3. everything the current Beeminder Slack bot does including auctions and dice rolling and tocks and karma (also: eigenkarma!)
4. the Beeminder SMS bot
5. taskbot? forsterbot? or http://doc.bmndr.co/elo where you tell the bot your to-dos and it feeds them back to you in pairs asking which you'd prefer to do first
6. http://yootl.es/nims?
7. paybot ledger interface
8. lovebot
9. cobot
10. a million command line tools that work beautifully via a bot
11. wits&wagers (where anyone can contribute numerical facts?) and wavelength and wordle and other word games
12. other word game ideas at http://doc.dreev.es/fun
13. codenames where the bot is codemaster by finding synonyms (or synonyms of synonyms if needed) in common between words
14. the coordination game aka the schelling game, which we can already play with just the /bid command
15. boggle (but how to keep the board visible the whole time?)
16. ankified word-of-the-day bot
17. buddha nature where the bot makes up a purely lexical rule, describable with a regex? PS: I was scooped! https://regexle.ithea.de (well, I guess I implemented it first but only for myself, in Mathematica. See buddhabot.nb)
18. the word game Contact. having the bot think of the word may not work (humans can ask about words in obscure ways that the bot would have no hope of understanding) but the bot could guess words. like if the letters so far are "ca" it could guess "is it a small domesticated carnivorous mammal with soft fur, a short snout, and retractable claws?"
19. add an anki card when you learn a new thing #TIL
20. molecall.com

// Ideas for future slash commands...
// Predictionbook bot:
// /bet such-and-such happens p=.3 #foo
// Karmabot (needs to be opt-in):
// /karma on
// TagTime (start with just announcing pings on the universal schedule)
// /tagtime on


## Chat Platforms

1. slack
2. discord
3. whatsapp
4. gchat nee hangouts: https://github.com/simon-weber/gchatautorespond
5. sms
6. fbmessenger
7. signal
8. irc 
9. telegram


## SCRATCH AREA

https://untitledbot.dreev.repl.co/slack/events  
https://lexiguess.glitch.me/slack/events  
