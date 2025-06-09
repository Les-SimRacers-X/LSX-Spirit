const {
  editGameConfig,
} = require('../../modules/module-licence/editGameConfig');
const {
  usernameAndNumberComponent,
} = require('../../modules/module-licence/usernameAndNumberComponent');

module.exports = {
  customId: ['retryNumber', 'retryEditNumber'],
  async execute(interaction) {
    const [action, userId, selectedGame, step, defaultValues] =
      interaction.customId.split('_');

    if (action === 'retryNumber') {
      const inputModal = await usernameAndNumberComponent(
        step,
        userId,
        selectedGame,
        defaultValues
      );
      return interaction.showModal(inputModal);
    } else if (action === 'retryEditNumber') {
      const inputModal = await editGameConfig(
        userId,
        selectedGame,
        defaultValues
      );

      return interaction.showModal(inputModal);
    }
  },
};
