const { EmbedBuilder } = require('discord.js');
const {
  fetchUserProfilByIdQuery,
} = require('../../../context/data/data-users/queries');
const { getDiscordUserInfos } = require('../../../context/utils/discordUtils');
const {
  insertUserQuery,
} = require('../../../context/data/data-users/mutations');
const { licenceEvolutionComponent } = require('./licenceEvolution');
const { licenceDisplay } = require('./licenceDisplay');

async function licenceDisplayComponents(userId) {
  const [users] = await fetchUserProfilByIdQuery(userId);
  const user = await getDiscordUserInfos(userId);

  if (!users) {
    const userData = {
      id: user.id,
      username: user.globalName,
      team_id: 'None',
      accounts_config: '{}',
      licence_points: 12,
      wins: 0,
      podiums: 0,
      total_races: 0,
      sanction_id: '',
    };

    await insertUserQuery(userData);

    const { embeds, components } = await licenceEvolutionComponent(1, userId);
    return {
      embeds,
      components,
    };
  }

  if (users.gameConfig === '{}') {
    const { embeds, components } = await licenceEvolutionComponent(1, userId);

    return {
      embeds,
      components,
    };
  }

  const { embeds, components } = await licenceDisplay(userId);

  return {
    embeds,
    components,
  };
}

module.exports = {
  licenceDisplayComponents,
};
