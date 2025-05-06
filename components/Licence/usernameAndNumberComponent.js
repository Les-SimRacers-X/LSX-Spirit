const { ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const {
  fetchUserAccountConfigDetailsByIdQuery,
} = require("../../utils/sql/users/queries")
const { Config } = require("../../utils/config")

async function usernameAndNumberComponent(
  currentStep,
  userId,
  gameSelected,
  defaultValues = {}
) {
  try {
    const userGameConfigRow = await fetchUserAccountConfigDetailsByIdQuery(
      gameSelected,
      userId
    )
    const gameConfig = userGameConfigRow?.game_config
    const platformDetails = Config.platforms.find(
      (platform) => platform.value === gameConfig.platform
    )

    const modal = new ModalBuilder()
      .setCustomId(`gameConfigModal_${currentStep}_${gameSelected}_${userId}`)
      .setTitle("Formulaire de licence")

    const usernameInput = new TextInputBuilder()
      .setCustomId(`usernameInput`)
      .setLabel(
        `${
          defaultValues.error || `Quel est votre pseudo ${platformDetails.name}`
        }`
      )
      .setPlaceholder("Exemple : toto")
      .setRequired(true)
      .setStyle(TextInputStyle.Short)
      .setValue(defaultValues.name || "")

    const numberInput = new TextInputBuilder()
      .setCustomId(`numberInput`)
      .setLabel(`${defaultValues.error || "Entrez un numéro disponible"}`)
      .setPlaceholder("Exemple : 493")
      .setRequired(true)
      .setStyle(TextInputStyle.Short)

    const firstActionRow = new ActionRowBuilder().addComponents(usernameInput)
    const secondActionRow = new ActionRowBuilder().addComponents(numberInput)

    modal.addComponents(firstActionRow, secondActionRow)

    return modal
  } catch (error) {
    console.error(
      "Erreur lors de l'utilisation du component 'usernameAndNumberComponent' : ",
      error
    )
    throw error
  }
}

module.exports = { usernameAndNumberComponent }
