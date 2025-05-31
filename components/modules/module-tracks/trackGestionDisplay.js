const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js")
const {
  fetchTracksQuery,
} = require("../../../context/data/data-tracks/queries")
const { Config } = require("../../../context/config")
const { emoteComposer } = require("../../../context/utils/utils")

async function trackGestionDisplay(currentIndex) {
  const track = await fetchTracksQuery()
  const currentTrack = track[currentIndex]

  if (!currentTrack) {
    const noTracks = new EmbedBuilder()
      .setColor(Config.colors.error)
      .setDescription(
        `### ${emoteComposer(
          Config.emotes.failure
        )} Aucun circuit n'a encore été créer !`
      )

    const selectTrackManagment = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`trackManagment`)
        .setPlaceholder("📌 Séléctionner une option...")
        .addOptions({
          emoji: "➕",
          label: "Ajouter un circuit",
          value: "addTrack",
        })
    )

    return {
      embeds: [noTracks],
      components: [selectTrackManagment],
    }
  }

  let checkPreviousTrackIndex, checkNextTrackIndex
  let checkCurrentTrackIndex = currentIndex + 1
  const [flag, country] = currentTrack.nationality.split("-")

  checkPreviousTrackIndex =
    currentIndex === 0 && checkCurrentTrackIndex === track.length
      ? true
      : currentIndex === 0
      ? true
      : false
  checkNextTrackIndex =
    currentIndex === 0 && checkCurrentTrackIndex === track.length
      ? true
      : checkCurrentTrackIndex === track.length
      ? true
      : false

  const trackInformation = new EmbedBuilder()
    .setColor(Config.colors.default)
    .setDescription(
      `## 🏁 Informations du circuit ${currentTrack.id}\n- 📋 Nom du circuit : ${currentTrack.name}\n- ${flag} Pays : ${country}\n- 📏 Longueur : ${currentTrack.duration}`
    )
    .setImage(currentTrack.image)
    .setFooter({
      text: `Circuit : ${checkCurrentTrackIndex} sur ${track.length}`,
    })

  const selectTrackManagment = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`trackManagment_${currentTrack.id}`)
      .setPlaceholder("📌 Séléctionner une option...")
      .addOptions(
        {
          emoji: "➕",
          label: "Ajouter un circuit",
          value: "addTrack",
        },
        {
          emoji: "🗑️",
          label: "Supprimer le circuit",
          value: "deleteTrack",
        }
      )
  )

  const buttonTrackManagment = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`previousTrack_${currentIndex}`)
        .setEmoji(Config.emotes.previousArrow)
        .setDisabled(checkPreviousTrackIndex)
        .setStyle(ButtonStyle.Secondary)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`nextTrack_${currentIndex}`)
        .setEmoji(Config.emotes.nextArrow)
        .setDisabled(checkNextTrackIndex)
        .setStyle(ButtonStyle.Secondary)
    )

  return {
    embeds: [trackInformation],
    components: [selectTrackManagment, buttonTrackManagment],
  }
}

module.exports = {
  trackGestionDisplay,
}
