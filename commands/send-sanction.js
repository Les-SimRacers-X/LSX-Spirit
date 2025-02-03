const Discord = require("discord.js")
const Config = require("../config.json")

module.exports = {
  name: "Envoyer sanction",
  type: "USER",

  async run(bot, interaction) {
    if (!interaction.member.roles.cache.has("1321919765140344895")) {
      const embedNoPermissions = new Discord.EmbedBuilder()
        .setColor(Config.colors.crossColor)
        .setDescription(
          `${Config.emojis.crossEmoji} **Vous n'avez pas les permissions nécessaire pour utiliser cette command !**`
        )

      return interaction.reply({
        embeds: [embedNoPermissions],
        ephemeral: true,
      })
    } else {
      const user = interaction.targetUser
      // Modal d'envoi de sanction
      const modalSendingSanction = new Discord.ModalBuilder()
        .setCustomId(`sendSanction_${user.id}`)
        .setTitle("Envoi de sanction")

      const modalMessageInput = new Discord.TextInputBuilder()
        .setCustomId(`messageContent`)
        .setLabel("Ajouter la sanction de l'utilisateur")
        .setPlaceholder("Exemple : 5 secondes de pénalités...")
        .setRequired(true)
        .setStyle(Discord.TextInputStyle.Paragraph)

      const modalMessageActionRow =
        new Discord.ActionRowBuilder().addComponents(modalMessageInput)

      modalSendingSanction.addComponents(modalMessageActionRow)

      await interaction.showModal(modalSendingSanction)
    }
  },
}
