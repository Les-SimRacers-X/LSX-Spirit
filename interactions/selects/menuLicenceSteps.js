const { EmbedBuilder } = require("discord.js")
const {
  gameSelectionComponent,
} = require("../../components/module-licence/gameSelectionComponent")
const {
  platformSelectionComponent,
} = require("../../components/module-licence/platformSelectionComponent")
const {
  usernameAndNumberComponent,
} = require("../../components/module-licence/usernameAndNumberComponent")
const { Config } = require("../../utils/config")
const { emoteComposer } = require("../../utils/js/utils")

module.exports = {
  customId: "menuLicenceSteps",
  async execute(interaction) {
    const [action, step, gameSelected, userId] = interaction.customId.split("_")
    const selectedAction = interaction.values[0]

    switch (selectedAction && step) {
      case "1": {
        return interaction.update({
          components: [gameSelectionComponent(step, userId)],
          ephemeral: true,
        })
      }

      case "2": {
        return interaction.update({
          components: [platformSelectionComponent(step, userId, gameSelected)],
          ephemeral: true,
        })
      }

      case "3": {
        const inputModal = await usernameAndNumberComponent(
          step,
          userId,
          gameSelected
        )
        return interaction.showModal(inputModal)
      }

      default:
        const embed = new EmbedBuilder()
          .setColor(Config.colors.error)
          .setDescription(
            `### ${emoteComposer(
              Config.emotes.failure
            )} Vous avez sauté une étape !`
          )

        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })
    }
  },
}
