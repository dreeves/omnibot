const options = [
  {
    name: "n",
    description: "Random integer from 1 to n",
  },
];

// TODO: DRY this up with commands/bid.js
// Random integer from 1 to n inclusive
function randint(n) { return Math.floor(Math.random() * n) + 1 }

// Bernoulli trial with probability p
function bern(p) { return Math.random() < p }

function whisp(s) { return { output: s, voxmode: "whisp" } }
function holla(s) { return { output: s, voxmode: "holla" } }

module.exports = {
  name: "roll",
  description: "Return a random number.",
  options,
  execute: ({ clientId, sender, input }) => {
    if (input === '' || input === 'help') {
      return whisp("How to use /roll\n"
        + "`/roll N` — roll an N-sided die\n"
        + "`/roll help` — show this");
    }
    let n = parseInt(input);
    if (isNaN(n)) {
      return whisp("Pssst, this is not an integer: " + input);
    } else if (n <= 0) {
      return holla("Rolling " + n + "-sided die... "
        + (bern(0.1) ? ":poop:" : ":boom:")
        + " (try again with a positive number of sides?)");
    } else {
      return holla(`Rolling a D${n}... it came up ${randint(n)}.`);
    }
  },
};

/* original version of /roll that should be safe to get rid of now:
  execute: (opts) => {
    const size = opts["n"];
    const result = Math.floor(Math.random() * size + 1);    
    return `You rolled a D${size} and it came up ${result}.`;
  },
*/
