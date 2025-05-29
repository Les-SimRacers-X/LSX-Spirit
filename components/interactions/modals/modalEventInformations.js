const {
  eventCreationTracking,
} = require("../../modules/module-events/eventCreationTracking")
const { errorHandler } = require("../../context/utils/errorHandling")
const { updateEventQuery } = require("../../context/data/data-events/mutations")

module.exports = {
  customId: "modalEvent",
  async execute(interaction) {
    const [action, eventId] = interaction.customId.split("_")
    const reqEventDescription =
      interaction.fields.getTextInputValue("descriptionInput")
    const reqEventDate = interaction.fields.getTextInputValue("DateInput")
    const reqEventHour = interaction.fields.getTextInputValue("HourInput")

    try {
      const [day, month, year] = reqEventDate.split("/").map(Number)
      const [hours, minutes] = reqEventHour.split(":").map(Number)
      const eventDate = Math.floor(
        Date.UTC(year, month - 1, day, hours - 2, minutes) / 1000
      )

      const data = {
        description: reqEventDescription,
        timestamp: eventDate,
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
