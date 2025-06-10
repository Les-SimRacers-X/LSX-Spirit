const { generateEvent } = require('../../modules/module-events/eventDisplay');

module.exports = {
  customId: 'sendEvent',
  async execute(interaction) {
    const [action, eventId] = interaction.customId.split('_');
    const { embeds } = await generateEvent(eventId);

    return await interaction.reply({
      embeds: embeds,
      ephemeral: true,
    });
  },
};
