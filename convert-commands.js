const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  toDiscord: (botCommand) => {
    const command = {};

    command.data = new SlashCommandBuilder()
      .setName(botCommand.name)
      .setDescription(botCommand.description);

    botCommand.options.forEach((botOption) => {
      command.data.addStringOption((option) =>
        option
          .setName(botOption.name)
          .setDescription(botOption.description)
          .setRequired(botOption.required || false)
      );
    });

    command.execute = async (interaction) => {
      const client = interaction.client;
      const options = {
        cid: `discord_${interaction.channelId}`,
        sender: `<@${interaction.user.id}>`,
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
    return async ({ client, command, ack, say }) => {
      await ack();
      await say(
        botCommand.execute({
          cid: command.channel_id,
          sender: `<@${command.user_id}>`,
          input: command.text.replace(/<@(.*)\|.*>/, "<@$1>"),
        })
      );
    };
  },
};
