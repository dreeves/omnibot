const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

const STRIKETHROUGH_REGEX = /~(?<text>[^\s\n]|[^\s\n]([^\n]*?)[^\s\n])~/gi;
const ITALIC_REGEX =
  /(?<!\w)_(?<text>[^\s\n]|[^\s\n.]([^\n]*?)[^\s\n])_(?!\w)/gi;
const BOLD_REGEX =
  /(?<!\*)\*(?<text>[^\s\n]|[^\s\n]([^\n]*?)[^\s\n])\*(?!\*)/gi;

const platformFormatting = {
  discord: {
    strikethrough: "~~$<text>~~",
    bold: "**$<text>**",
    italic: "_$<text>_",
  },
  slack: {
    strikethrough: "~$<text>~",
    bold: "*$<text>*",
    italic: "_$<text>_",
  },
};

function platformat(platform, output) {
  return output
    .replace(STRIKETHROUGH_REGEX, platformFormatting[platform].strikethrough)
    .replace(ITALIC_REGEX, platformFormatting[platform].italic)
    .replace(BOLD_REGEX, platformFormatting[platform].bold);
}

module.exports = {
  toDiscord: (botCommand) => {
    const command = {};

    command.data = new SlashCommandBuilder()
      .setName(botCommand.name)
      .setDescription(botCommand.description);

    if (botCommand.input) {
      command.data.addStringOption((option) =>
        option
          .setName(botCommand.input.name)
          .setDescription(botCommand.input.description)
          .setRequired(botCommand.input.required || false)
      );
    }

    command.execute = async (interaction) => {
      const client = interaction.client;
      const { channel } = interaction;
      const options = {
        cid: `discord_${interaction.channelId}`,
        sender: `<@${interaction.user.id}>`,
        input: interaction.options.getString(botCommand.input.name),
      };

      const { output, voxmode } = botCommand.execute(options);
      const formattedOutput = platformat("discord", output);
      switch (voxmode) {
        case "whisp":
          interaction.reply({ content: formattedOutput, ephemeral: true });
          break;
        case "holla":
          interaction.reply(`/${botCommand.name} ${options.input}`);
          channel.send(formattedOutput);
          break;
        case "blurt":
          interaction.reply({ content: options.input, ephemeral: true });
          channel.send(formattedOutput);
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

      const formattedOutput = platformat("slack", output);

      switch (voxmode) {
        case "whisp":
          ack({ response_type: "ephemeral", text: formattedOutput });
          break;
        case "holla":
          ack({ response_type: "in_channel", text: formattedOutput });
          break;
        case "blurt":
          await ack();
          respond({ response_type: "in_channel", text: formattedOutput });
          break;
        default:
          throw `Unrecognized voxmode  "${voxmode}"`;
      }
    };
  },
};
