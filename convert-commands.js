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
      const { channel } = interaction;
      const options = {
        cid: `discord_${interaction.channelId}`,
        sender: `<@${interaction.user.id}>`,
        input: interaction.options.getString("input"),
      };

      const { output, voxmode } = botCommand.execute(options);
      switch (voxmode) {
        case "whisp":
          interaction.reply({ content: output, ephemeral: true });
          break;
        case "holla":
          interaction.reply(`/${botCommand.name} ${options.input}`);
          channel.send(output);
          break;
        case "blurt":
          interaction.reply({content: options.input, ephemeral: true});
          channel.send(output);
          break;
        default:
          throw `Unrecognized voxmode "${voxmode}"`;
      }
    };

    return command;
  },

  toSlack: (botCommand) => {
    return async ({ command, ack, respond }) => {
      const { output, voxmode } = botCommand.execute({
        cid: command.channel_id,
        sender: `<@${command.user_id}>`,
        input: command.text.replace(/<@(.*)\|.*>/, "<@$1>"),
      });

      switch (voxmode) {
        case "whisp":
          ack({ response_type: "ephemeral", text: output });
          break;
        case "holla":
          ack({ response_type: "in_channel", text: output });
          break;
        case "blurt":
          await ack();
          respond({ response_type: "in_channel", text: output });
          break;
        default:
          throw `Unrecognized voxmode  "${voxmode}"`;
      }
    };
  },
};
