const { EmbedBuilder } = require("discord.js")
const { Config } = require("../../../context/config")
const {
  insertPresetQuery,
} = require("../../../context/data/data-presets/mutations")
const { generateID, emoteComposer } = require("../../../context/utils/utils")

module.exports = {
  customId: "modalPresetCreation",
  async execute(interaction) {
    const [action, presetId] = interaction.customId.split("_")
    const reqPresetNameContent = interaction.fields.getTextInputValue(
      "modalPresetNameInput"
    )
    const reqPresetCategoryContent = interaction.fields.getTextInputValue(
      "modalPresetCategoryInput"
    )
    const reqPresetLicenceContent = interaction.fields.getTextInputValue(
      "modalPresetLicenceInput"
    )

    const presetID = generateID()

    const checkLicenceObligation =
      reqPresetLicenceContent === "Oui"
        ? "true"
        : reqPresetCategoryContent === "Non"
        ? "false"
        : null

    const data = {
      id: presetID,
      name: reqPresetNameContent,
      categories: reqPresetCategoryContent,
      licence: checkLicenceObligation,
    }

    await insertPresetQuery(data)

    const embedAddedNewPresetSuccessfully = new EmbedBuilder()
      .setColor(Config.colors.checkColor)
      .setDescription(
        `### ${emoteComposer(Config.emotes.success)} Ajout du preset réussi !`
      )

    await interaction.reply({
      embeds: [embedAddedNewPresetSuccessfully],
      ephemeral: true,
    })
  },
}
