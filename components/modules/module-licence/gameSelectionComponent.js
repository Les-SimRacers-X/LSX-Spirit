const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { Config } = require('../../../context/config');
const {
  fetchUserProfilByIdQuery,
} = require('../../../context/data/data-users/queries');

async function gameSelectionComponent(currentStep, userId) {
  const [userProfil] = await fetchUserProfilByIdQuery(userId);
  const gameConfigObject = JSON.parse(userProfil?.gameConfig) || {};

  const filteredGames = Config.games.filter((game) => {
    return !gameConfigObject.hasOwnProperty(game.value);
  });

  const options = filteredGames.map((game) => ({
    emoji: { id: game.emote.id, name: game.emote.name },
    label: game.name,
    value: game.value,
  }));

  if (options.length === 0) {
    return null;
  }

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`selectGameConfig_${currentStep}_${userId}`)
      .setPlaceholder('📌 Sélectionner une option...')
      .addOptions(options)
  );
}

module.exports = { gameSelectionComponent };
