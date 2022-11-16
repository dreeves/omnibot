const options = [
    {
        name: 'input',
        description: 'Text to repeat back',
    },
]

module.exports = {
    name: 'bid',
    description: 'Replies with its input.',
    options,
    execute: (opts) => `roger that "${opts['input']}"; the bid command doesn't do anything yet so i bid thee farewell!`
}
