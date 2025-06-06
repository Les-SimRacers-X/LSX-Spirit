const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');
const {
  deletePresetByIdQuery,
} = require('../../../context/data/data-presets/mutations');
const { Config } = require('../../../context/config');
const { emoteComposer } = require('../../../context/utils/utils');

module.exports = {
  customId: 'presetManagment',
  async execute(interaction) {
    const [action, presetId] = interaction.customId.split('_');
    const selectedValue = interaction.value[0];

    switch (selectedValue) {
      case 'addPreset': {
        const modalPresetCreation = new ModalBuilder()
          .setCustomId(`modalPresetCreation`)
          .setTitle('Ajouter un nouveau preset');

        const modalPresetName = new TextInputBuilder()
          .setCustomId('modalPresetNameInput')
          .setLabel('Entrez le nom du preset :')
          .setPlaceholder('Exemple : GT3')
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        const modalPresetCategory = new TextInputBuilder()
          .setCustomId(`modalPresetCategoryInput`)
          .setLabel('Entrez les catégories du preset :')
          .setPlaceholder('Exemple : GT3-20;GT4-20')
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        const modalPresetLicence = new TextInputBuilder()
          .setCustomId(`modalPresetLicenceInput`)
          .setLabel('Obliger une licence ?')
          .setPlaceholder('Exemple : Oui ou Non')
          .setMinLength(3)
          .setMaxLength(3)
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        const reqModalPresetNameInput = new ActionRowBuilder().addComponents(
          modalPresetName
        );
        const reqModalPresetCategoryInput =
          new ActionRowBuilder().addComponents(modalPresetCategory);
        const reqModalPresetLicenceInput = new ActionRowBuilder().addComponents(
          modalPresetLicence
        );

        modalPresetCreation.addComponents(
          reqModalPresetNameInput,
          reqModalPresetCategoryInput,
          reqModalPresetLicenceInput
        );

        await interaction.showModal(modalPresetCreation);
      }

      case 'deletePreset': {
        await deletePresetByIdQuery(presetId);

        const presetSuppressed = new EmbedBuilder()
          .setColor(Config.colors.success)
          .setDescription(
            `### ${emoteComposer(
              Config.emotes.success
            )} Le preset a était supprimé avec succès !`
          );

        return interaction.reply({
          embeds: [presetSuppressed],
          ephemeral: true,
        });
      }

      default:
        return;
    }
  },
};
