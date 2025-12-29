const rand  = Math.random;
const floor = Math.floor;
const CLOG = console.log;

// const { version } = require('./package.json'); // not used currently

const crypto = require('crypto');
//let nonce = crypto.randomBytes(16).toString('base64');
//CLOG(`DEBUG nonce: ${nonce}`);

// Maps platform/fief/channel names to game states
let gamestates = {}

/*******************************************************************************
Lexiguess game state

doneflag  : the answer's guessed; we're ready to start over [use tug==daword?]
tug       : the user's guess -- most recent message from the user
gab       : the bot's response to tug
daword    : the actual word the bot is thinking of
loword    : earliest word in the dictionary it could be
hiword    : latest word in the dictionary it could be
tries     : how many guesses the user has made so far, including tug
ghash     : things user previously guessed (always mapped to true)
introflag : whether the bot's introduced itself yet
snarkflag : whether the bot's said it ignores non-dictionary words
rangeflag : whether the bot's said it ignores out-of-range words
againflag : whether the bot's said it ignores already-guessed words
antidup   : exact string user previously typed, for dup detection

Functions for manipulating Lexiguess game state:
 * lexifresh(id) returns a fresh game state with given id
 * lexin(state, x) returns the new game state from the user saying x
 * lexout(state) returns the bot response for the current game state
 * lexup(cid, x) updates the game state for the given channel based on message x
*******************************************************************************/

// -----------------------------------------------------------------------------
// --------------- Set up the dictionary and initialize the game ---------------

const { splur } = require('./util.js')
let   wordlist  = require('./data/sowpods.js').wordlist
const posswords = require('./data/dawords.js').posswords
dupcheck(wordlist, "the SOWPODS dictionary")
dupcheck(posswords, "the possible words")
const dictsize = wordlist.length
wordlist = [...new Set(wordlist.concat(posswords))] // combine & uniquify
wordlist.sort()
const d = dictsize            // original dict size
const w = wordlist.length     // size of the augmented dictionary
const p = posswords.length    // number of possible words to pick for the game
const n = w-d                 // number of neologisms in the possible words list
CLOG(`Dict: ${d}, Possible words: ${p}, Neologisms: ${n}, Total: ${w}`)
let dict = {} // hash from words to their position in the dictionary
let i = 0
for (const w of wordlist) { 
  if (/[a-z]+/.test(w)) { dict[w] = i++ }
  else { CLOG(`ERROR IN DICT: ${w}`) }
}

// -----------------------------------------------------------------------------
// ----------------------------- Lexiguess Blurbs ------------------------------

const introblurb = `\
Let Lexiguess commence! \
I'm presuming you typed "#{tug}" as your first guess of the secret word. \
So here we go! Wheeee! :checkered_flag: \n\n`

const againblurb = `\
Hello, McFly, you already guessed "#{tug}". \
(Ok, I'm shutting up about any repeats now :shushing_face:)`
      
const snarkblurb = `\
I am profoundly ashamed to admit I don’t know the word "#{tug}"! \
(Due to the aforementioned shame, I won't say this again :flushed:)`

const introsnarkblurb = `${introblurb}wait, _uh oh_\n\n${snarkblurb}\n\n`

const snarkrangeblurb = `\
Not only is "#{tug}" not between "#{loword}" and "#{hiword}" in the \
dictionary, as far as I can tell it isn't in the dictionary at all! \
(One of us should probably be pretty embarrassed at this point. \
I shan't speak of this awkwardness -- either words I don't know or words \
outside the current range -- again.)`

const rangeblurb = `\
Ahem, "#{tug}" is not between "#{loword}" and "#{hiword}" in the dictionary! \
From now on you'll get the silent treatment when that happens. \
(I mean, not to be a jerk about it, it's more that I'm assuming you're talking \
about other things and don't want me chiming in unless you're actually \
guessing in-bounds words. :shushing_face:)`

/* This one can be confusing/weird if the guess is one of the bounds
const rangeagainblurb = `\
Hello, McFly, you already guessed "#{tug}" -- and it's not between \
"#{loword}" and "#{hiword}" anyway. (Ok, I'm shutting up about any repeats or \
out-of-range words now :shushing_face:)`
*/

const gloryblurb = `\
OMG YES, how did you know I was thinking of "#{tug}"! \
[_stamps on floor and falls through_] \
It took you #{splurtries}... \
[_voice fades into abyss_] :hole:`

const gotitblurb = `\
:tada: Yup, my word was "#{tug}"! \
It took you #{splurtries}. :tada:`

const guessblurb = `(#{tries}) My word is between "#{loword}" and "#{hiword}"!`

// -----------------------------------------------------------------------------
// --------------------------------- Functions ---------------------------------

// Turn a list into a hash mapping the items in the list to how many times they
// appear in the list.
function tally(l) {
  let h = {}
  for (const x of l) { h[x] = (h[x] || 0) + 1 }
  return h
}

// Take a list and return the dups therein
function dups(l) {
  const h = tally(l)
  return Object.keys(h).filter(x => h[x] > 1)
}

// Complain in the console if a given list l, called s, has duplicates
function dupcheck(l, s = "the list") {
  const duplist = dups(l)
  if (duplist.length > 0) {
    CLOG(`Duplicates in ${s}: ${JSON.stringify(duplist)}`)
  } else {
    CLOG(`No dups in ${s}`)
  }
}

// Found on the internet somewhere
function rot13(str) {
  const input     = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const output    = 'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm'
  const index     = x => input.indexOf(x)
  const translate = x => index(x) > -1 ? output[index(x)] : x
  return str.split('').map(translate).join('')
}

// Return a handful of random letters to obfuscate the rot13'd word
function randpre() {
  return "abcdefghijklmnopqrstuvwxyz".split('').sort(() => .5-rand()).join('')
    .substring(0, 2+floor(rand()*10))
}

function lexifresh(id) {
  const daword = posswords[floor(rand() * posswords.length)]
  CLOG(`\
We've thought of our word: trim_prefix(rot13("${randpre() + rot13(daword)}")))`)
  return {
    id        : id,
    doneflag  : false,
    tug       : null,
    gab       : null,
    daword    : daword,
    loword    : 'aardvark',
    hiword    : 'zymurgy',
    tries     : 0,
    ghash     : {},
    introflag : false ,
    snarkflag : false ,
    rangeflag : false,
    againflag : false,
    antidup   : "magic_string_no_one_will_ever_type_so_wont_match_off_bat_1439",
  }
}

// Macro-expand the given blurb, Ruby string interpolation style
/*
function mex(state, blurb) {
  return blurb.replace(/#{tug}/g,        state.tug)
              .replace(/#{tries}/g,      state.tries)
              .replace(/#{loword}/g,     state.loword)
              .replace(/#{hiword}/g,     state.hiword)
              .replace(/#{daword}/g,     state.daword)
              .replace(/#{splurtries}/g, splur(state.tries, "guess", "guesses"))
}
*/

// From game state s, return the new game state from the user saying x
function lexin(s, x) {
  if (s.doneflag) {
    s = lexifresh(s.id + '_again')
  }
  if (x === s.antidup) {           // exact same thing twice in a row: ignore it
    CLOG(`DUP "${s.tug}"`)         // (happens sometimes due to network flakage;
    s.gab = null                   // if user did it, fine to ignore that too)
    return s
  } else { s.antidup = x }
  CLOG(`(${splur(s.tries, "previous guess", 
                          "previous guesses")}) new guess: "${x}"`)
  s.tug = x.toLowerCase().trim()   // canonicalized word the user guessed
 
  const unk = !(s.tug in dict)                       // unknown word
  const oor = s.tug <= s.loword || s.tug >= s.hiword // out of range
  const rep = s.ghash[s.tug]                         // repeated guess
  s.ghash[s.tug] = true                        // remember that user guessed tug

  if (!unk && !oor && !rep) {                  // fully valid guess
    s.tries++
    if (s.tug === s.daword) {
      let out
      if (!s.introflag) {
        CLOG(`INSTAGUESSED "${s.tug}" in ${s.tries} try!`)
        out = introblurb + gloryblurb + 
                    `\n\n(seriously, 1 guess? the odds of that are ${w+1} to 1)`
      } else {
        CLOG(`Guessed "${s.tug}" in ${splur(s.tries, "try", "tries")}!`)
        out = s.tries <= 18 ? gloryblurb : gotitblurb // log(len(dict))
      }
      return {...s, doneflag: true, gab: out}
    } else {                      // shrink the range and reply
      if (dict[s.tug] < dict[s.daword]) { s.loword = s.tug } else 
                                        { s.hiword = s.tug }
      if (s.introflag) {
        return {...s, gab: guessblurb}
      } else {
        return {...s, introflag:true, gab: introblurb+guessblurb}
      }
    }
  } else if (unk && !s.introflag) {          // unknown word off the bat
    return {...s, introflag: true, snarkflag: true, 
            gab: introsnarkblurb + guessblurb}
  } else if (oor && !s.introflag) {          // out of range off the bat: just
    s.tries++                                // expand the range and run with it
    if      (s.tug < s.loword) { s.loword = s.tug }
    else if (s.tug > s.hiword) { s.hiword = s.tug }
    return {...s, introflag: true, gab: introblurb + guessblurb}
  } else if (rep && !s.introflag) {            // an airhorn would be nice here
    return {...s, gab:`ERROR: First guess somehow a repeat? Can't happen!`}
  } else if (!unk && !oor && rep && !s.againflag) {   // snark/range/again = 001
    return {...s, againflag: true, gab: againblurb}
  } else if (!unk && oor && !rep && !s.rangeflag) {                     // = 010
    return {...s, rangeflag: true, gab: rangeblurb}
  } else if (unk && !oor && !rep && !s.snarkflag) {                     // = 100
    return {...s, snarkflag: true, gab: snarkblurb}
  } else if (!unk && oor && rep && !s.rangeflag && !s.againflag) {      // = 011
    // this used to set rangeflag true; TODO: combine this w/ !unk !oor rep case
    return {...s, againflag: true, gab: againblurb}
  } else if (unk && oor && !rep && !s.snarkflag && !s.rangeflag) {      // = 110
    return {...s, snarkflag: true, rangeflag: true, gab: snarkrangeblurb}
  } else if (unk && !oor && rep && !s.snarkflag && !s.againflag) {      // = 101
    return {...s, gab: `\
ERROR! Hat-eating commences. Please tell @dreev about this.
You repeated the unknown word "${s.tug}" yet we didn't already snark at you?!`}
  } else if (unk && s.snarkflag || oor && s.rangeflag || rep && s.againflag) {
    // Whatever's wrong, we've already given that spiel so ignore it
    return {...s, gab: null}
  }
  // Reasonably sure we can't reach this point in the code...
  return {...s, gab: `\
ERROR! Eek! You have found a bug! Please tell @dreev! Diagnostics:
Guess: ${s.tug}
Previous guess: ${s.antidup}
Range: ${s.loword} [${s.daword}] ${s.hiword}
Tries: ${s.tries}
Unknown word: ${unk}
Out of range: ${oor}
Repeated guess: ${rep}
Previously introduced self: ${s.introflag}
Previously snarked about non-dictionary words: ${s.snarkflag}
Previously complained about word out of range: ${s.rangeflag}
Previously said we wouldn't admonish user about repeats: ${s.againflag}`}
}

// Return the bot reply for the given game state
function lexout(s) {
  //const debuggery = ` \`[DEBUG version ${version}: ${s.id}, process id: ${process.pid}, debug nonce: ${nonce}, IS_PULL_REQUEST: ${process.env.IS_PULL_REQUEST}]\``
  // for debugging, return this if s.gab is null: '[explicit null?]' + debuggery
  return s.gab === null ? null : s.gab
    .replace(/#{tug}/g,        s.tug)                 // Macro-expand the reply
    .replace(/#{tries}/g,      s.tries)               // using Ruby-style string
    .replace(/#{loword}/g,     s.loword)              // interpolation.
    .replace(/#{hiword}/g,     s.hiword)
    .replace(/#{daword}/g,     s.daword)
    .replace(/#{splurtries}/g, splur(s.tries, "guess", "guesses"))
    //+ debuggery
}

// Take a platform/fief/channel-identifying string and a string said by the
// user and update the corresponding game state in the gamestates hash; return
// the string for the bot to reply with.
function lexup(cid, x) {
  gamestates[cid] = gamestates[cid] ? lexin(gamestates[cid], x)
                                    : lexin(lexifresh(cid),  x)
  return lexout(gamestates[cid])
}

module.exports = lexup;

// -----------------------------------------------------------------------------
// ------------------------------- Scratch area --------------------------------

/* #SCHDEL
1st guess, unknown word, repeat, immediate dup, intro/snark/range/again flags
1st unk oor rep dup inf knf raf agf
--- --- --- --- --- --- --- --- ---
                  1                  same thing twice in a row: ignore
X 1   0   0   0       0              normal 1st guess
X 1           1       0              error: can't be a repeat; it's the 1st msg!
X 1   0   1           0              1st guess out of range
X 1   1   0           0              1st guess is an unknown word
X 1   1   1           0              1st guess out of range AND unknown
  0   0   0   0       1              totally normal guess case

X 0   0   0   1       1           0  hello mcfly, you already guessed that
X 0   0   0   1       1              ignore (hello mcfly)
X 0   0   1   0       1       0      ahem, out of range
X 0   0   1   0       1              ignore (ahem, out of range)
  0   0   1   1       1       0   0  out of range AND a repeat
  0   0   1   1       1              ignore
  0   1   0   0       1   0          unknown word
  0   1   0   0       1              ignore
  0   1   0   1       1   0       0  unknown word AND a repeat
  0   1   0   1       1              ignore
  0   1   1   0       1   0   0      unknown and out of range
  0   1   1   0       1              ignore
  0   1   1   1       1   0   0   0  unknown AND out of range AND a repeat
  0   1   1   1       1              ignore

ini: intro upon getting user's first guess
rep: repeat of a previous guess, bot snarks
rng: out of range, bot snarks
unk: unknown word, bot snarks that it's ashamed to not know it
yay: user guesses daword and wins
try: user makes a guess and narrows the range
*/
