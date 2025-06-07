const {
  presetGestionDisplay,
} = require('../../modules/module-presets/presetGestionDisplay');

module.exports = {
  customId: ['previousPreset', 'nextPreset'],
  async execute(interaction) {
    const [type, indexStr] = interaction.customId.split('_');
    let currentIndex = parseInt(indexStr);

    if (type === 'previousPreset') currentIndex -= 1;
    else if (type === 'nextPreset') currentIndex += 1;

    const { embeds, components } = await presetGestionDisplay(currentIndex);

    return interaction.update({
      embeds,
      components,
      ephemeral: true,
    });
  },
};
