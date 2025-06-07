const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require('discord.js');
const {
  fetchUserProfilByIdQuery,
} = require('../../../context/data/data-users/queries');
const { Config } = require('../../../context/config');

async function licenceEvolutionComponent(currentStep, userId, gameSelected) {
  const [users] = await fetchUserProfilByIdQuery(userId);

  const configObject = JSON.stringify(users.gameConfig);
  const embedEvolution = new EmbedBuilder().setColor(Config.colors.default)
    .setDescription(`### ⚙️ Votre configuration\n
      \`\`\`json
      ${configObject}
      \`\`\``);

  const interactionEvolution = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`menuLicenceSteps_${currentStep}_${gameSelected}_${userId}`)
      .setPlaceholder('📌 Sélectionner une option...')
      .addOptions(
        {
          emoji: { name: '🎮' },
          label: 'Jeux',
          description: 'Ajouter votre jeu !',
          value: '1',
        },
        {
          emoji: { name: '🧰' },
          label: 'Platformes',
          description: 'Sélectionnez une platforme !',
          value: '2',
        },
        {
          emoji: { name: '🏷️' },
          label: 'Pseudo et numéro',
          description:
            'Entrez votre pseudo et le numéro que vous avez choisi !',
          value: '3',
        }
      )
  );

  return {
    embeds: [embedEvolution],
    components: [interactionEvolution],
  };
}

module.exports = {
  licenceEvolutionComponent,
};
