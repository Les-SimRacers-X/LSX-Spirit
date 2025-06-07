const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require('discord.js');
const { Config } = require('../context/config');
const { emoteComposer } = require('../context/utils/utils');

module.exports = {
  name: 'send-sanction',
  type: 'APPLICATION',

  async run(interaction) {
    if (!interaction.member.roles.cache.has('1321919765140344895')) {
      const embedNoPermissions = new EmbedBuilder()
        .setColor(Config.colors.failure)
        .setDescription(
          `### ${emoteComposer(Config.emotes.failure)} Vous n'avez pas les permissions nécessaire pour utiliser cette command !`
        );

      return interaction.reply({
        embeds: [embedNoPermissions],
        ephemeral: true,
      });
    } else {
      const user = interaction.targetUser;
      // Modal d'envoi de sanction
      const modalSendingSanction = new ModalBuilder()
        .setCustomId(`sendSanction_${user.id}`)
        .setTitle('Envoi de sanction');

      const modalMessageInput = new TextInputBuilder()
        .setCustomId(`messageContent`)
        .setLabel('Description de la sanction')
        .setPlaceholder('Exemple : Absence sur un événement...')
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph);

      const modalPointToRemoveInput = new TextInputBuilder()
        .setCustomId(`sanctionPoints`)
        .setLabel('Points à retirer :')
        .setPlaceholder('Exemple : 5 ou rien aucun points à enlever')
        .setStyle(TextInputStyle.Short);

      const modalMessageActionRow = new ActionRowBuilder().addComponents(
        modalMessageInput
      );

      const modalPointToRemoveActionRow = new ActionRowBuilder().addComponents(
        modalPointToRemoveInput
      );

      modalSendingSanction.addComponents(
        modalMessageActionRow,
        modalPointToRemoveActionRow
      );

      interaction.showModal(modalSendingSanction);
    }
  },
};
