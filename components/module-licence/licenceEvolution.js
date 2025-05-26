const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js")
const {
  fetchUserProfilByIdQuery,
} = require("../../utils/sql/data-users/queries")
const { Config } = require("../../utils/config")

async function licenceEvolutionComponent(currentStep, userId, gameSelected) {
  const [users] = await fetchUserProfilByIdQuery(userId)
  const embedEvolution = new EmbedBuilder().setColor(Config.colors.default)
    .setDescription(`### ⚙️ Votre configuration\n
      \`\`\`json
      ${users.gameConfig}
      \`\`\``)

  const interactionEvolution = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`menuLicenceSteps_${currentStep}_${gameSelected}_${userId}`)
      .setPlaceholder("📌 Sélectionner une option...")
      .addOptions(
        {
          emoji: { name: "🎮" },
          label: "Jeux",
          description: "Ajouter votre jeu !",
          value: "1",
        },
        {
          emoji: { name: "🧰" },
          label: "Platformes",
          description: "Sélectionnez une platforme !",
          value: "2",
        },
        {
          emoji: { name: "🏷️" },
          label: "Pseudo et numéro",
          description:
            "Entrez votre pseudo et le numéro que vous avez choisi !",
          value: "3",
        }
      )
  )

  return {
    embedEvolution,
    interactionEvolution,
  }
}

module.exports = {
  licenceEvolutionComponent,
}
