const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js")
const { errorHandler } = require("../../../context/utils/errorHandling")
const {
  deleteTrackByIdQuery,
} = require("../../../context/data/data-tracks/mutations")
const { Config } = require("../../../context/config")
const { emoteComposer } = require("../../../context/utils/utils")

module.exports = {
  customId: "trackManagment",
  async execute(interaction) {
    const [action, trackId] = interaction.customId.split("_")
    const selectedValue = interaction.values[0]

    try {
      switch (selectedValue) {
        case "addTrack": {
          const modalTrackCreation = new ModalBuilder()
            .setCustomId(`modalTrackCreation`)
            .setTitle("Ajouter un nouveau circuit")

          const modalTrackFlag = new TextInputBuilder()
            .setCustomId("modalTrackFlagInput")
            .setLabel("Entrez le drapeau du circuit :")
            .setPlaceholder("Exemple : 🇫🇷")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)

          const modalTrackCountry = new TextInputBuilder()
            .setCustomId(`modalTrackCountryInput`)
            .setLabel("Entrez le pays du circuit :")
            .setPlaceholder("Exemple : France")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)

          const modalTrackName = new TextInputBuilder()
            .setCustomId(`modalTrackNameInput`)
            .setLabel("Entrez le nom du circuit :")
            .setPlaceholder("Exemple : Paul Ricard")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)

          const modalTrackLength = new TextInputBuilder()
            .setCustomId(`modalTrackLengthInput`)
            .setLabel("Entrez la longueur du circuit :")
            .setPlaceholder("Exemple : 5.810 KM")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)

          const modalTrackImage = new TextInputBuilder()
            .setCustomId(`modalTrackImageInput`)
            .setLabel("Entrez une image du circuit (lien) :")
            .setPlaceholder(
              "Exemple : https://fr.wikipedia.org/Image/PaulRicard-Circuit"
            )
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph)

          const reqModalTrackFlagInput = new ActionRowBuilder().addComponents(
            modalTrackFlag
          )
          const reqModalTrackCountryInput =
            new ActionRowBuilder().addComponents(modalTrackCountry)
          const reqModalTrackNameInput = new ActionRowBuilder().addComponents(
            modalTrackName
          )
          const reqModalTrackLengthInput = new ActionRowBuilder().addComponents(
            modalTrackLength
          )
          const reqModalTrackImageInput = new ActionRowBuilder().addComponents(
            modalTrackImage
          )

          modalTrackCreation.addComponents(
            reqModalTrackFlagInput,
            reqModalTrackCountryInput,
            reqModalTrackNameInput,
            reqModalTrackLengthInput,
            reqModalTrackImageInput
          )

          await interaction.showModal(modalTrackCreation)
        }

        case "deleteTrack": {
          await deleteTrackByIdQuery(trackId)

          const trackSuppressed = new EmbedBuilder()
            .setColor(Config.colors.success)
            .setDescription(
              `### ${emoteComposer(
                Config.emotes.success
              )} Le circuit a était supprimé avec succès !`
            )

          return interaction.reply({
            embeds: [trackSuppressed],
            ephemeral: true,
          })
        }

        default:
          return
      }
    } catch (error) {
      await errorHandler(interaction, error)
    }
  },
}
