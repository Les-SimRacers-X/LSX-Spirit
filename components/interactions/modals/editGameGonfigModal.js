const { Config } = require('../../../context/config');
const {
  updateUserQuery,
} = require('../../../context/data/data-users/mutations');
const {
  fetchNumberInAccountConfig,
  fetchUserAccountConfigByIdQuery,
} = require('../../../context/data/data-users/queries');
const {
  editGameConfig,
} = require('../../modules/module-licence/editGameConfig');

module.exports = {
  customId: 'editGameConfigModal',
  async execute(interaction) {
    const [action, userId, selectedGame] = interaction.customId.split('_');
    const reqPseudoContent =
      interaction.fields.getTextInputValue('usernameInput');
    const reqTrigramContent =
      interaction.fields.getTextInputValue('trigramInput');
    const reqNumberContent = parseInt(
      interaction.fields.getTextInputValue('numberInput')
    );

    const usedNumbers = await fetchNumberInAccountConfig(selectedGame);
    let defaultValues = {};

    if (usedNumbers.includes(reqNumberContent)) {
      let availableNumber = null;

      for (let offset = 1; offset <= 999; offset++) {
        const upper = reqNumberContent + offset;
        const lower = reqNumberContent - offset;

        if (upper <= 999 && !usedNumbers.includes(upper)) {
          availableNumber = upper;
          break;
        }

        if (lower >= 1 && !usedNumbers.includes(lower)) {
          availableNumber = lower;
          break;
        }

        if (availableNumber) {
          defaultValues = {
            error: `Le numéro ${reqNumberContent} n'est pas disponible. Suggestion ${availableNumber}`,
            suggestionNumber: availableNumber,
          };
        } else {
          defaultValues = {
            error: `Aucun numéro disponible entre 1 et 999`,
          };
        }
      }

      const inputModal = await editGameConfig(
        userId,
        selectedGame,
        defaultValues
      );
      return interaction.showModal(inputModal);
    }

    const [userConfig] = await fetchUserAccountConfigByIdQuery(userId);
    let accountConfig = {};

    const buildTrigram = reqPseudoContent.match(/[a-zA-Z]/g) || [];
    while (buildTrigram.length < 3) {
      buildTrigram.push(String.fromCharCode(65 + Math.random() * 26));
    }

    const trigram =
      reqTrigramContent === ''
        ? buildTrigram.slice(0, 3).join('').toUpperCase()
        : reqTrigramContent;

    accountConfig = JSON.parse(userConfig?.gameConfig);
    if (accountConfig[selectedGame]) {
      accountConfig[selectedGame].name = reqPseudoContent;
      accountConfig[selectedGame].trigram = trigram;
      accountConfig[selectedGame].number = reqNumberContent;
    }

    const data = {
      accounts_config: JSON.stringify(accountConfig),
    };

    await updateUserQuery(userId, data);

    const answerUser = new EmbedBuilder()
      .setColor(Config.colors.success)
      .setDescription(
        `### ${emoteComposer(
          Config.emotes.success
        )} Votre licence a été correctement modifiée ! Veuillez cliquer de nouveau sur \`Licence LSX\` pour consulter votre licence.`
      );

    return interaction.reply({
      embeds: [answerUser],
      ephemeral: true,
    });
  },
};
