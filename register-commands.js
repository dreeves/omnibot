require("dotenv").config(); // or import 'dotenv/config'

const { REST, Routes } = require("discord.js");
const convertCommands = require("./convert-commands.js");
const clientId = process.env.DISCORD_CLIENT_ID;
const token = process.env.DISCORD_BOT_TOKEN;

const Discord = require("discord.js");
const discord = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
  ],
  rest: { version: "10" },
});

const fs = require("node:fs");

const discordCommands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const botCommand = require(`./commands/${file}`);

  // Discord
  const discordCommand = convertCommands.toDiscord(botCommand);
  discordCommands.push(discordCommand.data.toJSON());

  // Slack
  console.log(`Add a new command to the slack app with the following details:`);
  console.log(`name: ${botCommand.name}`);
  console.log(`description: ${botCommand.description}`);
  const usageHint = `[${botCommand.input.description}]`;
  console.log(`usage hint: ${usageHint}`);
}

// Construct and prepare an instance of the REST module
// const rest = new REST({ version: "10" }).setToken(token);

// and deploy your commands!
(async () => {
  try {
    await discord.login(token);
    console.log(
      `Started refreshing ${discordCommands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await discord.rest.put(Routes.applicationCommands(clientId), {
      body: discordCommands,
    });

    const guilds = await discord.guilds.fetch();

    for (let [gId] of guilds) {
      const guild = await discord.guilds.fetch(gId);

      const rules = await guild.autoModerationRules.fetch();

      for (let command of discordCommands) {
        const ruleName = `omnibot-${command.name}`;

        if (!rules.some(({ name }) => name === ruleName)) {
          await guild.autoModerationRules.create({
            name: ruleName,
            eventType: Discord.AutoModerationRuleEventType.MessageSend,
            triggerType: Discord.AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
              regexPatterns: [`^/${command.name} .*`],
            },
            enabled: true,
            actions: [
              {
                type: Discord.AutoModerationActionType.BlockMessage,
                metadata: {
                  customMessage:
                    "Oops. Looks like you meant to send a bot command, not a message!",
                },
              },
            ],
          });
        }
      }
    }

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
    console.log(`ERROR! Your login token was ${token}`);
  }

  discord.destroy();
})();
