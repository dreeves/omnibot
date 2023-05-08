// VOXMODE: One of 3 ways to reply to a user's command:
//  1. whisp: eat the command and reply so only the user sees it
//  2. holla: echo the command publicly and reply (holla back) publicly
//  3. blurt: say something publicly & asynchronously, no echoing any command

const datastore = {};

const options = [
  {
    name: "input",
    required: true,
    description: "Start an auction or place a sealed bid",
  },
];

// Bernoulli trial with probability p, not currently used
//var bern = function (p) { return Math.random() < p };

// Random integer from 1 to n inclusive
function randint(n) { return Math.floor(Math.random() * n) + 1 }

// StackOverflow says this is how you check if a hash is empty in ES5
function isEmpty(obj) { return Object.keys(obj).length === 0 }

// Returns a hash of usernames (without the @'s) who are @-mentioned in txt
var bidParse = function (txt) {
  var pattern = /<@[a-z0-9_-]+>/gi; // regex for @-mentions, HT StackOverflow
  var users = {};
  if (txt.match(pattern)) {
    // RegExp.exec() might avoid doing match in 2 places
    txt.match(pattern).forEach(function (u) { users[u] = "" });
  }
  return users;
};

// Returns a string representation of the hash (user->bid) of everyone's bids
var bidSummary = function (bids) {
  var row = function (u) {
    return bids[u] ? "\t" + u + ": " + bids[u] : "\t~" + u + "~";
  };
  return Object.keys(bids).map(row).join("\n");
};

// Takes hash of users->bids, constructs a string like
// "Got bids from {...}, waiting on {...}"
var bidStatus = function (bids) {
  return (
    "Got bids from {" +
    Object.keys(bids).filter(function (x) { return  bids[x] }).join(", ") +
    "}, waiting on {" +
    Object.keys(bids).filter(function (x) { return !bids[x] }).join(", ") + "}"
  );
};

// Returns whether any of the bids are missing
var bidMissing = function (bids) {
  return Object.keys(bids).some(function (x) {
    return bids[x] === "";
  });
};

// Initialize the auction and shot that it's started
var bidStart = function (chan, user, text, others) {
  others[user] = ""; // "others" now includes initiating user too
  datastore["beebot.auctions." + chan + ".bids"] = others;
  var auction = {};
  auction.urtext = "/bid " + text.trim();
  auction.initiator = user;
  datastore["beebot.auctions." + chan] = auction;
  return `Auction started! ${bidStatus(others)}`;
};

// Deletes all the bids
var bidReset = function (chan) {
  delete datastore["beebot.auctions." + chan];
  delete datastore["beebot.auctions." + chan + ".bids"];
};

// Just returns a string about whether to 10X the payments. Note that the /bid
// command doesn't actually parse out numbers or deal with payments in any way.
var bidPay = function () {
  const r = randint(10);
  const y =
    "/roll 10 → 1 ∴ PAY 10X! :money_with_wings: :moneybag: :money_mouth_face:";
  const n = "/roll 10 → " + r + " not 1 ∴ no payments! :sweat_smile:";
  return r === 1 ? y : n;
};

// Add text as user's bid, blurt the results if user is the last one to bid
var bidProc = function (chan, user, text) {
  const obj = datastore["beebot.auctions." + chan + ".bids"];
  obj[user] = text;

  let response = "";
  if (bidMissing(obj)) {
    response += "New bid from " + user + "! " + bidStatus(obj);
  } else {
    bidReset(chan);

    response += `Got final bid from ${user}! :tada: Results:\n` +
      bidSummary(obj) + `\n\n_${bidPay()}_`;
  }
  return response;
};

// whisper the documentation
var help = function () {
  return {
    output:
"How to use /bid\n" +
"`/bid stuff with @-mentions` — start new auction with the mentioned people\n" +
"`/bid stuff` — submit your bid (fine to resubmit till last person bids)\n" +
// currently thinking /bid with no args should just be disallowed
//"`/bid` (with no args) — check who has bid and who we're waiting on\n" +
"`/bid status` — show how current auction was initiated and who has bid\n" +
"`/bid abort` — abort the current auction, showing partial results\n" +
"`/bid help` — show this (see http://doc.bmndr.co/sealedbids for gory details)",
    voxmode: "whisp",
  };
};

var status = function (auction, bids) {
  let output;
  if (auction) {
    output = `Currently active auction initiated by ${obj.initiator} via:\n` +
      `${obj.urtext}\n${bidStatus(bids)}`;
  } else {
    output = "No current auction";
  }
  return { output, voxmode: "holla" };
};

var abort = function (auction, channel, bids) {
  if (auction) {
    const output = `*Aborted.* :panda_face: Partial results:\n` +
      `${bidSummary(bids)}\n\n_${bidPay()}_`;
    bidReset(channel);
    return { output, voxmode: "holla" };
  } else {
    return { output: "No current auction", voxmode: "whisp" };
  }
};

var debug = function (auction, urtext) {
  return {
    output: auction ? 
      `urtext = ${urtext} / datastore = ${JSON.stringify(datastore)}` : 
      "No current auction",
    voxmode: "whisp",
  };
};

var printBids = function (auction, bids) {
  let output;
  if (auction) {
    output = `${bidStatus(bids)}`;
  } else {
    output = "No current auction";
  }
  return { output, voxmode: "holla" };
};

var maybeStart = function (auction, chan, user, text, others) {
  if (auction) {
    return {
      output: "No @-mentions allowed in bids! Try `/bid help`",
      voxmode: "whisp",
    };
  } else {
    return { output: bidStart(chan, user, text, others), voxmode: "holla" };
  }
};

var maybeProc = function (auction, channel, user, text) {
  if (auction) {
    return { output: bidProc(channel, user, text), voxmode: "blurt" };
  } else {
    return {
      output: "/bid " + text + "\nNo current auction! Try `/bid help`",
      voxmode: "whisp",
    };
  }
};

var handleSlash = function (chan, user, text) {
  var urtext = "/bid " + text + "\n";
  var others = bidParse(text);
  const auction = datastore["beebot.auctions." + chan];
  const bids = datastore["beebot.auctions." + chan + ".bids"];

  if (!isEmpty(others)) {
    return maybeStart(auction, chan, user, text, others);
  }

  switch (text) {
    case "help":   return help();
    case "status": return status(auction, bids);
    case "abort":  return abort(auction, chan, bids);
    case "debug":  return debug(auction, urtext);
    case "":       return printBids(auction, bids);
    default:       return maybeProc(auction, chan, user, text);
  }
};

module.exports = {
  name: "bid",
  description: "Collect and later reveal sealed bids.",
  options,
  execute: ({ cid: clientId, sender, input }) => {
    return handleSlash(clientId, sender, input || "");
  },
};
