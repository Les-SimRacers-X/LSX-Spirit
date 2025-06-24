const {
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
} = require('discord.js');
const { getConsoleUXID } = require('../../../context/utils/userGameUXID');
const {
  updateUserQuery,
} = require('../../../context/data/data-users/mutations');
const {
  fetchNumberInAccountConfig,
  fetchUserAccountConfigByIdQuery,
} = require('../../../context/data/data-users/queries');
const { Config } = require('../../../context/config');
const { emoteComposer } = require('../../../context/utils/utils');

module.exports = {
  customId: 'gameConfigModal',
  async execute(interaction) {
    const [action, step, gameSelected, userId] =
      interaction.customId.split('_');
    const reqPseudoContent =
      interaction.fields.getTextInputValue('usernameInput');
    const reqNumberContent = parseInt(
      interaction.fields.getTextInputValue('numberInput')
    );

    const usedNumbers = await fetchNumberInAccountConfig(gameSelected);

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
            name: reqPseudoContent,
            suggestionNumber: availableNumber,
          };
        } else {
          defaultValues = {
            error: `Aucun numéro disponible entre 1 et 999`,
            name: reqPseudoContent,
          };
        }
      }

      const alreadyTakenNumber = new EmbedBuilder()
        .setColor(Config.colors.error)
        .setDescription(
          `### ${emoteComposer(Config.emotes.failure)} Le numéro ${reqNumberContent} n'est pas disponible. Voici un numéro disponible \`${availableNumber}\``
        );

      const buttonAlreadyTakenNumber = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(
            `retryNumber_${userId}_${gameSelected}_${step}_${defaultValues}`
          )
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

    const [userConfig] = await fetchUserAccountConfigByIdQuery(userId);
    let accountConfig = {};
    let finalUXID = 'null';

    if (gameSelected === 'acc') {
      const UXID = await getConsoleUXID(reqPseudoContent);

      if (!UXID || UXID === undefined) {
        defaultValues = {
          error: `Votre pseudo "${reqPseudoContent}" n'est pas retrouver !`,
        };

        const alreadyTakenNumber = new EmbedBuilder()
          .setColor(Config.colors.error)
          .setDescription(
            `### ${emoteComposer(Config.emotes.failure)} Veuillez réessayer, votre pseudo \`${reqPseudoContent}\` n'est pas retrouver !`
          );
        const buttonAlreadyTakenNumber = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(
              `retryNumber_${userId}_${gameSelected}_${step}_${defaultValues}`
            )
            .setLabel('Réessayé')
            .setDisabled(false)
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
          embeds: [alreadyTakenNumber],
          components: [buttonAlreadyTakenNumber],
          ephemeral: true,
        });
      }

      finalUXID = `${UXID.platform}${UXID.id}`;
    }

    const buildTrigram = reqPseudoContent.match(/[a-zA-Z]/g) || [];
    while (buildTrigram.length < 3) {
      buildTrigram.push(String.fromCharCode(65 + Math.random() * 26));
    }

    const trigram = buildTrigram.slice(0, 3).join('').toUpperCase();

    accountConfig = JSON.parse(userConfig.gameConfig);
    if (accountConfig[gameSelected]) {
      accountConfig[gameSelected].id = finalUXID;
      accountConfig[gameSelected].name = reqPseudoContent;
      accountConfig[gameSelected].trigram = trigram;
      accountConfig[gameSelected].number = reqNumberContent;
    }

    const userData = {
      accounts_config: JSON.stringify(accountConfig),
    };

    await updateUserQuery(userId, userData);

    const answerUser = new EmbedBuilder()
      .setColor(Config.colors.success)
      .setDescription(
        `### ${emoteComposer(
          Config.emotes.success
        )} Votre licence a été correctement configurée ! Veuillez cliquer de nouveau sur \`Licence LSX\` pour consulter votre licence.`
      );

    return interaction.reply({
      embeds: [answerUser],
      components: [],
      ephemeral: true,
    });
  },
};
