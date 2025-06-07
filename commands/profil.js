const {
  licenceDisplay,
} = require('../components/modules/module-licence/licenceDisplay');
const { errorHandler } = require('../context/utils/errorHandling');

module.exports = {
  name: 'profil',
  description:
    'Cette commande vous permez de visualiser les licences des autres utilisateurs.',
  dm: false,
  utilisation: '<user>',
  permission: 'Aucune',
  options: [
    {
      type: 'user',
      name: 'user',
      description: 'Sélectionner un utilisateur',
      required: false,
    },
  ],

  async run(bot, interaction) {
    try {
      const targetUser = interaction.options.getUser('user');

      let selectedUser = !targetUser ? interaction.user.id : targetUser.id;

      const { embeds, components } = await licenceDisplay(selectedUser);

      await interaction.reply({
        embeds,
        ephemeral: true,
      });
    } catch (error) {
      await errorHandler(interaction, error);
    }
  },
};
