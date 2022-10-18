const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bid')
		.setDescription('Replies with its input')
        .addStringOption(option => option.setName('input').setDescription('Text to repeat back')),
	async execute(interaction) {
        const input = interaction.options.getString('input') ?? 'nothing'
		await interaction.reply(`roger that "${input}"; the bid command doesn't do anything yet so i bid thee farewell!`)
	},
}
