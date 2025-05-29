const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js")
const {
  getAllEventsQueryQuery,
} = require("../../context/data/data-events/queries")
const { Config } = require("../../context/config")
const { emoteComposer } = require("../../context/utils/utils")

async function eventGestionDisplay(currentIndex) {
  const event = await getAllEventsQueryQuery()
  const currentEvent = event[currentIndex]

  if (!currentEvent) {
    const noEvents = new EmbedBuilder()
      .setColor(Config.colors.error)
      .setDescription(
        `### ${emoteComposer(
          Config.emotes.failure
        )} Aucun événement n'a encore été créer !`
      )

    const selectEventManagment = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`eventManagment`)
        .setPlaceholder("📌 Séléctionner une option...")
        .addOptions({
          emoji: "➕",
          label: "Ajouter un événement",
          value: "addEvent",
        })
    )

    return {
      embeds: [noEvents],
      components: [selectEventManagment],
    }
  }

  let statusEmote,
    statusLabel,
    checkStatus,
    checkChannelToSend,
    checkLicenceObligation,
    checkPreviousEventIndex,
    checkNextEventIndex
  let checkCurrentEventIndex = currentIndex + 1

  checkPreviousEventIndex =
    currentIndex === 0 && checkCurrentEventIndex === event.length
      ? true
      : currentIndex === 0
      ? true
      : false
  checkNextEventIndex =
    currentIndex === 0 && checkCurrentEventIndex === event.length
      ? true
      : checkCurrentEventIndex === event.length
      ? true
      : false

  checkChannelToSend = currentEvent.channelId !== "" ? false : true
  checkLicenceObligation =
    currentEvent.presetLicence === "true"
      ? "Licence obligatoire"
      : "Licence non obligatoire"

  switch (currentEvent.status) {
    case "true":
      checkStatus = `🟢 Inscription ouverte`
      statusEmote = `🔒`
      statusLabel = `Fermer l'inscription`
      break

    case "false":
      checkStatus = `🔴 Inscription fermé`
      statusEmote = `🔓`
      statusLabel = `Ouvrir l'inscription`
      break
  }

  const participations = JSON.parse(currentEvent.registered)
  const [flag, country] = currentEvent.trackNationality.split("-")

  const eventInformation = new EmbedBuilder()
    .setColor(Config.colors.default)
    .setDescription(
      `## 📆 Informations de l'événement ${currentEvent.id}\n- ⏰ Data & Heure : <t:${currentEvent.timestamp}:D> (**<t:${currentEvent.timestamp}:R>**)\n- ${flag} Circuit : ${currentEvent.trackName}, ${country}\n- ⚙️ Preset : **${currentEvent.presetName}** (${checkLicenceObligation})\n- 📊 Nombre de participant : **${participations.length}**\n- 🔑 Status : ${checkStatus}`
    )
    .setImage(Config.PNG)
    .setFooter({
      text: `Événement : ${checkCurrentEventIndex} sur ${event.length}`,
    })

  const selectEventManagment = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`eventManagment_${currentEvent.id}`)
      .setPlaceholder("📌 Séléctionner une option...")
      .addOptions(
        {
          emoji: "➕",
          label: "Ajouter un événement",
          value: "addEvent",
        },
        {
          emoji: statusEmote,
          label: `${statusLabel}`,
          value: "changeStatus",
        },
        {
          emoji: "🗑️",
          label: "Supprimer l'événement",
          description: "‼️ Attention, aucune confirmation n'est demandée",
          value: "deleteEvent",
        }
      )
  )

  const buttonEventManagment = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`previousEvent_${currentIndex}`)
        .setEmoji(Config.emotes.previousArrow)
        .setDisabled(checkPreviousEventIndex)
        .setStyle(ButtonStyle.Secondary)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`nextEvent_${currentIndex}`)
        .setEmoji(Config.emotes.nextArrow)
        .setDisabled(checkNextEventIndex)
        .setStyle(ButtonStyle.Secondary)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`sendEvent_${currentEvent.id}`)
        .setEmoji({ name: "📨" })
        .setLabel("Envoyer l'embed")
        .setDisabled(checkChannelToSend)
        .setStyle(ButtonStyle.Primary)
    )

  return {
    embeds: [eventInformation],
    components: [selectEventManagment, buttonEventManagment],
  }
}

module.exports = {
  eventGestionDisplay,
}
