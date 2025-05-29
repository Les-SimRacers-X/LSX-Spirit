const {
  updateEventMessage,
} = require("../../modules/module-events/eventDisplay")

module.exports = {
  customId: "registerParticipation",
  async execute(interaction) {
    const [action, category] = interaction.customId.split("_")

    const { embeds } = await updateEventMessage(interaction, category)

    return await interaction.message.edit({
      embeds,
    })
  },
}
