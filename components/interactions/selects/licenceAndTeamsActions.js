const {
  licenceAndTeamActionsComponent,
} = require("../../modules/module-licence/licenceAndTeamActions")
const {
  licenceDisplayComponents,
} = require("../../modules/module-licence/licenceComponents")

module.exports = {
  customId: "teamsAndPersonnalProfilsActions",
  async execute(interaction) {
    const selectedAction = interaction.values[0]

    switch (selectedAction) {
      case "personalLicence": {
        const { embeds, components } = await licenceDisplayComponents(
          interaction.user.id
        )

        return interaction.reply({
          embeds: embeds,
          components: components,
          ephemeral: true,
        })
      }

      case "teams": {
      }

      default:
        return interaction.update({
          components: [licenceAndTeamActionsComponent()],
        })
    }
  },
}
