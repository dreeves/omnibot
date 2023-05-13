// TODO: DRY this up with commands/bid.js
// Random integer from 1 to n inclusive
function randint(n) { return Math.floor(Math.random() * n) + 1 }

// Bernoulli trial with probability p
function bern(p) { return Math.random() < p }

function whisp(s) { return { output: s, voxmode: "whisp" } }
function holla(s) { return { output: s, voxmode: "holla" } }

module.exports = {
  name: "roll",
  description: "Return a random integer from 1 to n.",
  input: {
    name: "n",
    //required: true,  // experimenting with this
    description: "Maximum value of the random number.", // where is this shown?
  },
  execute: ({ input }) => {
    if (input === '' || input === 'help') {
      return whisp("How to use /roll\n"
        + "`/roll N` — roll an N-sided :game_die:\n"
        + "`/roll help` — show this");
    }
    const n = parseInt(input);
    if (isNaN(n)) {
      //console.log("DEBUG051: " + JSON.stringify(input));
      return whisp("Pssst, this is not an integer: " + input);
    } else if (n <= 0) {
      return holla("Rolling a " + n + "-sided die... "
        + (bern(0.1) ? ":poop:" : ":boom:")
        + " (try again with a positive number of sides?)");
    } else if (n === 1) {
      return holla("Rolling a D1... it came up 1. Duh.");
    } else {
      return holla(`Rolling a D${n}... it came up ${randint(n)}.`);
    }
  },
};
