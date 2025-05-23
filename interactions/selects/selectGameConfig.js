const {
  licenceEvolutionComponent,
} = require("../../components/module-licence/licenceEvolution")
const { errorHandler } = require("../../utils/js/errorHandling")
const { updateUserQuery } = require("../../utils/sql/data-users/mutations")
const {
  fetchUserAccountConfigByIdQuery,
} = require("../../utils/sql/data-users/queries")

module.exports = {
  customId: "selectGameConfig",
  async execute(interaction) {
    const [action, step, game, userId] = interaction.customId.split("_")
    const selectedAction = interaction.values[0]
    const currentStep = parseInt(step) + 1
    let accountConfig = {}

    try {
      const userConfig = await fetchUserAccountConfigByIdQuery(userId)

      if (userConfig.account_config) {
        accountConfig = JSON.parse(userConfig.account_config)

        if (!accountConfig[selectedAction]) {
          accountConfig[selectedAction] = {
            id: "",
            name: "",
            trigram: "",
            platform: "",
            number: null,
          }
        }
      } else {
        accountConfig = {
          [selectedAction]: {
            id: "",
            name: "",
            trigram: "",
            platform: "",
            number: null,
          },
        }
      }

      const userData = {
        account_config: JSON.stringify(accountConfig),
      }

      await updateUserQuery(userId, userData)

      const { embedEvolution, interactionEvolution } =
        licenceEvolutionComponent(currentStep, userId, selectedAction)

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
