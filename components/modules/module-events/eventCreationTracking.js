const { Config } = require("../../../context/config")
const { emoteComposer } = require("../../../context/utils/utils")
const {
  getEventByIdQuery,
} = require("../../../context/data/data-events/queries")
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js")

async function eventCreationTracking(id) {
  const [event] = await getEventByIdQuery(id)
  const keysToCheck = [
    "trackId",
    "presetId",
    "description",
    "timestamp",
    "channelId",
  ]
  const fields = keysToCheck.map((key) => ({
    name: key,
    value:
      event[key] !== null &&
      event[key] !== undefined &&
      event[key] !== "" &&
      event[key] !== "None"
        ? `\`${event[key]}\``
        : "🚫 Vide",
    inline: true,
  }))

  const allFieldsFilled = fields.every((field) => field.value !== "🚫 Vide")

  const answerIfUserFilledRows =
    allFieldsFilled === true
      ? `\n### ${emoteComposer(
          Config.emotes.success
        )} Votre événement est prêt !`
      : ""

  const eventEvolution = new EmbedBuilder()
    .setColor(Config.colors.default)
    .setDescription(
      `## ✨ Création d'un événement\n- En dessous vous allez retrouver un suivi sur la création de l'événement ! Qu'est-ce qui a été rempli et laissé vide ?${answerIfUserFilledRows}`
    )
    .addFields(fields)
    .setImage(Config.PNG)

  const selectEventEvolution = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`eventCreationSteps_${id}`)
      .setPlaceholder("📌 Séléctionner une option...")
      .setDisabled(allFieldsFilled)
      .addOptions(
        {
          emoji: { name: "📑" },
          label: "Description, Date & Heure",
          description: "Entrez la description et les horaires de l'événement",
          value: "1",
        },
        {
          emoji: { name: "🏁" },
          label: "Circuits",
          description: "Sélectionnez un circuit pour l'événement",
          value: "2",
        },
        {
          emoji: { name: "⚙️" },
          label: "Presets",
          description: "Sélectionnez un preset (paramètres) pour l'événement",
          value: "3",
        },
        {
          emoji: { name: "💬" },
          label: "Salons",
          description: "Sélectionnez un salon ou envoyez l'événement",
          value: "4",
        }
      )
  )

  return {
    embeds: [eventEvolution],
    components: [selectEventEvolution],
  }
}

module.exports = {
  eventCreationTracking,
}
