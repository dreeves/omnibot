# Rules for Agents 
 
0. Don't edit these rules. Only edit the scratchpad area below.
1. Before finalizing your response, reread it and ask yourself if it's impeccably, exquisitely, technically correct and true.
2. Never modify human-written comments, not even a tiny bit. LLMs will often slightly rephrase things when copying them. That drives me insane. Always preserve the exact characters, even whitespace. 
3. Don't ever delete human-written code. Instead you can comment it out and add your own comment about why it's safe to delete.
4. Never say "you're absolutely right" or any other form of sycophancy or even mild praise. Really zero personality of any kind. 
5. Follow Beeminder's [Pareto Dominance Principle (PDP)](https://blog.beeminder.com/pdp). Get explicit approval if any change would not be a Pareto improvement.
6. Follow Beeminder's [Anti-Magic Principle](https://blog.beeminder.com/magic). Don't fix problems by adding if-statements. Even if you're fixing a bug like "when X happens the app does Y instead of Z", resist the urge to add "if X then Z". If you're sure an if-statement is needed, make the case to me, the human.
7. Follow Beeminder's [Anti-Robustness Principle](https://blog.beeminder.com/postel) aka Anti-Postel. Fail loudly and immediately. Never silently fix inputs. See also the branch of defensive programming known as offensive programming.
8. We [call them quals](https://blog.beeminder.com/quals), not tests.


# Agent Scratchpad (human edits only above this line)

Slack version of the /bid command before it became a crufty mess:

// Respond with string txt to everyone in the channel, echoing the slash command
function shout(res, txt) {
  res.send({ "response_type": "in_channel", "text": txt })
}

// Respond with string txt (and optional text attachment att) to just the user
// who issued the slash command, and don't echo their slash command. WHISPer.
function whisp(res, txt, att) {
  att = typeof att !== 'undefined' ? att : null
  res.send({ "response_type": "ephemeral",
             "text": txt,
             "attachments": [{"text": att}]})
}

// Post string txt to everyone in the channel, no echoing of the slash command
function shoutDelayed(rurl, txt) {
  request.post(rurl, { json: {
    "response_type": "in_channel", // in_channel vs ephemeral
    "text": txt}
  }, function(error, response, body) { }) // error handling? pshaw.
}

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}

// Returns a hash of usernames (without the @'s) who are @-mentioned in txt
function bidParse(txt) {
  var pattern = /\B@[a-z0-9_-]+/gi // regex for @-mentions, HT StackOverflow
  var users = {}
  if(txt.match(pattern)) { // RegExp.exec() might avoid doing match in 2 places
    txt.match(pattern).forEach(function(u) { users[u.replace("@", "")] = "" })
  }
  return users
}

// Returns a string representation of the hash (user->bid) of everyone's bids
function bidSummary(bids) {
  var row = function(u) { return bids[u] ? "\t@" + u + ": " + bids[u]
                                         : "\t~@" + u + "~" }
  return Object.keys(bids).map(row).join("\n")
}

// Takes hash of users->bids, constructs a string like
// "Got bids from {...}, waiting on {...}"
function bidStatus(bids) {
  return "Got bids from {"
    + Object.keys(bids).filter(function(x) { return  bids[x] }).join(", ")
    + "}, waiting on {"
    + Object.keys(bids).filter(function(x) { return !bids[x] }).join(", ")
    + "}"
}

// Returns whether any of the bids are missing
function bidMissing(bids) {
  return Object.keys(bids).some(function(x) { return !bids[x] })
}

// Fetches the hash of bids, h, and then shouts the string indicated by the
// template, substituting $SUMMARY and $STATUS with bidSummary(h) and
// bidStatus(h), respectively.
// (The goofiness with passing in a template and substituting is that hgetall
// is asynchronous. If it were synchronous we'd just fetch the hash of bids and
// then use that to format the output when ready to output it. Instead we need
// to pass a callback function to hgetall and let that function do whatever it's
// going to do with the bid hash -- in our case shout it in the channel.)
function bidAsyncShout(res, chan, template) {
  redis.hgetall("beebot.auctions." + chan + ".bids", function(err, obj) {
    shout(res, template.replace("$SUMMARY", bidSummary(obj))
                       .replace("$STATUS",  bidStatus(obj)))
  })
}

// Initialize the auction and shout that it's started
function bidStart(res, chan, user, text, others) {
  others[user] = "" // "others" now includes initiating user too
  redis.hmset("beebot.auctions." + chan + ".bids", others, function(err,obj){})
  var auction = {}
  auction.urtext = "/bid " + text.trim()
  auction.initiator = user
  redis.hmset("beebot.auctions." + chan, auction, function(err, obj) {
    bidAsyncShout(res, chan, "Auction started! $STATUS")
  })
}

// Deletes all the bids
function bidReset(chan) {
  redis.hgetall("beebot.auctions." + chan, function(err, obj) {
    redis.del("beebot.auctions." + chan, function(err, obj) {
      redis.del("beebot.auctions." + chan + ".bids", function(err, obj) { })
    })
  })
}

// Just returns a string about whether to 10X the payments. Note that the /bid
// command doesn't actually parse out numbers or deal with payments in any way.
function bidPay() {
  var y, n, r = randint(10) // randint(10)==1 is the same as bern(.1)
  y = "/roll 10 → 1 ∴ PAY 10X! :money_with_wings: :moneybag: :money_mouth_face:"
  n = "/roll 10 → " + r + " not 1 ∴ no payments! :sweat_smile:"
  return (r === 1 ? y : n)
}

// Add text as user's bid, shout the results if user is the last one to bid
function bidProc(res, chan, user, text, rurl) {
  redis.hset("beebot.auctions." + chan + ".bids", user, text,
    function(err, obj) {
      redis.hgetall("beebot.auctions." + chan + ".bids",
        function(err, obj) { // obj is now the hash from users to bids
          whisp(res, "Got your bid: " + text)
          if(bidMissing(obj)) {
            shoutDelayed(rurl, "New bid from " + user + "! " + bidStatus(obj))
          } else {
            bidReset(chan)
            shoutDelayed(rurl,
              "Got final bid from " + user + "! :tada: Results:\n"
              + bidSummary(obj) + "\n\n_" + bidPay() + "_")
          }
        })
    })
}

// whisper the documentation
function help(res) {
  whisp(res, "How to use /bid\n"
  + "`/bid stuff with @-mentions` start new auction with the mentioned people\n"
  + "`/bid stuff` submit your bid (fine to resubmit till last person bids)\n"
  + "`/bid` (with no args) check who has bid and who we're waiting on\n"
  + "`/bid status` show how current auction was initiated and who has bid\n"
  + "`/bid abort` abort the current auction, showing partial results\n"
  + "`/bid help` show this (see expost.padm.us/sealedbids for gory details)")
}

function handleSlash(req, res) {
  if(req.body.token != process.env.SLACK_TOKEN) {
    whisp(res, "This request didn't come from Slack!")
    return
  }
  var rurl = req.body.response_url // for delayed responses to slash commands
  var chan = req.body.channel_id
  var user = req.body.user_name
  var text = req.body.text
  var urtext = "*/bid " + text + "*\n"
  var others = bidParse(text)
  redis.hgetall("beebot.auctions." + chan, function(err, obj) {
    if(obj) { //--------------------------------- active auction in this channel
      if(!isEmpty(others)) {
        whisp(res, urtext + "No @-mentions allowed in bids! Try `/bid help`")
      } else if(text === "") { // no args
        bidAsyncShout(res, chan, "$STATUS")
      } else if(text === "status") {
        bidAsyncShout(res, chan, "Currently active auction initiated by @"
          + obj.initiator + " via:\n`" + obj.urtext + "`\n$STATUS")
      } else if(text === "abort") {
        bidAsyncShout(res, chan,
          "*Aborted.* :panda_face: Partial results:\n$SUMMARY"
          + "\n\n_" + bidPay() + "_")
        bidReset(chan)
      } else if(text === "help") {
        help(res)
      } else if(text === "debug")  {
        whisp(res, urtext + "whispered reply. obj = " + JSON.stringify(obj))
        shoutDelayed(rurl, "We can also reply publicly w/out echoing the cmd!")
      } else {  // if the text is anything else then it's a normal bid
        // could check if user has an old bid so we can say "Updated your bid"
        bidProc(res, chan, user, text, rurl)
      }
    } else { //------------------------------- no active auction in this channel
      if(!isEmpty(others))       { bidStart(res, chan, user, text, others) }
      else if(text === "")       { whisp(res, urtext + "No current auction") }
      else if(text === "status") { shout(res, "No current auction") }
      else if(text === "abort")  { whisp(res, urtext + "No current auction") }
      else if(text === "help")   { help(res) }
      else if(text === "debug")  { whisp(res, urtext + "No current auction") }
      else { // if the text is anything else then it would be a normal bid
        whisp(res, "/bid " + text + "\nNo current auction! Try `/bid help`")
      }
    }
  })
}

module.exports = { handleSlash }
