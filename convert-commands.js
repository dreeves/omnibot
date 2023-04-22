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
        holla: async (text) => interaction.reply(text),
        whisp: async (text) =>
        interaction.reply({ content: text, ephemeral: true }),
        blurt: async (text) => interaction.reply(text),
      };

      botCommand.options.forEach((botOption) => {
        return (options[botOption.name] = interaction.options.getString(
          botOption.name
        ));
      });
      botCommand.execute(options);
    };

    return command;
  },

  toSlack: (botCommand) => {
    return async ({ command, ack, respond }) => {
      botCommand.execute({
        cid: command.channel_id,
        sender: `<@${command.user_id}>`,
        input: command.text.replace(/<@(.*)\|.*>/, "<@$1>"),
        holla: async (text) => ack({ response_type: "in_channel", text }),
        whisp: async (text) => ack({ response_type: "ephemeral", text }),
        blurt: async (text) => {
          await ack();
          respond({ response_type: "in_channel", text });
        },
      });
    };
  },
};
