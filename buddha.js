const rand  = Math.random
const floor = Math.floor
const CLOG = console.log

// Maps platform/server/channel names to game states
let gamestates = {}

/*******************************************************************************
Buddha Nature game state

doneflag  : buddha nature is revealed; we're ready to start over
tug       : the user's guess -- most recent message from the user
gab       : the bot's response to tug
darule    : 
tries     : how many guesses the user has made so far, including tug
ghash     : things user previously guessed (always mapped to true)
introflag : whether the bot's introduced itself yet
antidup   : exact string user previously typed, for dup detection

Functions for manipulating Buddha Nature game state:
 * bunfresh() returns a fresh game state
 * bunin(state, x) returns the new game state from the user saying x
 * bunout(state) returns the bot response for the current game state
 * bunup(cid, x) updates the game state for the given channel based on message x
*******************************************************************************/

// -----------------------------------------------------------------------------
// --------------- Set up the dictionary and initialize the game ---------------

const { splur } = require('./util.js')
let   wordlist  = require('./data/sowpods.js').wordlist
const lexwords = require('./data/dawords.js').posswords
const dictsize = wordlist.length
wordlist = [...new Set(wordlist.concat(lexwords))] // combine & uniquify
wordlist.sort()
let dict = {}
let i = 0
for (const w of wordlist) { 
  if (/[a-z]+/.test(w)) { dict[w] = i++ }
  else { CLOG(`ERROR IN DICT: ${w}`) }
}

const possrules = [
/^.*s$/, // ends with s
/*
ch3 = lambdex["\\w{3}"]; (* 3 letters *)
ch4 = lambdex["\\w{4}$"]; (* 4 letters *)
any = (True &); (* aka ".*" *)
non = (False &); (* aka "" or "magic_string_4732" *)
nbf = (# =!= "beef" &); (* not the word "beef" *)
amx = lambdex["[a-m].*"]; (* first half of alphabet *)
dub = lambdex[".*(.)\\1.*"]; (* contains a double letter *)
noe = lambdex["[^e]+"]; (* standard lippogram *)
yee = lambdex[".*e.*"]; (* contains at least one e *)
nso = lambdex["[^o].*"]; (* doesn't start with o *)
vow = lambdex["[^aeiou]*[aeiou][^aeiou]*"]; (* only one vowel *)
bee = lambdex[".*bee.*"]; (* contains "bee" *)
sch = lambdex[".*sch.*"]; (* contains "sch" *)
xly = lambdex[".*ly"]; (* ends in ly *)
xls = lambdex[".*(ly|lies)"]; (* ends in ly or lies *)
sdc = lambdex["[^aeiou]{2}.*"]; (* starts with double consonant *)
sdv = lambdex["[aeiou]{2}.*"]; (* starts with double vowel *)
edv = lambdex[".*[aeiou]{2}"]; (* ends with double vowel *)
co4 = lambdex[".*[^aeiou]{4}.*"]; (* 4 consonants in a row *)
vo3 = lambdex[".*[aeiou]{3}.*"]; (* 3 vowels in a row *)
tio = lambdex[".*tion.*"]; (* contains "tion" *)
xzz = lambdex[".*zz.*"]; (* contains a double z *)
swx = lambdex["x.*"]; (* starts with x *)
nov = lambdex["[^aeiou]*"]; (* no vowels *)
noc = lambdex["[aeiouy]*"]; (* no consonants *)
*/
]

// -----------------------------------------------------------------------------
// ----------------------------- Lexiguess Blurbs ------------------------------

const introblurb = `\
Hi! I'm the Buddha Nature bot. \
I just woke up and remember exactly nothing about anything we may have talked \
about in the past. :blush: \
But I've thought of a (new) rule if you want to try guessing it. \
It'll be so fun! \
I picked it from a bunch of rules @dreev gave me. \
I'm assuming you typed "*#{tug}*" as your guess, so, here we go! \
Wheeee! :checkered_flag:\n\n`

const againblurb = `\
Hello, McFly, you already guessed "#{tug}". (Ok, I'm shutting up about any repeats now :shushing_face:)`
      
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

const gloryblurb = `\
OMG YES, how did you know I was thinking of "#{tug}"! \
[_stamps on floor and falls through_] \
It took you #{splurtries}... \
[_voice fades into abyss_] :hole:`

const gotitblurb = `\
:tada: Yup, my rule was "#{tug}"! \
It took you #{splurtries}. :tada:`

const guessblurb = `test guessblurb`

// -----------------------------------------------------------------------------
// --------------------------------- Functions ---------------------------------

// Helper for regexcat, turns regexes into strings so they can be concatenated
function stringify(x) {
  if (typeof(x)==="string") { return x }
  if (x instanceof RegExp)  { return x.source }
  //return JSON.stringify(x)
  return "ERROR--only-strings-and-regexes-allowed"
}

// Make a big regex by concatenating a list of regexes (and/or raw strings)
function regexcat(lor, opt) {            // opt is regex options like 'g' or 'i'
  return new RegExp(lor.map(x => stringify(x)).join(''), opt)
}    

function bunfresh() {
  const darule = possrules[floor(rand() * possrules.length)]
  CLOG(`\
We've thought of our rule: ${stringify(darule)}`)
  return {
    doneflag  : false,
    tug       : null,
    gab       : null,
    darule    : darule,
    tries     : 0,
    ghash     : {},
    introflag : false ,
    antidup   : "magic_string_no_one_will_ever_type_so_wont_match_off_bat_1440",
  }
}

// From game state s, return the new game state from the user saying x
function bunin(s, x) {
  if (s.doneflag) { s = bunfresh() }
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
        out = introblurb + gloryblurb
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
function bunout(s) {
  return s.gab === null ? null : s.gab
    .replace(/#{tug}/g,        s.tug)                 // Macro-expand the reply
    .replace(/#{tries}/g,      s.tries)               // using Ruby-style string
    .replace(/#{loword}/g,     s.loword)              // interpolation.
    .replace(/#{hiword}/g,     s.hiword)
    .replace(/#{daword}/g,     s.daword)
    .replace(/#{splurtries}/g, splur(s.tries, "guess", "guesses"))  
}

// Take a platform/server/channel-identifying string and a string said by the
// user and update the corresponding game state in the gamestates hash; return
// the string for the bot to reply with.
function bunup(cid, x) {
  if (!gamestates[cid]) { gamestates[cid] = bunin(bunfresh(),       x) } 
  else                  { gamestates[cid] = bunin(gamestates[cid], x) }
  return bunout(gamestates[cid])
}

module.exports = { bunup }

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
