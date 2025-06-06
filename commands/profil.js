const {
  licenceDisplay,
} = require('../components/modules/module-licence/licenceDisplay');
const { errorHandler } = require('../context/utils/errorHandling');

module.exports = {
  name: 'profil',
  type: 'APPLICATION',

  async run(bot, interaction) {
    try {
      const userTarget = interaction.targetUser;

      const { embeds, components } = await licenceDisplay(userTarget.id);

      await interaction.reply({
        embeds,
        ephemeral: true,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};
