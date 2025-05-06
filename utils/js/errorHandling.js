const { EmbedBuilder } = require("discord.js")
const { Config } = require("../config")

async function errorHandler(interaction, error) {
  const embedErrorDetectionLog = new EmbedBuilder()
    .setColor(Config.colors.mainServerColor)
    .setTitle("📌 Error Détecté :")
    .setDescription(`\`\`\`${error}\`\`\``)
    .setTimestamp()

  const embedErrorDetected = new EmbedBuilder()
    .setColor(Config.colors.error)
    .setDescription(
      `${emoteComposer(
        Config.emotes.error.id,
        Config.emotes.error.name
      )} **Une erreur a été détecté lors de votre interaction !**`
    )

  console.error(error)
  await bot.channels.cache
    .get(Config.channels.errorLogs)
    .send({ embeds: [embedErrorDetectionLog] })
  return await interaction.reply({
    embeds: [embedErrorDetected],
    components: [],
    ephemeral: true,
  })
}

async function emoteComposer(id, name) {
  return `<:${name}:${id}>`
}

module.exports = { errorHandler, emoteComposer }
