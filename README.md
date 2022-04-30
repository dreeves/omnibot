## Discord Setup

Discord app portal:
https://discord.com/developers/applications/  
No need to specify on the Discord side where the bot is hosted; the bot can log in to Discord as long as it has the right API keys.
See the .env file for such secrets.

Handy tool for managing Discord slash commands:
https://autocode.com/tools/discord/command-builder/
from https://autocode.com/guides/how-to-build-a-discord-bot/

Another tutorial, for repl.it:
https://www.freecodecamp.org/news/create-a-discord-bot-with-javascript-nodejs/

## Slack Setup

* Add to slack: https://api.slack.com/apps/A011Z3TQ7BK
* Then you copy the generated bot token 
[from Slack](https://api.slack.com/apps/A011Z3TQ7BK/oauth ) into the `.env` file.
* Then invite the Lexiguess bot to your games channel.
* Maybe also specify the URL `https://lexiguess.onrender.com/slack/events` at https://api.slack.com/apps/A011Z3TQ7BK/event-subscriptions?

The `examples` folder has some templates from Slack that might be handy.

See Slack's 
[Getting Started Guide](https://api.slack.com/start/building/bolt) 
for their Bolt framework and the 
[Bolt documentation](https://slack.dev/bolt).

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
17. buddha nature where the bot makes up a purely lexical rule, describable with a regex? 
18. the word game Contact. having the bot think of the word may not work (humans can ask about words in obscure ways that the bot would have no hope of understanding) but the bot could guess words. like if the letters so far are "ca" it could guess "is it a small domesticated carnivorous mammal with soft fur, a short snout, and retractable claws?"
19. add an anki card when you learn a new thing #TIL

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
