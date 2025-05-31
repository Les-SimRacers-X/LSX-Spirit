const { errorHandler } = require("../../../context/utils/errorHandling")
const {
  trackGestionDisplay,
} = require("../../modules/module-tracks/trackGestionDisplay")

module.exports = {
  customId: ["previousTrack", "nextTrack"],
  async execute(interaction) {
    const [type, indexStr] = interaction.customId.split("_")
    let currentIndex = parseInt(indexStr)

    if (type === "previousTrack") currentIndex -= 1
    else if (type === "nextTrack") currentIndex += 1

    try {
      const { embeds, components } = await trackGestionDisplay(currentIndex)

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
