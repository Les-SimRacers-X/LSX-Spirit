const { generateID, emoteComposer } = require("../../context/utils/utils")
const { errorHandler } = require("../../context/utils/errorHandling")
const {
  insertEventQuery,
  updateEventQuery,
  deleteEventByIdQuery,
} = require("../../context/data/data-events/mutations")
const { getEventByIdQuery } = require("../../context/data/data-events/queries")
const {
  eventCreationTracking,
} = require("../../modules/module-events/eventCreationTracking")
const { EmbedBuilder } = require("discord.js")
const { Config } = require("../../context/config")

module.exports = {
  customId: "eventManagment",
  async execute(interaction) {
    const [action, eventId] = interaction.customId.split("_")
    const [event] = await getEventByIdQuery(eventId)
    const selectedValue = interaction.values[0]

    try {
      switch (selectedValue) {
        case "addEvent": {
          const newEvenId = generateID()
          const data = {
            id: newEvenId,
            track_id: "None",
            preset_id: "None",
            description: "",
            users: "[]",
            timestamp: "",
            message_id: "",
            channel_id: "",
            status: "true",
          }

          await insertEventQuery(data)

          const { embeds, components } = await eventCreationTracking(newEvenId)

          return await interaction.update({
            embeds,
            components,
            ephemeral: true,
          })
        }

        case "changeStatus": {
          const newStatus = event.status === "true" ? "false" : "true"
          const data = {
            status: newStatus,
          }

          await updateEventQuery(eventId, data)

          const changedStatus = new EmbedBuilder()
            .setColor(Config.colors.success)
            .setDescription(
              `${emoteComposer(
                Config.emotes.success
              )} Status d'événement modifier avec succès !`
            )

          return await interaction.reply({
            embeds: [changedStatus],
            ephemeral: true,
          })
        }

        case "deleteEvent": {
          const message = await (
            await bot.channels.fetch(event.channelId)
          ).messages.fetch(event.messageId)

          if (!message) return

          await message.delete()
          await deleteEventByIdQuery(eventId)

          const eventDeleted = new EmbedBuilder()
            .setColor(Config.colors.success)
            .setDescription(
              `### ${emoteComposer(
                Config.emotes.success
              )} L'événement ainsi que son message associé ont été supprimés avec succès.`
            )

          return await interaction.reply({
            embeds: [eventDeleted],
            ephemeral: true,
          })
        }
        default:
          return
      }
    } catch (error) {
      await errorHandler(interaction, error)
    }
  },
}
