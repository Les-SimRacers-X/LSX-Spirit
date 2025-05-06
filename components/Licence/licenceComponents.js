const { EmbedBuilder } = require("discord.js")
const { fetchUserByIdQuery } = require("../../utils/sql/users/queries")
const { Config } = require("../../config")
const { emoteComposer } = require("../../utils/js/errorHandling")
const { getDiscordUserInfos } = require("../../utils/js/discordUtils")
const { insertUserQuery } = require("../../utils/sql/users/mutations")
const { licenceEvolutionComponent } = require("./licenceEvolution")

async function licenceDisplayComponents(userId) {
  const users = await fetchUserByIdQuery(userId)
  const user = getDiscordUserInfos(userId)
  let intialEmbed

  if (!users.length) {
    intialEmbed = new EmbedBuilder()
      .setColor(Config.colors.success)
      .setDescription(
        `### ${emoteComposer(
          Config.emotes.success.id,
          Config.emotes.success.name
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

  if (users.accounts_config === "{}") {
    const { embedEvolution, interactionEvolution } = licenceEvolutionComponent(
      1,
      userId
    )
    return {
      embeds: [embedEvolution],
      components: [interactionEvolution],
    }
  }
}

module.exports = {
  licenceDisplayComponents,
}
