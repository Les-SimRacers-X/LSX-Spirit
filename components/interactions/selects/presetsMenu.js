const {
  eventCreationTracking,
} = require("../../modules/module-events/eventCreationTracking")
const { errorHandler } = require("../../context/utils/errorHandling")
const { updateEventQuery } = require("../../context/data/data-events/mutations")

module.exports = {
  customId: "presetsMenu",
  async execute(interaction) {
    const [action, eventId] = interaction.customId.split("_")
    const selectedValue = interaction.values[0]

    try {
      const data = {
        preset_id: selectedValue,
      }

      await updateEventQuery(eventId, data)

      const { embeds, components } = await eventCreationTracking(eventId)

      return await interaction.update({
        embeds,
        components,
        ephemeral: true,
      })
    } catch (error) {
      await errorHandler(interaction, error)
    }
  },
}
