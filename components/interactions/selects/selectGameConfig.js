const {
  licenceEvolutionComponent,
} = require("../../modules/module-licence/licenceEvolution")
const {
  updateUserQuery,
} = require("../../../context/data/data-users/mutations")
const {
  fetchUserAccountConfigByIdQuery,
} = require("../../../context/data/data-users/queries")

module.exports = {
  customId: "selectGameConfig",
  async execute(interaction) {
    const [action, step, userId] = interaction.customId.split("_")
    const selectedAction = interaction.values[0]
    const currentStep = parseInt(step) + 1
    let accountConfig = {}

    const [userConfig] = await fetchUserAccountConfigByIdQuery(userId)

    if (userConfig.gameConfig) {
      accountConfig = JSON.parse(userConfig.gameConfig)

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
      accounts_config: JSON.stringify(accountConfig),
    }

    await updateUserQuery(userId, userData)

    const { embeds, components } = await licenceEvolutionComponent(
      currentStep,
      userId,
      selectedAction
    )

    return interaction.update({
      embeds,
      components,
      ephemeral: true,
    })
  },
}
