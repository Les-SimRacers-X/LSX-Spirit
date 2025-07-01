const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { Config } = require('../../../context/config');
const {
  updateUserQuery,
} = require('../../../context/data/data-users/mutations');
const {
  fetchNumberInAccountConfig,
  fetchUserAccountConfigByIdQuery,
} = require('../../../context/data/data-users/queries');

const { emoteComposer } = require('../../../context/utils/utils');

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

    let currentUsedNumber = null;

    const [userConfig] = await fetchUserAccountConfigByIdQuery(userId);
    let accountConfig = {};

    if (userConfig?.gameConfig) {
      accountConfig = JSON.parse(userConfig.gameConfig);
      if (accountConfig[selectedGame]) {
        currentUsedNumber = accountConfig[selectedGame].number;
      }
    }

    let usedNumbers = await fetchNumberInAccountConfig(selectedGame);

    if (
      currentUsedNumber !== null &&
      reqNumberContent === currentUsedNumber &&
      usedNumbers.includes(reqNumberContent)
    ) {
      usedNumbers = usedNumbers.filter((num) => num !== reqNumberContent);
    }

    if (reqNumberContent < 1 || reqNumberContent > 999) {
      const defaultValues = {
        error: `Le numéro doit être compris entre 1 et 999`,
        name: reqPseudoContent,
      };

      const alreadyTakenNumber = new EmbedBuilder()
        .setColor(Config.colors.error)
        .setDescription(
          `### ${emoteComposer(Config.emotes.failure)} Le numéro doit être compris entre 1 et 999`
        );
      const buttonAlreadyTakenNumber = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`retryEditNumber_${userId}_${selectedGame}`)
          .setLabel('Réessayé')
          .setDisabled(false)
          .setStyle(ButtonStyle.Primary)
      );

      return await interaction.reply({
        embeds: [alreadyTakenNumber],
        components: [buttonAlreadyTakenNumber],
        ephemeral: true,
      });
    }

    if (usedNumbers.includes(reqNumberContent)) {
      let availableNumber = null;
      let suggestionFound = false;

      for (let offset = 1; offset <= 999; offset++) {
        const upper = reqNumberContent + offset;
        const lower = reqNumberContent - offset;

        if (upper <= 999 && !usedNumbers.includes(upper)) {
          availableNumber = upper;
          suggestionFound = true;
          break;
        }

        if (lower >= 1 && !usedNumbers.includes(lower)) {
          availableNumber = lower;
          suggestionFound = true;
          break;
        }

        if (upper > 999 && lower < 1) {
          break;
        }
      }

      if (suggestionFound) {
        defaultValues = {
          error: `Le numéro ${reqNumberContent} n'est pas disponible.`,
          name: reqPseudoContent,
          suggestionNumber: availableNumber,
        };
      } else {
        defaultValues = {
          error: `Aucun numéro disponible entre 1 et 999.`,
          name: reqPseudoContent,
        };
      }

      const alreadyTakenNumber = new EmbedBuilder()
        .setColor(Config.colors.error)
        .setDescription(
          `### ${emoteComposer(Config.emotes.failure)} Le numéro ${reqNumberContent} n'est pas disponible. Voici un numéro disponible \`${availableNumber}\``
        );

      const buttonAlreadyTakenNumber = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`retryEditNumber_${userId}_${selectedGame}`)
          .setLabel('Réessayé')
          .setDisabled(false)
          .setStyle(ButtonStyle.Primary)
      );

      return await interaction.reply({
        embeds: [alreadyTakenNumber],
        components: [buttonAlreadyTakenNumber],
        ephemeral: true,
      });
    }

    const buildTrigram = reqPseudoContent.match(/[a-zA-Z]/g) || [];
    while (buildTrigram.length < 3) {
      buildTrigram.push(String.fromCharCode(65 + Math.random() * 26));
    }

    const trigram =
      reqTrigramContent === ''
        ? buildTrigram.slice(0, 3).join('').toUpperCase()
        : reqTrigramContent;

    accountConfig[selectedGame].name = reqPseudoContent;
    accountConfig[selectedGame].trigram = trigram;
    accountConfig[selectedGame].number = reqNumberContent;

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
