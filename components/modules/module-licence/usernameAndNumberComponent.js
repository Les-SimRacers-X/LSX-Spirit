const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js")
const {
  fetchUserProfilByIdQuery,
} = require("../../context/data/data-users/queries")
const { Config } = require("../../context/config")

async function usernameAndNumberComponent(
  currentStep,
  userId,
  gameSelected,
  defaultValues = {}
) {
  try {
    const [user] = await fetchUserProfilByIdQuery(userId)
    const gameConfig = JSON.parse(user?.gameConfig)
    const platformDetails = Config.platforms.find(
      (platform) => platform.value === gameConfig[gameSelected].platform
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
      .setValue(`${defaultValues.suggestionNumber || ""}`)

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
