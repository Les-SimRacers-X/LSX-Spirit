const { EmbedBuilder } = require("discord.js")
const {
  usernameAndNumberComponent,
} = require("../../modules/module-licence/usernameAndNumberComponent")
const { errorHandler } = require("../../../context/utils/errorHandling")
const { getConsoleUXID } = require("../../../context/utils/userGameUXID")
const {
  updateUserQuery,
} = require("../../../context/data/data-users/mutations")
const {
  fetchNumberInAccountConfig,
  fetchUserAccountConfigByIdQuery,
} = require("../../../context/data/data-users/queries")
const { Config } = require("../../../context/config")
const { emoteComposer } = require("../../../context/utils/utils")

module.exports = {
  customId: "gameConfigModal",
  async execute(interaction) {
    const [action, step, gameSelected, userId] = interaction.customId.split("_")
    const reqPseudoContent =
      interaction.fields.getTextInputValue("usernameInput")
    const reqNumberContent = parseInt(
      interaction.fields.getTextInputValue("numberInput")
    )

    try {
      const usedNumbers = await fetchNumberInAccountConfig(gameSelected)
      let defaultValues = {}

      if (usedNumbers.includes(reqNumberContent)) {
        let availableNumber = reqNumberContent + 1
        while (usedNumbers.includes(availableNumber)) {
          availableNumber++
        }
        defaultValues = {
          error: `Le numéro ${reqNumberContent} n'est pas disponible. Suggestion ${availableNumber}`,
          name: reqPseudoContent,
          suggestionNumber: availableNumber,
        }

        const inputModal = await usernameAndNumberComponent(
          step,
          userId,
          gameSelected,
          defaultValues
        )
        return interaction.showModal(inputModal)
      }

      const [userConfig] = await fetchUserAccountConfigByIdQuery(userId)
      let accountConfig = {}

      const UXID = await getConsoleUXID(reqPseudoContent)
      defaultValues = {
        error: `Votre pseudo "${reqPseudoContent}" n'est pas retrouver !`,
      }

      if (UXID.id === undefined) {
        const inputModal = await usernameAndNumberComponent(
          step,
          userId,
          gameSelected,
          defaultValues
        )
        return interaction.showModal(inputModal)
      }

      let buildTrigram = reqPseudoContent.match(/[a-zA-Z]/g) || []
      while (buildTrigram.length < 3) {
        buildTrigram.push(String.fromCharCode(65 + Math.random() * 26))
      }

      const trigram = buildTrigram.slice(0, 3).join("").toUpperCase()

      accountConfig = JSON.parse(userConfig.gameConfig)
      if (accountConfig[gameSelected]) {
        accountConfig[gameSelected].id = `${UXID.platform}${UXID.id}`
        accountConfig[gameSelected].name = reqPseudoContent
        accountConfig[gameSelected].trigram = trigram
        accountConfig[gameSelected].number = reqNumberContent
      }

      const userData = {
        accounts_config: JSON.stringify(accountConfig),
      }

      await updateUserQuery(userId, userData)

      const answerUser = new EmbedBuilder()
        .setColor(Config.colors.success)
        .setDescription(
          `### ${emoteComposer(
            Config.emotes.success
          )} Votre licence a été correctement configurée ! Veuillez cliquer de nouveau sur \`Licence LSX\` pour consulter votre licence.`
        )

      return interaction.update({
        embeds: [answerUser],
        components: [],
        ephemeral: true,
      })
    } catch (error) {
      await errorHandler(interaction, error)
    }
  },
}
