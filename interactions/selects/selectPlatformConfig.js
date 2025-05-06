const {
  licenceEvolutionComponent,
} = require("../../components/Licence/licenceEvolution")
const { errorHandler } = require("../../utils/js/errorHandling")
const { updateUserQuery } = require("../../utils/sql/users/mutations")
const {
  fetchUserAccountConfigByIdQuery,
} = require("../../utils/sql/users/queries")

module.exports = {
  customId: "selectPlatformConfig",
  async execute(interaction) {
    const [action, step, gameSelected, userId] = interaction.customId.split("_")
    const selectedAction = interaction.values[0]
    const currentStep = parseInt(step) + 1

    try {
      const userConfig = await fetchUserAccountConfigByIdQuery(userId)
      let accountConfig = {}

      if (userConfig && userConfig.length > 0 && userConfig.account_config) {
        accountConfig = JSON.parse(userConfig.account_config)
      }

      if (accountConfig[gameSelected]) {
        accountConfig[gameSelected].platform = selectedAction
      }

      const userData = {
        account_config: JSON.stringify(accountConfig),
      }

      await updateUserQuery(userId, userData)

      const { embedEvolution, interactionEvolution } =
        licenceEvolutionComponent(currentStep, userId, gameSelected)

      return interaction.update({
        embeds: [embedEvolution],
        components: [interactionEvolution],
        ephemeral: true,
      })
    } catch (error) {
      errorHandler(interaction, error)
    }
  },
}
