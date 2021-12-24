TODO: merge in README from botley.glitch.me

Discord app portal:
https://discord.com/developers/applications/

Handy tool for managing Discord slash commands:
https://autocode.com/tools/discord/command-builder/



specifying the URL in slack:
https://api.slack.com/apps/A011Z3TQ7BK/event-subscriptions?

https://untitledbot.dreev.repl.co/slack/events
https://lexiguess.glitch.me/slack/events

## To install in Slack

* Add to slack: https://api.slack.com/apps/A011Z3TQ7BK
* Then you copy the generated bot token 
[from Slack](https://api.slack.com/apps/A011Z3TQ7BK/oauth ) into the `.env` file.
* Then invite the Lexiguess bot to your games channel.

## Background

This is inspired by https://hryanjones.com/guess-my-word/

The `examples` folder has some templates from Slack that might be handy.

See Slack's [Getting Started Guide](https://api.slack.com/start/building/bolt) for their Bolt framework and the 
[Bolt documentation](https://slack.dev/bolt).

(I've spent 10.5 hours on this as of version 1.0.2)

Other bot ideas:

1. wits and wagers (where anyone can contribute numerical facts)
2. codenames where the bot is codemaster by finding synonyms (or synonyms of synonyms if needed) in common between words
3. the coordination game aka the schelling game, which we can already play with just the /bid command
4. boggle (but how to keep the board visible the whole time?)
5. ankified word-of-the-day bot
6. buddha nature where the bot makes up a purely lexical rule, describable with a regex? 

and probably not bottable but there's a great game we play (and we played with the wolf-nixes when they were here) called contact (i don't know why "contact" and probably we should rename it).

PS: having the bot think of the word may not work (humans can ask about words in obscure ways that the bot would have no hope of understanding) but the bot could guess words. like if the letters so far are "ca" it could guess "is it a small domesticated carnivorous mammal with soft fur, a short snout, and retractable claws?"

CHANGELOG

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
```