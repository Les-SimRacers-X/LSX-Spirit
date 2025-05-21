const { EmbedBuilder } = require("discord.js")
const {
  fetchUserProfilByIdQuery,
} = require("../../utils/sql/data-users/queries")
const { getDiscordUserInfos } = require("../../utils/js/discordUtils")
const { insertUserQuery } = require("../../utils/sql/data-users/mutations")
const { licenceEvolutionComponent } = require("./licenceEvolution")
const { licenceDisplay } = require("./licenceDisplay")
const { Config } = require("../../utils/config")
const { emoteComposer } = require("../../utils/js/utils")

async function licenceDisplayComponents(userId) {
  const users = await fetchUserProfilByIdQuery(userId)
  const user = getDiscordUserInfos(userId)
  let intialEmbed

  if (!users.length) {
    intialEmbed = new EmbedBuilder()
      .setColor(Config.colors.success)
      .setDescription(
        `### ${emoteComposer(
          Config.emotes.success
        )} Votre licence a bien été créée ! Veuillez cliquer de nouveau sur l'option **\`Licence LSX\`**.`
      )

    const userData = {
      id: user.id,
      username: user.username,
      team_id: "",
      accounts_config: "{}",
      licence_points: 12,
      wins: 0,
      podiums: 0,
      total_races: 0,
      last_sanction_id: "",
    }

    await insertUserQuery(userData)
    return {
      embeds: [intialEmbed],
      components: [],
    }
  }

  if (users.gameConfig === "{}") {
    const { embedEvolution, interactionEvolution } = licenceEvolutionComponent(
      1,
      userId
    )
    return {
      embeds: [embedEvolution],
      components: [interactionEvolution],
    }
  }

  const { displayProfil, interactionOnProfil } = licenceDisplay(userId)

  return {
    embeds: [displayProfil],
    components: [interactionOnProfil],
  }
}

module.exports = {
  licenceDisplayComponents,
}
