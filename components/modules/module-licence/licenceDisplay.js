const { EmbedBuilder } = require("discord.js")
const { getDiscordUserInfos } = require("../../context/utils/discordUtils")
const { calculatePercentage } = require("../../context/utils/utils")
const {
  fetchUserProfilByIdQuery,
} = require("../../context/data/data-users/queries")
const { Config } = require("../../context/config")
const { interactionOnProfil } = require("./interactionOnProfil")

async function licenceDisplay(userId) {
  const [userInfos] = await fetchUserProfilByIdQuery(userId)
  const discordUser = await getDiscordUserInfos(userId)

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
      const data = gameConfigObject[game.value]
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

  const interactions = await interactionOnProfil(userId, options)

  return {
    embeds: [driverProfil],
    components: [interactions],
  }
}

module.exports = { licenceDisplay }
