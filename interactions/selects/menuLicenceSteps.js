const { EmbedBuilder } = require("discord.js")
const {
  gameSelectionComponent,
} = require("../../components/Licence/gameSelectionComponent")
const {
  platformSelectionComponent,
} = require("../../components/Licence/platformSelectionComponent")
const {
  usernameAndNumberComponent,
} = require("../../components/Licence/usernameAndNumberComponent")
const { Config } = require("../../utils/config")
const { emoteComposer } = require("../../utils/js/errorHandling")

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
              Config.emotes.failure.id,
              Config.emotes.failure.name
            )} Vous avez sauté une étape !`
          )

        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })
    }
  },
}
