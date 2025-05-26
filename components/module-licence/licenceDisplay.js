const { EmbedBuilder } = require("discord.js")
const { getDiscordUserInfos } = require("../../utils/js/discordUtils")
const { calculatePercentage } = require("../../utils/js/utils")
const {
  fetchUserProfilByIdQuery,
} = require("../../utils/sql/data-users/queries")
const { Config } = require("../../utils/config")
const { interactionOnProfil } = require("./interactionOnProfil")

async function licenceDisplay(userId) {
  const [userInfos] = await fetchUserProfilByIdQuery(userId)
  const discordUser = getDiscordUserInfos(userId)

  const gameConfigObject = JSON.parse(userInfos.gameConfig)

  let userHasTeam =
    userInfos.teamId !== "None" || ""
      ? `👥 **Équipe :** <@&${userInfos.teamRoleId}>`
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

  const options = Config.games
    .filter((game) =>
      Object.prototype.hasOwnProperty.call(gameConfigObject, game.value)
    )
    .map((game) => {
      const data = userInfos.gameConfig[game.value]
      return {
        emoji: game.emote,
        label: game.name,
        description: `[${data.trigram}] - ${data.name}`,
        value: game.value,
      }
    })

  options.unshift({
    emoji: { name: "➕" },
    label: "Ajouter un jeu",
    description: "Ceci vous permettra d'ajouter une configuration pour un jeu.",
    value: "add",
  })

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

  const interactions = interactionOnProfil(userId, options)

  return {
    driverProfil,
    interactions,
  }
}

module.exports = { licenceDisplay }
