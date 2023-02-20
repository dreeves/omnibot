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
 * @param {string} cid
 * @param {string} sender
 * @param {string} input
 */
const update = (states, cid, sender, input) => {
  if (!states[cid]) {
    states[cid] = {
      bidders: new Set(),
    };
  }

  states[cid].bidders.add(`@${sender}`);
  for (let [name] of input.matchAll(/@[a-zA-Z0-9]+/g)) {
    states[cid].bidders.add(name);
  }

  return states;
};

// TODO `users` is weird C-style passing of editable data.
const parseMentions = (client, users, token) => {
  if (!token) {
    return;
  }

  if (token.startsWith("<@") && token.endsWith(">")) {
    token = token.slice(2, -1);

    if (token.startsWith("!")) {
      token = token.slice(1);
    }

    const user = client.users.cache.get(token);
    users[user.username] = token;

    return `@${user.username}`;
  }

  return token;
};

const revertMentions = (users, token) => {
  if (!token) {
    return;
  }

  if (token.startsWith("@")) {
    token = token.slice(1);

    const userId = users[token];
    return `<@${userId}>`;
  }

  return token;
};

module.exports = {
  name: "bid",
  description: "Replies with its input.",
  options,
  execute: (client, { cid, sender, input }) => {
    const users = {};
    states = update(
      states,
      cid,
      sender,
      input
        .split(" ")
        .map((token) => parseMentions(client, users, token))
        .join(" ")
    );
    let bidders = [...states[cid].bidders];
    return `roger that "${input}" sent by @${sender} . here is a list of all users who have sent the /bid command or been mentioned in a /bid command: { ${bidders.join(
      " "
    )} }`
      .split(" ")
      .map((token) => revertMentions(users, token))
      .join(" ");
  },
};
