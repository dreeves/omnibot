const options = [
    {
        name: "input",
        description: "Size of the die to roll.",
    },
];

module.exports = {
    name: "roll",
    description: "Rolls dice of the specified number and size.",
    options,
    execute: (opts) => {
        const size = opts["input"];
        const result = Math.floor(Math.random() * size + 1);

        return `You rolled a D${size} and it came up ${result}.`;
  },
};
