const options = [
  {
    name: "input",
    description: "Text to repeat back",
  },
];

// BOTILS -- bot utilities

// Bernoulli trial with probability p
var bern = function (p) {
  return Math.random() < p;
};

// Respond with string txt to everyone in the channel, echoing the slash command
var shout = function (res, txt) {
  res.send({ response_type: "in_channel", text: txt });
};

// Respond with string txt (and optional text attachment att) to just the user
// who issued the slash command, and don't echo their slash command. WHISPer.
var whisp = function (res, txt, att) {
  att = typeof att !== "undefined" ? att : null;
  res.send({
    response_type: "ephemeral",
    text: txt,
    attachments: [{ text: att }],
  });
};

// Post string txt to everyone in the channel, no echoing of the slash command
var shoutDelayed = function (rurl, txt) {
  request.post(
    rurl,
    {
      json: {
        response_type: "in_channel", // in_channel vs ephemeral
        text: txt,
      },
    },
    function (error, response, body) {}
  ); // error handling? pshaw.
};

// Random integer from 1 to n inclusive
var randint = function (n) {
  return Math.floor(Math.random() * n) + 1;
};

// StackOverflow says this is how you check if a hash is empty in ES5
var isEmpty = function (obj) {
  return Object.keys(obj).length === 0;
};

// MAIN BUSINESS LOGIC FOR /BID

const datastore = {};

// Returns a hash of usernames (without the @'s) who are @-mentioned in txt
var bidParse = function (txt) {
  var pattern = /\B@[a-z0-9_-]+/gi; // regex for @-mentions, HT StackOverflow
  var users = {};
  if (txt.match(pattern)) {
    // RegExp.exec() might avoid doing match in 2 places
    txt.match(pattern).forEach(function (u) {
      users[u.replace("@", "")] = "";
    });
  }
  return users;
};

// Returns a string representation of the hash (user->bid) of everyone's bids
var bidSummary = function (bids) {
  var row = function (u) {
    return bids[u] ? "\t@" + u + ": " + bids[u] : "\t~@" + u + "~";
  };
  return Object.keys(bids).map(row).join("\n");
};

// Takes hash of users->bids, constructs a string like
// "Got bids from {...}, waiting on {...}"
var bidStatus = function (bids) {
  return (
    "Got bids from {" +
    Object.keys(bids)
      .filter(function (x) {
        return bids[x];
      })
      .join(", ") +
    "}, waiting on {" +
    Object.keys(bids)
      .filter(function (x) {
        return !bids[x];
      })
      .join(", ") +
      "}"
  );
};

// Returns whether any of the bids are missing
var bidMissing = function (bids) {
  return Object.keys(bids).some(function (x) {
    return !bids[x];
  });
};

// Fetches the hash of bids, h, and then botils.shouts the string indicated by the
// template, substituting $SUMMARY and $STATUS with bidSummary(h) and
// bidStatus(h), respectively.
// (The goofiness with passing in a template and substituting is that hgetall
// is asynchronous. If it were synchronous we'd just fetch the hash of bids and
// then use that to format the output when ready to output it. Instead we need
// to pass a callback function to hgetall and let that function do whatever it's
// going to do with the bid hash -- in our case botils.shout it in the channel.)
var bidAsyncShout = function (res, chan, template) {
  const obj = datastore["beebot.auctions." + chan + ".bids"];
  botils.shout(
    res,
    template
      .replace("$SUMMARY", bidSummary(obj))
      .replace("$STATUS", bidStatus(obj))
  );
};

// Initialize the auction and shot that it's started
var bidStart = function (res, chan, user, text, others) {
  others[user] = ""; // "others" now includes initiating user too
  datastore["beebot.auctions." + chan + ".bids"] = others;
  var auction = {};
  auction.urtext = "/bid " + text.trim();
  auction.initiator = user;
  datastore["beebot.auctions." + chan] = auction;
  bidAsyncShout(res, chan, "Auction started! $STATUS");
};

// Deletes all the bids
var bidReset = function (chan) {
  delete datastore["beebot.auctions." + chan];
  delete datastore["beebot.auctions." + chan + ".bids"];
};

// Just returns a string about whether to 10X the payments. Note that the /bid
// command doesn't actually parse out numbers or deal with payments in any way.
var bidPay = function () {
  var y,
      n,
      r = botils.randint(10); // randint(10)==1 is the same as bern(.1)
  y =
    "/roll 10 → 1 ∴ PAY 10X! :money_with_wings: :moneybag: :money_mouth_face:";
  n = "/roll 10 → " + r + " not 1 ∴ no payments! :sweat_smile:";
  return r === 1 ? y : n;
};

// Add text as user's bid, botils.shout the results if user is the last one to bid
var bidProc = function (res, chan, user, text, rurl) {
  datastore["beebot.auctions." + chan + ".bids"] = {
    [user]: text,
  };

  const obj = datastore["beebot.auctions." + chan + ".bids"];

  botils.whisp(res, "Got your bid: " + text);
  if (bidMissing(obj)) {
    botils.shoutDelayed(rurl, "New bid from " + user + "! " + bidStatus(obj));
  } else {
    bidReset(chan);
    botils.shoutDelayed(
      rurl,
      "Got final bid from " +
        user +
        "! :tada: Results:\n" +
        bidSummary(obj) +
        "\n\n_" +
        bidPay() +
        "_"
    );
  }
};

// whisper the documentation
var help = function (res) {
  botils.whisp(
    res,
    "How to use /bid\n" +
      "`/bid stuff with @-mentions` start new auction with the mentioned people\n" +
      "`/bid stuff` submit your bid (fine to resubmit till last person bids)\n" +
      "`/bid` (with no args) check who has bid and who we're waiting on\n" +
      "`/bid status` show how current auction was initiated and who has bid\n" +
      "`/bid abort` abort the current auction, showing partial results\n" +
      "`/bid help` show this (see expost.padm.us/sealedbids for gory details)"
  );
};

var handleSlash = function (chan, user, text) {
  if (req.body.token != process.env.SLACK_TOKEN) {
    botils.whisp(res, "This request didn't come from Slack!");
    return;
  }
  var urtext = "*/bid " + text + "*\n";
  var others = bidParse(text);
  const obj = datastore["beebot.auctions." + chan];

  if (obj) {
    //--------------------------------- active auction in this channel
    if (!botils.isEmpty(others)) {
      botils.whisp(
        res,
        urtext + "No @-mentions allowed in bids! Try `/bid help`"
      );
    } else if (text === "") {
      // no args
      bidAsyncShout(res, chan, "$STATUS");
    } else if (text === "status") {
      bidAsyncShout(
        res,
        chan,
        "Currently active auction initiated by @" +
          obj.initiator +
          " via:\n`" +
          obj.urtext +
          "`\n$STATUS"
      );
    } else if (text === "abort") {
      bidAsyncShout(
        res,
        chan,
        "*Aborted.* :panda_face: Partial results:\n$SUMMARY" +
          "\n\n_" +
          bidPay() +
          "_"
      );
      bidReset(chan);
    } else if (text === "help") {
      help(res);
    } else if (text === "debug") {
      botils.whisp(
        res,
        urtext + "botils.whispered reply. obj = " + JSON.stringify(obj)
      );
      botils.shoutDelayed(
        rurl,
        "We can also reply publicly w/out echoing the cmd!"
      );
    } else {
      // if the text is anything else then it's a normal bid
      // could check if user has an old bid so we can say "Updated your bid"
      bidProc(res, chan, user, text, rurl);
    }
  } else {
    //------------------------------- no active auction in this channel
    if (!botils.isEmpty(others)) {
      bidStart(res, chan, user, text, others);
    } else if (text === "") {
      botils.whisp(res, urtext + "No current auction");
    } else if (text === "status") {
      botils.shout(res, "No current auction");
    } else if (text === "abort") {
      botils.whisp(res, urtext + "No current auction");
    } else if (text === "help") {
      help(res);
    } else if (text === "debug") {
      botils.whisp(res, urtext + "No current auction");
    } else {
      // if the text is anything else then it would be a normal bid
      botils.whisp(
        res,
        "/bid " + text + "\nNo current auction! Try `/bid help`"
      );
    }
  }
};

module.exports = {
  name: "bid",
  description: "Replies with its input.",
  options,
  execute: ({ cid: clientId, sender, input }) => {},
};
