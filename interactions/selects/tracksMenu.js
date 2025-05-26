const {
  eventCreationTracking,
} = require("../../components/module-events/eventCreationTracking")
const { errorHandler } = require("../../utils/js/errorHandling")
const { updateEventQuery } = require("../../utils/sql/data-events/mutations")

module.exports = {
  customId: "tracksMenu",
  async execute(interaction) {
    const [action, eventId] = interaction.customId.split("_")
    const selectedValue = interaction.values[0]

    try {
      const data = {
        track_id: selectedValue,
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
