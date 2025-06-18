const {
  fetchUserProfilByIdQuery,
} = require('../../../context/data/data-users/queries');
const { getDiscordUserInfos } = require('../../../context/utils/discordUtils');
const {
  generateID,
  currentTimestamp,
  emoteComposer,
} = require('../../../context/utils/utils');
const { Config } = require('../../../context/config');
const {
  insertSanctionQuery,
} = require('../../../context/data/data-sanctions/mutations');
const {
  updateUserQuery,
} = require('../../../context/data/data-users/mutations');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  customId: 'sendSanction',
  async execute(interaction) {
    const [action, userId] = interaction.customId.split('_');
    await interaction.deferReply({ ephemeral: true });
    const user = await getDiscordUserInfos(userId);
    const [userProfil] = await fetchUserProfilByIdQuery(userId);
    const reqMessageContent =
      interaction.fields.getTextInputValue('messageContent');

    const reqPointRetireContent =
      interaction.fields.getTextInputValue('sanctionPoints');

    const checkIfThereIsPointToRemove =
      reqPointRetireContent === '' ? 0 : parseInt(reqPointRetireContent);

    const sanctionID = generateID();

    const timestamp = currentTimestamp();
    const date = new Date(timestamp);
    date.setMonth(date.getMonth() + 3);

    const timestampIn3Month = date.getTime();

    if (
      userProfil.licencePoints === 0 ||
      userProfil.licencePoints - checkIfThereIsPointToRemove < 0
    ) {
      const embedCannotRemovePoints = new EmbedBuilder()
        .setColor(Config.colors.error)
        .setDescription(
          `### ${emoteComposer(Config.emotes.failure)} Cette utilisateur n'a plus de point à retirer !`
        );

      return interaction.editReply({
        embeds: [embedCannotRemovePoints],
        ephemeral: true,
      });
    }

    const sanctionData = {
      id: sanctionID,
      author_id: interaction.user.id,
      target_id: userId,
      description: reqMessageContent,
      point_remove: checkIfThereIsPointToRemove,
      timestamp: timestamp,
      return_timestamp: timestampIn3Month,
    };

    await insertSanctionQuery(sanctionData);

    const userData = {
      licence_points: userProfil.licencePoints - checkIfThereIsPointToRemove,
      sanction_id: sanctionID,
    };

    await updateUserQuery(userId, userData);

    const embedSanctionToUser = new EmbedBuilder()
      .setColor(Config.colors.default)
      .setDescription(
        `## 👮 Arbitrage LSX\n\n${reqMessageContent}\n**Vous avez perdu ${checkIfThereIsPointToRemove}**\n-# L'équipe LSX`
      )
      .setTimestamp();

    const interactionReplyEmbed = new EmbedBuilder()
      .setColor(Config.colors.success)
      .setDescription(
        `### ${emoteComposer(Config.emotes.success)} Le message a bien été envoyé à l'utilisateur ${user}`
      );

    await user.send({ embeds: [embedSanctionToUser] });
    await interaction.editReply({
      embeds: [interactionReplyEmbed],
      ephemeral: true,
    });
  },
};
