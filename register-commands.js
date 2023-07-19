require("dotenv").config(); // or import 'dotenv/config'

const { REST, Routes, SlashCommandBuilder } = require("discord.js");
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

const slashmeta = require("./slashmeta.js");

slashmeta.forEach((meta) => {
  // Discord
  const discordCommand = {};

  discordCommand.data = new SlashCommandBuilder()
    .setName(meta.name)
    .setDescription(meta.description);

  discordCommand.data.addStringOption((option) =>
    option.setName("input").setDescription("Input to the command")
  );

  discordCommands.push(discordCommand.data.toJSON());

  // Slack
  console.log(`Add a new command to the slack app with the following details:`);
  console.log(`name: ${meta.name}`);
  console.log(`description: ${meta.description}`);
  const usageHint = `[Input to the command]`;
  console.log(`usage hint: ${usageHint}`);
});

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

    // const guilds = await discord.guilds.fetch();

    // for (let [gId] of guilds) {
    //   const guild = await discord.guilds.fetch(gId);

    //   const rules = await guild.autoModerationRules.fetch();

    //   for (let command of discordCommands) {
    //     const ruleName = `omnibot-${command.name}`;

    //     if (!rules.some(({ name }) => name === ruleName)) {
    //       await guild.autoModerationRules.create({
    //         name: ruleName,
    //         eventType: Discord.AutoModerationRuleEventType.MessageSend,
    //         triggerType: Discord.AutoModerationRuleTriggerType.Keyword,
    //         triggerMetadata: {
    //           regexPatterns: [`^/${command.name} .*`],
    //         },
    //         enabled: true,
    //         actions: [
    //           {
    //             type: Discord.AutoModerationActionType.BlockMessage,
    //             metadata: {
    //               customMessage:
    //                 "Oops. Looks like you meant to send a bot command, not a message!",
    //             },
    //           },
    //         ],
    //       });
    //     }
    //   }
    // }

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
