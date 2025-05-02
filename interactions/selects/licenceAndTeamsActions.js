const {
  licenceAndTeamActionsComponent,
} = require("../../components/licenceAndTeamActions")

module.exports = {
  customId: "teamsAndPersonnalProfilsActions",
  async execute(interaction) {
    const selectedAction = interaction.values[0]

    switch (selectedAction) {
      case "personalLicence": {
      }

      default:
        return interaction.update({
          components: [licenceAndTeamActionsComponent()],
        })
    }
  },
}
