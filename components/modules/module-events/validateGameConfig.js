const { Config } = require('../../../context/config');

async function validateGameConfiguration(interaction, userGamesConfig) {
  const channelId = interaction.channelId;
  const parentId = interaction.channel?.parentId;

  const gameKey = Object.keys(Config.gameSpecificConfigs).find((key) => {
    const config = Config.gameSpecificConfigs[key];
    return parentId === config.category && config.channels.includes(channelId);
  });

  if (!gameKey) {
    return { isValid: false, message: null };
  }

  const gameConfig = Config.gameSpecificConfigs[gameKey];
  const message = `Configuration ${gameConfig.name} obligatoire pour participer à cet événement !`;

  try {
    const userGameConfig = JSON.parse(userGamesConfig || '{}');
    const gameData = userGameConfig[gameKey];

    if (!gameData) {
      return { isValid: true, message };
    }

    const hasMissingFields = gameConfig.requiredFields.some(
      (field) =>
        !gameData[field] || gameData[field] === null || gameData[field] === ''
    );

    if (hasMissingFields) {
      return { isValid: true, message };
    }
  } catch (error) {
    console.error(error);
    return { isValid: true, message };
  }

  return { isValid: false, message: null };
}

module.exports = { validateGameConfiguration };
