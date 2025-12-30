// There's a lot of silliness in this file. I'm just experimenting and having
// fun, ok? See also expectorant.yootl.es
// Ideas:
// * Make /roll understand dice notation like "2d6" to roll two six-sided dice?
// * Make a separate /dice command for that?
// * Make a separate /flip command for Bernoulli trials?
// * Make a separate /spin command for making a random choice from a list?
// * https://linux.die.net/man/1/roll HT Brent Yorgey

// (Anti-magic story: This used to treat /roll with no arguments the same as 
// "/roll help", which seemed fine, until I happened to try "/roll #". Since the
// hash sign starts a comment, that was stripped and treated as "/roll" with no
// arguments, which gave the help text which seemed buggy. As usual, every 
// if-statement combinatorially splits the possible code paths and gives bugs 
// new places to hide. So now the only way to get the help text is an explicit 
// "/roll help". And there's no conditional suppression of the echoing of what
// the user typed to invoke the command.)

const ROL = "roll"; // name of this slash command
//const botid = process.env.DISCORD_CLIENT_ID; // not currently used

const { randint, bern, laxeval, isnum } = require('../util.js');

function help() {
  const P = `* \`/${ROL} `; // prefix for each line
  const helptext = `How to use /${ROL}:
${P}n\`\t`    +`Roll an \`n\`-sided die :game_die:
${P}p\`\t`    +`Say YES with probability \`p\`, i.e., flip a biased coin :coin:
${P}expr\`\t` +`Evaluate a math expression and roll or flip accordingly :abacus:
${P}expr # comment\`\tAnything after the first "#" is ignored :thought_balloon:
${P}help\`\t`       +`Show this help message :mirror: :question:`;
  return helptext
}

// Turn a number n into an emoji, if it happens to have one, as 0-10 do.
// Otherwise just return the number.
function emojify(n) {
  const N = [':zero:', ':one:', ':two:', ':three:', ':four:', ':five:', ':six:',
             ':seven:', ':eight:', ':nine:', ':keycap_ten:'];
  // return N[n] ?? n
  return N[n] !== undefined ? `${N[n]} (${n})` : `\`${n}\``;
  // return n >= 0 && n <= 10 ? `${N[n]}` : n #SCHDEL
}

// Generate the output for rolling an n-sided die
function rollout(n) {
  //const roll = randint(n); #SCHDEL
  return `\
:game_die: Rolling a D${n}... it came up ${emojify(randint(n))}  :tada:`;
}

// Generate the output for flipping a biased coin with probability p
function flipout(p) {
  //const flip = bern(p); #SCHDEL
  return `\
:coin: Bernoulli trial with probability ${p}... \
it came up ${bern(p) ? "YES :white_check_mark:" : "NO :x:"}.`;
}

// Generate the output for trying to roll or flip with a a number like 1.5 that
// doesn't make sense as either a probability or number of sides of a die.
function poopout(x) { return `\
:game_die: Rolling a ${x}-sided die... ${bern(0.1) ? ':poop:' : ':boom:'} \
(we need a positive integer number of sides or a valid probability)`
}

function errout(x) { 
  return (x === '' ? `Error: No input given.`
                   : `Error: \`${x}\` doesn't evaluate to a number.`) +
    `\n\nTry \`/${ROL} help\` for help`;
}

// Special output for /roll 1 (or /roll e^tau*i or anything eval'ing to 1)
function oneout() { return `\
:game_die: Rolling a D1... it came up 1. Duh.
:coin: Or if you were specifying a probability of 1, it came up \
YES :white_check_mark:. Also duh. :one: :white_check_mark: :tada:`
}

// Special output for /roll 0 (or any expression that evals to 0)
function zerout() { return `\
:coin: Bernoulli trial with probability 0... it came up NO, obviously. :x:`
}

async function roll(sendmesg, chum) {
  const { plat, fief, chan, user, usid, mesg, msid, priv } = chum;
  let args = mesg.split(' ').slice(1).join(' '); // what user typed after cmd
  args = args.replace(/#.*/, '').trim();         // strip comments (naively)
  const x = laxeval(args);                       // evaluate it as a number
  let text = ''; // what we'll reply with

  // Reply ephemerally when replying with help text or an error message:
  let phem = args === "help" || x === null;
  // Start reply with echo of invocation:
  text = `${usid}: \`${mesg}\`\n\n`;
  // If the input isn't a number but evaluates to one, show that explicitly:
  if (!isnum(args) && x !== null) text += `:abacus: \`${args}\` = ${x}\n`;

  text += args === "help"               ? help()
        : x === null                    ? errout(args)
        : x === 1                       ? oneout()
        : x === 0                       ? zerout()
        : x >= 0 && x <= 1              ? flipout(x)
        : x >= 2 && Number.isInteger(x) ? rollout(x)
        :                                 poopout(x);

  let message = priv ? { plat, user, usid, priv, mrid: msid, mesg: text } :
                       { plat, fief, chan,       mrid: msid, mesg: text, phem };
  return await sendmesg(message)
}

module.exports = roll;