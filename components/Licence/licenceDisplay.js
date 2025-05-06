const { EmbedBuilder } = require("discord.js")
const { getDiscordUserInfos } = require("../../utils/js/discordUtils")
const { calculatePercentage } = require("../../utils/js/utils")
const { fetchUserProfilByIdQuery } = require("../../utils/sql/users/queries")
const { Config } = require("../../utils/config")

async function licenceDisplay(userId) {
  const userInfos = await fetchUserProfilByIdQuery(userId)
  const discordUser = getDiscordUserInfos(userId)

  let userHasTeam =
    userInfos.teamId !== "None" || ""
      ? `👥 **Équipe :** <@${userInfos.teamRoleId}>`
      : `👥 **Équipe :** Aucune équipe associée`

  let checkLicence =
    userInfos.licencePoints < 5
      ? `\`${userInfos.licencePoints}\` (Risque de perdre votre licence)`
      : `\`${userInfos.licencePoints}\``

  const percentageWins = calculatePercentage(
    userInfos.nbWins,
    userInfos.nbRaces
  )
  const percentagePodiums = calculatePercentage(
    userInfos.nbPodiums,
    userInfos.nbRaces
  )

  const driverProfil = new EmbedBuilder()
    .setColor(Config.colors.default)
    .setThumbnail(discordUser.avatarURL)
    .setDescription(
      `## 👤 Informations de ${
        discordUser.globalName || discordUser.username
      }\n- ${userHasTeam}\n- **💳 Points de licence :** ${checkLicence}\n- **⛔ Sanctions :** \`${
        userInfos.nbSanctions
      }\`\n- **🏆 Victoires :** \`${
        userInfos.nbWins
      }\` (${percentageWins})\n- **🏅 Podiums :** \`${
        userInfos.nbPodiums
      }\` (${percentagePodiums})\n- **🚦 Total de courses :** ${
        userInfos.nbRaces
      }`
    )
    .setImage(Config.PNG)

  return {
    driverProfil,
  }
}

module.exports = { licenceDisplay }
