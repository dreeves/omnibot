// I propose that it would be cleaner to split /bid into two commands:
// /auction to start an auction, check status, get help, abort, etc.
// Then /bid would only be for submitting bids to an existing auction.
// Namestorming: /auction /despoil /schelling /coord /seal 

// Is it worth the magic of automatically including the initiating user in the
// auction? Argument for yes: In practice you always want to be part of auctions
// you start. And if you ever didn't you could just submit a dummy bid 
// immediately after creating the auction. The auction would then proceed as if
// you had never been included.

// What should happen if you @-mention omnibot? Currently it just includes it in
// the auction like any other user, but it has no way to place a bid. We could
// something easter-eggy and "bid" an excerpt of a poem or something.

// VOXMODE: One of 4 ways to reply to a user's command:
//  1. whisp: eat the command and reply so only the user sees it, aka ephem
//  2. holla: echo the command publicly and reply (holla back) publicly
//  3. blurt: eat the command but reply or say something publicly
//  4. cease: eat the command but reply to the initiating msid
//  (There's no voxmode for echoing the command publicly but replying privately
//   but if we ever have a use case for that, maybe we'll call it "kibitz".)
// Hmm, these voxmodes aren't matching what we came up with for /omninom


//const BID = "bid"; // name of this slash command

const { randint } = require('../util.js');

const store = require("../store.js");


// Not using this yet.
const pumpkinThresh = {
  dreev: 100,
  bee: 100,
  mary: 1,
};

function isEmpty(obj) { return Object.keys(obj).length === 0 }

// Return a hash of usernames (without the @'s) who are @-mentioned in txt
function bidParse(txt) {
  const pattern = /<@[a-z0-9_-|.]+>/gi; // regex for @-mentions HT StackOverflow
  let users = {};
  if (txt.match(pattern)) {
    // RegExp.exec() might avoid doing match in 2 places
    txt.match(pattern).forEach(u => { users[u] = "" }); // should be null
  }
  return users
}
// likely better version to try later:
/*
// Return a hash of user IDs mentioned in txt (Slack format: <@U123|label>)
function bidParse(txt) {
  const users = {};
  const re = /<@([A-Z0-9]+)(?:\|[^>]+)?>/g;
  for (const [, id] of txt.matchAll(re)) users[id] = null;
  return users;
}
*/

// Return a string representation of the hash (user->bid) of everyone's bids
function bidSummary(bids) {
  // Discord does strikeout ~~like this~~ and Slack ~like this~
  const row = (u) => (bids[u] ? `\t${u}: ${bids[u]}` : `\t~~${u}~~`);
  return Object.keys(bids).map(row).join("\n");
}
// ChatGPT suggests this version which does look better:
/*
  return Object.entries(bids)
    .map(([u, b]) => (b != null ? `\t${u}: ${b}` : `\t~~${u}~~`)).join('\n')
*/
// We need to be careful about the truthiness of bids[u]. Probably we want to
// use an explicit null for "hasn't bid yet". Like if the stored bid were the
// number 0, that's falsy which would be treated here as no bid.

// Take hash of users->bids, construct a string like
// "Got bids from {...}, waiting on {...}"
function bidStatus(bids) { // param is users, not bids
  // switch to this version after we use null for "hasn't bid yet":
  // const g = Object.keys(bids).filter(x => bids[x] != null).join(', ');
  // const w = Object.keys(bids).filter(x => bids[x] == null).join(', ');
  // return `Got bids from {${g}}, waiting on {${w}}`;
  return (
    "Got bids from {" + Object.keys(bids).filter(x =>  bids[x]).join(", ") +
    "}, waiting on {" + Object.keys(bids).filter(x => !bids[x]).join(", ") + "}"
  )
}

// Return whether any of the bids are missing
function bidMissing(bids) { return Object.keys(bids).some(x => bids[x] === "") }

// Initialize the auction and announce that it's started
function bidStart(plat, fief, chan, user, usid, text, others) {
  others[usid] = ""; // "others" now includes initiating user too
  // Wait, that makes "others" a misnomer. Maybe that's nbd.
  // Also I think we want to use null for "hasn't bid yet" instead of "".

  // Let's change this "beebot" prefix. Do we even need a prefix?
  // Actually what we need is plat + fief + chan so that auctions in different
  // places can never interfere with each other.
  // store.set(`${plat}.${fief}.${chan}.bids`, others);
  store.set("beebot.auctions." + chan + ".bids", others);
  let auction = {};
  auction.urtext = "/bid " + text.trim(); // don't think we need the trim
  auction.initiator = usid;
  // store.set(`${plat}.${fief}.${chan}.auction`, auction);
  store.set("beebot.auctions." + chan, auction);
  return `Auction started! ${bidStatus(others)}`
}

// Deletes all the bids for any auction in this channel
function bidReset(chan) {
  store.del("beebot.auctions." + chan);
  store.del("beebot.auctions." + chan + ".bids")
}

// Just return a string about whether to 10X the payments. Note that the /bid
// command doesn't actually parse out numbers or deal with payments in any way.
function bidPay() { // coming soon: pumpkinThresh
  const r = randint(10);
  const y = `\
  _/roll 10 → 1 ∴ PAY 10X!_ :money_with_wings: :moneybag: :money_mouth_face:`;
  const n = `_/roll 10 → ${r} not 1 ∴ no payments!_ :sweat_smile:`;
  return r === 1 ? y : n
}

// Add text as user's bid, blurt the results if user is the last one to bid
function bidProc(chan, usid, text) {
  const obj = store.get("beebot.auctions." + chan + ".bids");
  obj[usid] = text;
  store.set("beebot.auctions." + chan + ".bids", obj);

  let response = {};
  if (bidMissing(obj)) {
    response.output = `New bid from ${usid}! ${bidStatus(obj)}`;
    response.voxmode = "blurt"
  } else {
    bidReset(chan);
    response.output = `Got final bid from ${usid}! :tada: Results:\n` +
      bidSummary(obj) + `\n\n${bidPay()}`;
    response.voxmode = "cease"
  }
  return response
}

// Whisper the documentation -- should be ephem though
// Originally we had this:
// `/bid` (with no args) — check who has bid and who we're waiting on
// It was a less verbose version of `/bid status`.
function help() { return { output: `How to use /bid:
* \`/bid stuff with @-mentions\`\tStart new auction with the mentioned people
* \`/bid stuff\`\tSubmit your bid (fine to resubmit till last person bids)
* \`/bid status\`\tShow how current auction was initiated and who has bid
* \`/bid abort\`\tAbort the current auction, showing partial results
* \`/bid help\`\tShow this help (see doc.bmndr.co/sealedbids for gory details)`,
  voxmode: "whisp",
}}

function status(auction, bids) {
  let output, voxmode;
  if (auction) {
    output = `\
Currently active auction initiated by ${auction.initiator} via:
${auction.urtext}
${bidStatus(bids)}`;
    voxmode = "holla";
  } else {
    output = "No current auction";
    voxmode = "whisp"; // really ephem
  }
  return { output, voxmode }
}

function abort(auction, channel, bids) {
  if (auction) {
    const output = `*Aborted.* :panda_face: Partial results:\n` +
                   `${bidSummary(bids)}\n\n${bidPay()}`;
    bidReset(channel); // switch to plat, fief, chan
    return { output, voxmode: "cease" }
  } else {
    return { output: "No current auction", voxmode: "whisp" }
  }
}

function debug(auction, urtext) { return {
  output: auction
    ? `urtext = ${urtext} / datastore = ${JSON.stringify(datastore)}`
    : "No current auction",
  voxmode: "whisp" }
}

function printBids(auction, bids) {
  return { output: auction ? bidStatus(bids) : "No current auction", 
           voxmode: "holla" }
}

function maybeStart(auction, plat, fief, chan, user, usid, text, others) {
  if (auction) {
    return {
      output: "No @-mentions allowed in bids! Try `/bid help`",
      voxmode: "whisp", // should be ephem
    }
  } else {
    return {
      output: bidStart(plat, fief, chan, user, usid, text, others),
      voxmode: "holla",
    }
  }
}

function maybeProc(auction, channel, usid, text) {
  if (auction) return bidProc(channel, usid, text);
  return {
    output: `/bid ${text}\nNo current auction! Try \`/bid help\``,
    voxmode: "whisp",
  }
}

function handleSlash(plat, fief, chan, user, usid, text) {
  const urtext = "/bid " + text + "\n"; // do we need that newline?
  const others = bidParse(text);
  //const auction = store.get(`${plat}.${fief}.${chan}.auction`);
  //const bids    = store.get(`${plat}.${fief}.${chan}.bids`);
  const auction = store.get("beebot.auctions." + chan);
  const bids    = store.get("beebot.auctions." + chan + ".bids");

  if (!isEmpty(others))
    return maybeStart(auction, plat, fief, chan, user, usid, text, others);

  switch (text) {
    case "help":   return help();
    case "status": return status(auction, bids);
    case "abort":  return abort(auction, chan, bids);
    case "debug":  return debug(auction, urtext);
    case "":       return printBids(auction, bids);
    default:       return maybeProc(auction, chan, usid, text);
  }
}

// I don't like the smell of this
function normalizeReply(orig, reply) {
  const { plat, fief, chan, user, usid, priv } = orig;
  let normalized = reply;
  if (plat === "slack" && normalized.phem) { normalized.user = user }
  normalized = priv ? { ...normalized, user, usid, priv } :
                      { ...normalized, fief, chan };
  return normalized
}

async function bid(sendmesg, chum) {
  const { plat, fief, chan, user, usid, mesg, msid, priv } = chum;
  if (priv) {
    return sendmesg({ plat, user, usid, priv, mrid: msid,
      mesg: "Auctions in DMs don't work in Discord, womp womp" })
  }
  let args = mesg.split(' ').slice(1).join(' '); // what user typed after cmd

  // let auction = store.get(`${plat}.${fief}.${chan}.auction`);
  let auction = store.get("beebot.auctions." + chan);
  const response = handleSlash(plat, fief, chan, user, usid, args);

  // Start reply with echo of invocation:
  let text = `${usid}: \`${mesg}\``;

  let commandReply = normalizeReply(chum, {
    plat,
    mesg: text,
    phem: true,
    mrid: msid,
  });

  let message = normalizeReply(chum, { plat, mesg: response.output });

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
    message = normalizeReply(chum, {
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

module.exports = bid;