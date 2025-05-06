const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js")
const { Config } = require("../../utils/config")

async function gameSelectionComponent(currentStep, userId) {
  const options = Config.games.map((game) => ({
    emoji: { id: game.emote.id, name: game.emote.name },
    label: game.name,
    value: game.value,
  }))

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`selectGameConfig_${currentStep}_${userId}`)
      .setPlaceholder("📌 Sélectionner une option...")
      .addOptions(options)
  )
}

module.exports = { gameSelectionComponent }
