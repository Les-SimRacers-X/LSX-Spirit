const Discord = require('discord.js');
const { Config } = require('../context/config');

module.exports = {
  name: 'send-sanction',
  type: 'APPLICATION',

  async run(bot, interaction) {
    if (!interaction.member.roles.cache.has('1321919765140344895')) {
      const embedNoPermissions = new Discord.EmbedBuilder()
        .setColor(Config.colors.crossColor)
        .setDescription(
          `${Config.emojis.crossEmoji} **Vous n'avez pas les permissions nécessaire pour utiliser cette command !**`
        );

      return interaction.reply({
        embeds: [embedNoPermissions],
        ephemeral: true,
      });
    } else {
      const user = interaction.targetUser;
      // Modal d'envoi de sanction
      const modalSendingSanction = new Discord.ModalBuilder()
        .setCustomId(`sendSanction_${user.id}`)
        .setTitle('Envoi de sanction');

      const modalMessageInput = new Discord.TextInputBuilder()
        .setCustomId(`messageContent`)
        .setLabel('Description de la sanction')
        .setPlaceholder('Exemple : Absence sur un événement...')
        .setRequired(true)
        .setStyle(Discord.TextInputStyle.Paragraph);

      const modalPointToRemoveInput = new Discord.TextInputBuilder()
        .setCustomId(`sanctionPoints`)
        .setLabel('Points à retirer :')
        .setPlaceholder('Exemple : 5 ou rien aucun points à enlever')
        .setStyle(Discord.TextInputStyle.Short);

      const modalMessageActionRow =
        new Discord.ActionRowBuilder().addComponents(modalMessageInput);

      const modalPointToRemoveActionRow =
        new Discord.ActionRowBuilder().addComponents(modalPointToRemoveInput);

      modalSendingSanction.addComponents(
        modalMessageActionRow,
        modalPointToRemoveActionRow
      );

      interaction.showModal(modalSendingSanction);
    }
  },
};
