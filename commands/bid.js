const options = [
  {
    name: "input",
    description: "Text to repeat back",
  },
];

/**
 * @typedef {Object} Auction
 * @property {Set<string>} bidders
 */

/**
 * @typedef {Object.<string, Auction>} States
 */

/**
 * @type States
 */
let states = {};

/**
 * @param {States} states
 * @param {string} clientId
 * @param {string} sender
 * @param {string} input
 */
const update = (states, clientId, sender, input) => {
  if (!states[clientId]) {
    states[clientId] = {
      bidders: new Set(),
    };
  }

  states[clientId].bidders.add(`@${sender}`);
  for (let [name] of input.matchAll(/<@.*?>/g)) {
    states[clientId].bidders.add(name);
  }

  return states;
};

module.exports = {
  name: "bid",
  description: "Replies with its input.",
  options,
  execute: ({ cid: clientId, sender, input }) => {
    const users = {};
    states = update(states, clientId, sender, input);
    let bidders = [...states[clientId].bidders];
    return `roger that "${input}" sent by @${sender} . here is a list of all users who have sent the /bid command or been mentioned in a /bid command: {${bidders}}`;
  },
};
