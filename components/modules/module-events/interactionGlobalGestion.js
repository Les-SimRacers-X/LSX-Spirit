const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js")

function interactionGlobalBotGestion() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId(`botManagment`).addOptions(
      {
        emoji: { name: "📌" },
        label: "Sélectionner une option...",
        value: "refresh",
        default: true,
      },
      {
        emoji: { name: "📆" },
        label: "Événements",
        description: "Gestion et création des événements",
        value: "events",
      },
      {
        emoji: { name: "🪛" },
        label: "Presets",
        description: "Gestion et création des presets",
        value: "presets",
      },
      {
        emoji: { name: "🏁" },
        label: "Circuits",
        description: "Gestion et ajout des circuits",
        value: "tracks",
      }
    )
  )
}

module.exports = { interactionGlobalBotGestion }
