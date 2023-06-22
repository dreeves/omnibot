// TODO: DRY this up with commands/bid.js
// Random integer from 1 to n inclusive
function randint(n) {
  return Math.floor(Math.random() * n) + 1;
}

// Bernoulli trial with probability p
function bern(p) {
  return Math.random() < p;
}

module.exports = ({ mesg, ...message }, sendmesg) => {
  if (mesg === "" || mesg === "help") {
    return sendmesg({
      ...message,
      mesg:
        "How to use /roll\n" +
        "`/roll N` — roll an N-sided :game_die:\n" +
        "`/roll help` — show this",
      priv: true,
    });
  }
  // TODO: actually check if mesg is an integer, via /^[+-]?\d+\.?$/
  // if you just do parseInt then it turns, say, "1/2" into 1 :(
  const n = parseInt(mesg);
  if (isNaN(n)) {
    //console.log("DEBUG051: " + JSON.stringify(mesg));
    return sendmesg({
      ...message,
      mesg: "Psst, this is not an integer: " + mesg,
      priv: true,
    });
  } else if (n <= 0) {
    return sendmesg({
      ...message,
      mesg:
        "Rolling a " +
        n +
        "-sided die... " +
        (bern(0.1) ? ":poop:" : ":boom:") +
        " (try again with a positive number of sides?)",
      mrid: message.msid,
    });
  } else if (n === 1) {
    return sendmesg({
      ...message,
      mesg: "Rolling a D1... it came up 1. Duh.",
      mrid: message.msid,
    });
  } else {
    return sendmesg({
      ...message,
      mesg: `Rolling a D${n}... it came up ${randint(n)}.`,
      mrid: message.msid,
    });
  }
};
