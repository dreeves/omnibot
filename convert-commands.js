const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

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
    return async ({ command, ack }) => {
      await ack();
      await axios.post(command.response_url, {
        response_type: "in_channel",
        text: botCommand.execute({
          cid: command.channel_id,
          sender: `<@${command.user_id}>`,
          input: command.text.replace(/<@(.*)\|.*>/, "<@$1>"),
        }),
      });
    };
  },
};
