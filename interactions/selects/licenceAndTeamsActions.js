const {
  licenceAndTeamActionsComponent,
} = require("../../components/Licence/licenceAndTeamActions")
const {
  licenceDisplayComponents,
} = require("../../components/Licence/licenceComponents")

module.exports = {
  customId: "teamsAndPersonnalProfilsActions",
  async execute(interaction) {
    const selectedAction = interaction.values[0]

    switch (selectedAction) {
      case "personalLicence": {
        const { embeds, components } = licenceDisplayComponents(
          interaction.user.id
        )
        return interaction.reply({
          embeds: embeds,
          components: components,
          ephemeral: true,
        })
      }

      default:
        return interaction.update({
          components: [licenceAndTeamActionsComponent()],
        })
    }
  },
}
