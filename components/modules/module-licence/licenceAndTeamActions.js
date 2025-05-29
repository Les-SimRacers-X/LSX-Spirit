const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js")

function licenceAndTeamActionsComponent() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`teamsAndPersonnalProfilsActions`)
      .addOptions(
        {
          emoji: { name: "📌" },
          label: "Sélectionner une option...",
          value: "options",
          default: true,
        },
        {
          emoji: { name: "💳" },
          label: "Licence LSX",
          description: "Créer ou admirez votre licence",
          value: "personalLicence",
        },
        {
          emoji: { name: "🤝" },
          label: "Équipes",
          description: "Accéder aux différentes équipes disponibles !",
          value: "teams",
        },
        {
          emoji: { name: "👥" },
          label: "Mon équipe",
          description: "Vous êtes dans une équipe ? Vous pouvez regarder !",
          value: "myTeam",
        }
      )
  )
}

module.exports = {
  licenceAndTeamActionsComponent,
}
