const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  toDiscord: (botCommand) => {
    const users = {};
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
        return (options[botOption.name] = interaction.options
          .getString(botOption.name)
          .replace(/<@(\d+)>/g, (match, p1) => {
            const user = client.users.cache.get(p1);
            users[user.username] = p1;

            return `@${user.username}`;
          }));
      });
      const botResponse = botCommand
        .execute(options)
        .replace(/@([a-z]+)/g, (match, p1) => {
          const userId = users[p1];

          return `<@${userId}>`;
        });
      await interaction.reply(botResponse);
    };

    return command;
  },
};
