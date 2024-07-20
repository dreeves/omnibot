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

## CHANGELOG

```
2020-04-12: Initial version
2020-04-13: Ignore anything with punctuation or less than 2 letters
2020-04-14: Bugfix with when to complain about out-of-range words
2020-04-14: Bugfix with dups
2020-04-19: Various tweaks and fixes the last few days
2021-04-20: Update the README
2021-12-01: Refactor to use a state object/hash
2021-12-04: Over 500 words in the list the bot chooses from
2021-12-05: A bunch of words contributed by Madge Castle
2021-12-19: Works in Slack and Discord and can serve web pages
2022-03-10: Added template.env, greater portability
2022-09-27: Bumping the discord.js version fixed the duplicate replies bug
2023-05-12: Oops we haven't updated the changelog in ages
```

## Generalizing to an omnibot

Top contenders for the name include botler, botley, beelz, shabot, urbot, omnibot, ...

Goal: totally general bot where we separate the business logic from the slack/sms/whatever connectivity, let it also have a web interface so anyone can try it out instantly at a certain URL and it just does all the things...

Namestorming: http://allourideas.org/bot

beebot, botbrain, beebotty, diabot, diabotical, unibot, beezlebot, cosmobot, ubiquibot, globot, panbot, infinibot, pluribot, communibot, cobot, loquella, shabotshalom, botshalom, beelzebot, nobotty, spottybot, motleybot, botley, cybot, jreeves, botchy, botulism, botany, bottum, bottabing, decepticon, lexibot, biddybot, skynet,

rejects:  
beeotch, beeot, collocutio, locutio, yootlebot, tweedlebot, waddlebot, botbot, ubeequibot, poobot, transbot, brobot, probot, cybeeriad, cybernetica, lobotomy, lobot, gobot, autobot, botsoule, botsel, botch,

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
