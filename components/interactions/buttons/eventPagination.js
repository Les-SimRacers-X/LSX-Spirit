const {
  eventGestionDisplay,
} = require("../../modules/module-events/eventGestionDisplay")
const { errorHandler } = require("../../../context/utils/errorHandling")

module.exports = {
  customId: ["previousEvent", "nextEvent"],
  async execute(interaction) {
    const [type, indexStr] = interaction.customId.split("_")
    let currentIndex = parseInt(indexStr)

    if (type === "previousEvent") currentIndex -= 1
    else if (type === "nextEvent") currentIndex += 1

    try {
      const { embeds, components } = await eventGestionDisplay(currentIndex)

      return interaction.update({
        embeds,
        components,
        ephemeral: true,
      })
    } catch (error) {
      await errorHandler(interaction, error)
    }
  },
}
