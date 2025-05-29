const { EmbedBuilder } = require("discord.js")
const {
  fetchUserProfilByIdQuery,
} = require("../../../context/data/data-users/queries")
const { getDiscordUserInfos } = require("../../../context/utils/discordUtils")
const {
  insertUserQuery,
} = require("../../../context/data/data-users/mutations")
const { licenceEvolutionComponent } = require("./licenceEvolution")
const { licenceDisplay } = require("./licenceDisplay")
const { Config } = require("../../../context/config")
const { emoteComposer } = require("../../../context/utils/utils")

async function licenceDisplayComponents(userId) {
  const [users] = await fetchUserProfilByIdQuery(userId)
  const user = await getDiscordUserInfos(userId)

  if (!users) {
    const intialEmbed = new EmbedBuilder()
      .setColor(Config.colors.success)
      .setDescription(
        `### ${emoteComposer(
          Config.emotes.success
        )} Votre licence a bien été créée ! Veuillez cliquer de nouveau sur l'option **\`Licence LSX\`**.`
      )

    const userData = {
      id: user.id,
      username: user.globalName,
      team_id: "",
      accounts_config: "{}",
      licence_points: 12,
      wins: 0,
      podiums: 0,
      total_races: 0,
      sanction_id: "",
    }

    await insertUserQuery(userData)
    return {
      embeds: [intialEmbed],
      components: [],
    }
  }

  if (users.gameConfig === "{}") {
    const { embeds, components } = await licenceEvolutionComponent(1, userId)

    return {
      embeds: embeds,
      components: components,
    }
  }

  const { embeds, components } = await licenceDisplay(userId)

  return {
    embeds,
    components,
  }
}

module.exports = {
  licenceDisplayComponents,
}
