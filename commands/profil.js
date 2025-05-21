const Discord = require("discord.js")
const { Config } = require("../utils/config")

module.exports = {
  name: "profil",
  type: "APPLICATION",

  async run(bot, interaction) {
    let db = bot.db

    const userTarget = interaction.targetUser

    try {
      const [users] = await db
        .promise()
        .query(`SELECT * FROM users WHERE userID = ?`, [userTarget.id])
      const driverProfil = users[0]
      const [sanctions] = await db
        .promise()
        .query(`SELECT * FROM sanctions WHERE targetID = ?`, [userTarget.id])

      if (users.length === 0) {
        const noProfilFound = new Discord.EmbedBuilder()
          .setColor(Config.colors.crossColor)
          .setDescription(
            `${Config.emojis.crossEmoji} **Vous n'êtes pas inscrit à l'entrylist !**`
          )

        return interaction.reply({
          embeds: [noProfilFound],
          ephemeral: true,
        })
      }

      let checkIfUserHasTeam =
        driverProfil.teamID !== "None"
          ? await db
              .promise()
              .query(`SELECT * FROM teamsprofil WHERE teamID = ?`, [
                driverProfil.teamID,
              ])
          : null

      let teamInfo =
        checkIfUserHasTeam && checkIfUserHasTeam[0]
          ? `👥 **Équipe :** <@${checkIfUserHasTeam[0].teamRole}>`
          : `👥 **Équipe :** Aucune équipe associée`

      const user = await bot.users.fetch(driverProfil.userID)

      let checkPlatformPseudo =
        driverProfil.platformConsole === "Xbox" ? `Gamertag` : `PSN`

      let checkLicence =
        driverProfil.licencePoints < 5
          ? `\`${driverProfil.licencePoints}\` (:warning: Risque de perdre votre licence)`
          : `\`${driverProfil.licencePoints}\``

      const pourcentageWins = (
        (driverProfil.wins / driverProfil.totalRaces) *
        100
      ).toFixed(2)
      const pourcentagePodiums = (
        (driverProfil.podiums / driverProfil.totalRaces) *
        100
      ).toFixed(2)

      let checkPourcentageWins =
        pourcentageWins === "NaN" ? `0%` : `${pourcentageWins}%`
      let checkPourcentagePodiums =
        pourcentagePodiums === "NaN" ? `0%` : `${pourcentagePodiums}%`

      const embedDisplayDriverProfil = new Discord.EmbedBuilder()
        .setColor(driverProfil.embedColor || Config.colors.mainServerColor)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `### 👤 Informations ${
            user.globalName || user.username
          }\n\n- **${checkPlatformPseudo} :** ${
            driverProfil.inGameUsername
          } (***${
            driverProfil.inGameNumber
          }***)\n- ${teamInfo}\n\n- **💳 Licence points :** \`${checkLicence}\`\n- **⛔ Sanctions :** \`${
            sanctions.length
          }\`\n- **🚦 Total courses :** \`${
            driverProfil.totalRaces
          }\`\n- **🏆 Victoires :** \`${
            driverProfil.wins
          }\` (${checkPourcentageWins})\n- **🏅 Podiums :** \`${
            driverProfil.podiums
          }\` (${checkPourcentagePodiums})`
        )
        .setImage(Config.PNG)

      await interaction.reply({
        embeds: [embedDisplayDriverProfil],
        ephemeral: true,
      })
    } catch (error) {
      console.error("Erreur lors de l'affichage d'un profil :", error)
    }
  },
}
