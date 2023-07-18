const fs = require("node:fs");
const path = require("node:path");

const convertCommands = require("../convert-commands.js");
const discord = require("./discord");
const slack = require("./slack.js");
const web = require("./web.js");

const commandsPath = path.join(__dirname, "../commands");
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
const botCommands = commandFiles.map((file) =>
    require(path.join(commandsPath, file))
);

botCommands.forEach((botCommand) => {
    const slackCommand = convertCommands.toSlack(botCommand);
});

module.exports = {
    discord,
    slack,
    web,
};
