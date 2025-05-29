const { generateEvent } = require("../../modules/module-events/eventDisplay")
const { errorHandler } = require("../../context/utils/errorHandling")

module.exports = {
  customId: "sendEvent",
  async execute(interaction) {
    const [action, eventId] = interaction.customId.split("_")
    try {
      const { embeds } = await generateEvent(eventId)

      return await interaction.reply({
        embeds,
        ephemeral: true,
      })
    } catch (error) {
      await errorHandler(interaction, error)
    }
  },
}
