const {
  eventCreationTracking,
} = require("../../modules/module-events/eventCreationTracking")
const {
  updateEventQuery,
} = require("../../../context/data/data-events/mutations")

module.exports = {
  customId: "tracksMenu",
  async execute(interaction) {
    const [action, eventId] = interaction.customId.split("_")
    const selectedValue = interaction.values[0]

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
  },
}
