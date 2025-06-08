const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const {
  fetchUserAccountConfigByIdQuery,
} = require('../../../context/data/data-users/queries');
const { Config } = require('../../../context/config');

async function editGameConfig(userId, selectedGame, defaultValues = {}) {
  const [user] = await fetchUserAccountConfigByIdQuery(userId);
  const gameConfigObject = JSON.parse(user.gameConfig);
  const platformDetails = Config.platforms.find(
    (platform) => platform.value === gameConfigObject[selectedGame].platform
  );

  const modal = new ModalBuilder()
    .setCustomId(`editGameConfigModal_${userId}_${selectedGame}`)
    .setTitle('Formulaire de modification de config');

  const usernameInput = new TextInputBuilder()
    .setCustomId(`usernameInput`)
    .setLabel(`Quel est votre pseudo ${platformDetails.name}`)
    .setPlaceholder('Exemple : toto')
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setValue(gameConfigObject[selectedGame].name || '');

  const trigramInput = new TextInputBuilder()
    .setCustomId(`trigramInput`)
    .setLabel(`Quel est votre trigramme ?`)
    .setPlaceholder('Exemple : LSX')
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setValue(gameConfigObject[selectedGame].trigram || '');

  const numberInput = new TextInputBuilder()
    .setCustomId(`numberInput`)
    .setLabel(`${defaultValues.error || 'Entrez un numéro disponible'}`)
    .setPlaceholder('Exemple : 493')
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setValue(
      `${defaultValues.suggestionNumber || gameConfigObject[selectedGame].number || ''}`
    );

  const firstActionRow = new ActionRowBuilder().addComponents(usernameInput);
  const secondActionRow = new ActionRowBuilder().addComponents(trigramInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(numberInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

  return modal;
}

module.exports = {
  editGameConfig,
};
