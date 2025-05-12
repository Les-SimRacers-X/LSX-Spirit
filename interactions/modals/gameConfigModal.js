const { EmbedBuilder } = require("discord.js")
const {
  usernameAndNumberComponent,
} = require("../../components/Licence/usernameAndNumberComponent")
const { errorHandler } = require("../../utils/js/errorHandling")
const { getConsoleUXID } = require("../../utils/js/userGameUXID")
const { updateUserQuery } = require("../../utils/sql/users/mutations")
const {
  fetchNumberInAccountConfig,
  fetchUserAccountConfigByIdQuery,
} = require("../../utils/sql/users/queries")
const { Config } = require("../../utils/config")
const { emoteComposer } = require("../../utils/js/utils")

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
      const foundInstances = await fetchNumberInAccountConfig(
        gameSelected,
        reqNumberContent
      )
      const userConfig = await fetchUserAccountConfigByIdQuery(userId)
      let accountConfig = {}
      let defaultValues = {}

      defaultValues = {
        error: `Le numéro ${reqNumberContent} n'est pas disponible`,
        name: reqPseudoContent,
      }

      if (foundInstances.length > 0) {
        const inputModal = await usernameAndNumberComponent(
          step,
          userId,
          gameSelected,
          defaultValues
        )
        return interaction.showModal(inputModal)
      }

      const UXID = getConsoleUXID(reqPseudoContent)
      defaultValues = {
        error: `Votre pseudo ${reqPseudoContent} n'est pas retrouver !`,
      }

      let buildTrigram = reqPseudoContent.match(/[a-zA-Z]/g) || []
      while (trigram.length < 3) {
        trigram.push(String.fromCharCode(65 + Math.random() * 26))
      }

      const trigram = buildTrigram.slice(0, 3).join("").toUpperCase()

      if (platformGameId === undefined) {
        const inputModal = await usernameAndNumberComponent(
          step,
          userId,
          gameSelected,
          defaultValues
        )
        return interaction.showModal(inputModal)
      }

      accountConfig = JSON.parse(userConfig.account_config)
      if (accountConfig[gameSelected]) {
        accountConfig[gameSelected].id = `${UXID.platform}${UXID.id}`
        accountConfig[gameSelected].name = reqPseudoContent
        accountConfig[gameSelected].trigram = trigram
        accountConfig[gameSelected].number = reqNumberContent
      }

      const userData = {
        account_config: JSON.stringify(accountConfig),
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
      errorHandler(interaction, error)
    }
  },
}
