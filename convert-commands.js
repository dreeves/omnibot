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
      const users = {};
      const client = interaction.client;
      const options = {
        cid: `discord_${interaction.channelId}`,
        sender: interaction.user.username,
      };

      users[interaction.user.username] = interaction.user.id;

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
        .replace(/@([a-zA-Z]+)/gi, (match, p1) => {
          const userId = users[p1];

          return `<@${userId}>`;
        });
      await interaction.reply(botResponse);
    };

    return command;
  },

  toSlack: (botCommand) => {
    return async ({ client, command, ack, respond }) => {
      const users = {};
      await ack();

      users[command.user_name] = command.user_id;

      const { members: userlist } = await client.users.list();
      await respond(
        botCommand
          .execute({
            sender: command.user_name,
            input: command.text.replace(/<@([a-zA-Z0-9]+).*>/g, (match, p1) => {
              const user = userlist.find((u) => u["id"] === p1);
              users[user.name] = p1;

              console.log(user.name);
              console.log(p1);

              return `@${user.name}`;
            }),
          })
          .replace(/@([a-zA-Z]+)/gi, (match, p1) => {
            const userId = users[p1];

            return `<@${userId}>`;
          })
      );
    };
  },
};
