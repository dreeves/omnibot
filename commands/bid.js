const store = require("../store.js");
// VOXMODE: One of 3 ways to reply to a user's command:
//  1. whisp: eat the command and reply so only the user sees it
//  2. holla: echo the command publicly and reply (holla back) publicly
//  3. blurt: eat the command but reply or say something publicly
//  4. cease: eat the command but reply to the initiating msid
//  (There's no voxmode for echoing the command publicly but replying privately
//   but if we ever have a use case for that, maybe we'll call it "kibitz".)

// Not using this yet.
const pumpkinThresh = {
  dreev: 100,
  bee: 100,
  mary: 1,
};

// Random integer from 1 to n inclusive
function randint(n) {
  return Math.floor(Math.random() * n) + 1;
}

// StackOverflow says this is how you check if a hash is empty in ES5
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

// Returns a hash of usernames (without the @'s) who are @-mentioned in txt
function bidParse(txt) {
  const pattern = /<@[a-z0-9_-|.]+>/gi; // regex for @-mentions, HT StackOverflow
  let users = {};
  if (txt.match(pattern)) {
    // RegExp.exec() might avoid doing match in 2 places
    txt.match(pattern).forEach(function (u) {
      users[u] = "";
    });
  }
  return users;
}

// Returns a string representation of the hash (user->bid) of everyone's bids
function bidSummary(bids) {
  // Ugh, Discord does strikeout ~~like this~~ and Slack ~like this~
  const row = (u) => (bids[u] ? `\t${u}: ${bids[u]}` : `\t~${u}~`);
  return Object.keys(bids).map(row).join("\n");
}

// Takes hash of users->bids, constructs a string like
// "Got bids from {...}, waiting on {...}"
function bidStatus(bids) {
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
}

// Returns whether any of the bids are missing
function bidMissing(bids) {
  return Object.keys(bids).some(function (x) {
    return bids[x] === "";
  });
}

// Initialize the auction and shot that it's started
function bidStart(chan, user, text, others) {
  others[user] = ""; // "others" now includes initiating user too
  store.set("beebot.auctions." + chan + ".bids", others);
  let auction = {};
  auction.urtext = "/bid " + text.trim();
  auction.initiator = user;
  store.set("beebot.auctions." + chan, auction);
  return `Auction started! ${bidStatus(others)}`;
}

// Deletes all the bids
function bidReset(chan) {
  store.del("beebot.auctions." + chan);
  store.del("beebot.auctions." + chan + ".bids");
}

// Just returns a string about whether to 10X the payments. Note that the /bid
// command doesn't actually parse out numbers or deal with payments in any way.
function bidPay() {
  const r = randint(10);
  const y =
    "_/roll 10 → 1 ∴ PAY 10X!_ :money_with_wings: :moneybag: :money_mouth_face:";
  const n = "_/roll 10 → " + r + " not 1 ∴ no payments!_ :sweat_smile:";
  return r === 1 ? y : n;
}

// Add text as user's bid, blurt the results if user is the last one to bid
function bidProc(chan, user, text) {
  const obj = store.get("beebot.auctions." + chan + ".bids");
  obj[user] = text;
  store.set("beebot.auctions." + chan + ".bids", obj);

  let response = {};
  if (bidMissing(obj)) {
    response.output = "New bid from " + user + "! " + bidStatus(obj);
    response.voxmode = "blurt";
  } else {
    bidReset(chan);

    response.output =
      `Got final bid from ${user}! :tada: Results:\n` +
      bidSummary(obj) +
      `\n\n${bidPay()}`;
    response.voxmode = "cease";
  }
  return response;
}

// whisper the documentation
function help() {
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
}

function status(auction, bids) {
  let output;
  let voxmode;
  if (auction) {
    output =
      `Currently active auction initiated by ${auction.initiator} via:\n` +
      `${auction.urtext}\n${bidStatus(bids)}`;
    voxmode = "holla";
  } else {
    output = "No current auction";
    voxmode = "whisp";
  }
  return { output, voxmode };
}

function abort(auction, channel, bids) {
  if (auction) {
    const output =
      `*Aborted.* :panda_face: Partial results:\n` +
      `${bidSummary(bids)}\n\n${bidPay()}`;
    bidReset(channel);
    return { output, voxmode: "cease" };
  } else {
    return { output: "No current auction", voxmode: "whisp" };
  }
}

function debug(auction, urtext) {
  return {
    output: auction
      ? `urtext = ${urtext} / datastore = ${JSON.stringify(datastore)}`
      : "No current auction",
    voxmode: "whisp",
  };
}

function printBids(auction, bids) {
  let output;
  if (auction) {
    output = `${bidStatus(bids)}`;
  } else {
    output = "No current auction";
  }
  return { output, voxmode: "holla" };
}

function maybeStart(auction, chan, user, text, others) {
  if (auction) {
    return {
      output: "No @-mentions allowed in bids! Try `/bid help`",
      voxmode: "whisp",
    };
  } else {
    return {
      output: bidStart(chan, user, text, others),
      voxmode: "holla",
    };
  }
}

function maybeProc(auction, channel, user, text) {
  if (auction) {
    return bidProc(channel, user, text);
  } else {
    return {
      output: "/bid " + text + "\nNo current auction! Try `/bid help`",
      voxmode: "whisp",
    };
  }
}

function handleSlash(chan, user, text) {
  const urtext = "/bid " + text + "\n";
  const others = bidParse(text);
  const auction = store.get("beebot.auctions." + chan);
  const bids = store.get("beebot.auctions." + chan + ".bids");

  if (!isEmpty(others)) {
    return maybeStart(auction, chan, user, text, others);
  }

  switch (text) {
    case "help":
      return help();
    case "status":
      return status(auction, bids);
    case "abort":
      return abort(auction, chan, bids);
    case "debug":
      return debug(auction, urtext);
    case "":
      return printBids(auction, bids);
    default:
      return maybeProc(auction, chan, user, text);
  }
}

function normalizeReply(orig, reply) {
  const { plat, user, priv, fief, chan } = orig;
  let normalized = reply;

  if (plat === "slack" && normalized.phem) {
    normalized.user = user;
  }

  if (priv) {
    normalized = {
      ...normalized,
      user,
      priv,
    };
  } else {
    normalized = {
      ...normalized,
      fief,
      chan,
    };
  }

  return normalized;
}

module.exports = async (sendmesg, input) => {
  const { plat, fief, chan, user, mesg, msid, priv } = input;
  if (priv) {
    const message = {
      plat,
      mesg: "Auctions in DMs aren't supported.",
      mrid: msid,
    };

    if (plat === "slack") {
      message.user = user;
      message.priv = true;
    }
    return sendmesg(message);
  }

  let auction = store.get("beebot.auctions." + chan);
  const response = handleSlash(chan, user, mesg || "");

  let commandReply = normalizeReply(input, {
    plat,
    mesg: "Roger that",
    phem: true,
    mrid: msid,
  });

  let message = normalizeReply(input, { plat, mesg: response.output });

  let responseMsid;
  if (response.voxmode === "holla") {
    message.mrid = msid;
    responseMsid = await sendmesg(message);
  } else if (response.voxmode === "cease") {
    if (auction && plat !== "slack") {
      message.mrid = auction.initialMsid;
      responseMsid = await sendmesg(commandReply);
    } else {
      message.mrid = msid;
    }

    await sendmesg(message);
  } else if (response.voxmode === "whisp") {
    message = normalizeReply(input, {
      plat,
      phem: true,
      mesg: response.output,
      mrid: msid,
    });
    await sendmesg(message);
  } else {
    responseMsid = await sendmesg(commandReply);
    await sendmesg(message);
  }

  if (!auction && store.get("beebot.auctions." + chan) && responseMsid) {
    auction = store.get("beebot.auctions." + chan);
    auction.initialMsid = responseMsid;
    store.set("beebot.auctions." + chan, auction);
  }
};
