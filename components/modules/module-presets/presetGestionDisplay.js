const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const {
  fetchPresetsQuery,
} = require('../../../context/data/data-presets/queries');
const { Config } = require('../../../context/config');
const { emoteComposer } = require('../../../context/utils/utils');

async function presetGestionDisplay(currentIndex) {
  const preset = await fetchPresetsQuery();
  const currentPreset = preset[currentIndex];

  if (!currentPreset) {
    const noPresets = new EmbedBuilder()
      .setColor(Config.colors.error)
      .setDescription(
        `### ${emoteComposer(
          Config.emotes.failure
        )} Aucun preset n'a encore été créer !`
      );

    const selectPresetManagment = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`presetManagment`)
        .setPlaceholder('📌 Séléctionner une option...')
        .addOptions({
          emoji: '➕',
          label: 'Ajouter un preset',
          value: 'addPreset',
        })
    );

    return {
      embeds: [noPresets],
      components: [selectPresetManagment],
    };
  }

  let checkPreviousPresetIndex, checkNextPresetIndex, checkLicenceObligation;
  const checkCurrentPresetIndex = currentIndex + 1;

  checkPreviousPresetIndex =
    currentIndex === 0 && checkCurrentPresetIndex === preset.length
      ? true
      : currentIndex === 0
        ? true
        : false;
  checkNextPresetIndex =
    currentIndex === 0 && checkCurrentPresetIndex === preset.length
      ? true
      : checkCurrentPresetIndex === preset.length
        ? true
        : false;

  checkLicenceObligation =
    currentPreset.licenceObligation === 'true'
      ? 'Licence obligatoire'
      : 'Licence non obligatoire';

  const presetInformation = new EmbedBuilder()
    .setColor(Config.colors.default)
    .setDescription(
      `## ⚙️ Informations du preset ${currentPreset.id}\n- 📋 Nom du preset : ${currentPreset.name}\n- 🗃️ Catégories : ${currentPreset.categories}`
    )
    .setImage(Config.PNG)
    .setFooter({
      text: `Preset : ${checkCurrentPresetIndex} sur ${preset.length}`,
    });

  const selectPresetManagment = new ActionRowBuilder.addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`presetManagment_${currentPreset.id}`)
      .setPlaceholder('📌 Séléctionner une option...')
      .addOptions(
        {
          emoji: '➕',
          label: 'Ajouter un preset',
          value: 'addPreset',
        },
        {
          emoji: '🗑️',
          label: 'Supprimer le preset',
          description: '‼️ Attention, aucune confirmation n'est demandée',
          value: 'deletePreset',
        }
      )
  );

  const buttonPresetManagment = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`previousPreset_${currentIndex}`)
        .setEmoji(Config.emotes.previousArrow)
        .setDisabled(checkPreviousPresetIndex)
        .setStyle(ButtonStyle.Secondary)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`nextPreset_${currentIndex}`)
        .setEmoji(Config.emotes.nextArrow)
        .setDisabled(checkNextPresetIndex)
        .setStyle(ButtonStyle.Secondary)
    );

  return {
    embeds: [presetInformation],
    components: [selectPresetManagment, buttonPresetManagment],
  };
}

module.exports = {
  presetGestionDisplay,
};
