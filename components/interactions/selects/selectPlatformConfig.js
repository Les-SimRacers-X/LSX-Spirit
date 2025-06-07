const {
  licenceEvolutionComponent,
} = require('../../modules/module-licence/licenceEvolution');
const { errorHandler } = require('../../../context/utils/errorHandling');
const {
  updateUserQuery,
} = require('../../../context/data/data-users/mutations');
const {
  fetchUserProfilByIdQuery,
} = require('../../../context/data/data-users/queries');

module.exports = {
  customId: 'selectPlatformConfig',
  async execute(interaction) {
    const [action, step, gameSelected, userId] =
      interaction.customId.split('_');
    const selectedAction = interaction.values[0];
    const currentStep = parseInt(step) + 1;

    const [userConfig] = await fetchUserProfilByIdQuery(userId);

    const accountConfig = JSON.parse(userConfig.gameConfig);

    if (accountConfig[gameSelected]) {
      accountConfig[gameSelected].platform = selectedAction;
    }

    const userData = {
      accounts_config: JSON.stringify(accountConfig),
    };

    await updateUserQuery(userId, userData);

    const { embeds, components } = await licenceEvolutionComponent(
      currentStep,
      userId,
      gameSelected
    );

    return interaction.update({
      embeds,
      components,
      ephemeral: true,
    });
  },
};
