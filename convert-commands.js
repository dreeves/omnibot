const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  toDiscord: (botCommand) => {
    const command = {};

    command.data = new SlashCommandBuilder()
      .setName(botCommand.name)
      .setDescription(botCommand.description);

    botCommand.options.forEach((botOption) => {
      command.data.addStringOption((option) =>
        option.setName(botOption.name).setDescription(botOption.description)
      );
    });

    command.execute = async (interaction) => {
      const client = interaction.client;
      const options = {
        cid: `discord_${interaction.channelId}`,
        sender: interaction.user.username,
      };

      botCommand.options.forEach((botOption) => {
        return (options[botOption.name] = interaction.options.getString(
          botOption.name
        ));
      });
      const botResponse = botCommand.execute(options);

      await interaction.reply(botResponse);
    };

    return command;
  },

  toSlack: (botCommand) => {
    return async ({ client, command, ack, respond }) => {
      await ack();
      await respond(
        botCommand.execute({
          sender: command.user_name,
          input: command.text,
        })
      );
    };
  },
};
