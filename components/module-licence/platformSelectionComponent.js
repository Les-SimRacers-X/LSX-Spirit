const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js")
const { Config } = require("../../utils/config")

async function platformSelectionComponent(currentStep, userId, gameSelected) {
  const options = Config.platforms.map((platform) => ({
    emoji: { id: platform.emote.id, name: platform.emote.name },
    label: platform.name,
    value: platform.value,
  }))

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(
        `selectPlatformConfig_${currentStep}_${gameSelected}_${userId}`
      )
      .setPlaceholder("📌 Sélectionner une option...")
      .addOptions(options)
  )
}

module.exports = { platformSelectionComponent }
