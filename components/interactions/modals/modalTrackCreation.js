const { EmbedBuilder } = require('discord.js');
const { Config } = require('../../../context/config');
const {
  insertTrackQuery,
} = require('../../../context/data/data-tracks/mutations');
const { generateID, emoteComposer } = require('../../../context/utils/utils');

module.exports = {
  customId: 'modalTrackCreation',
  async execute(interaction) {
    const [action, trackId] = interaction.customId.split('_');
    const reqTrackFlagContent = interaction.fields.getTextInputValue(
      'modalTrackFlagInput'
    );
    const reqTrackCountryContent = interaction.fields.getTextInputValue(
      'modalTrackCountryInput'
    );
    const reqTrackNameContent = interaction.fields.getTextInputValue(
      'modalTrackNameInput'
    );
    const reqTrackLengthContent = interaction.fields.getTextInputValue(
      'modalTrackLengthInput'
    );
    const reqTrackImageContent = interaction.fields.getTextInputValue(
      'modalTrackImageInput'
    );

    const trackID = generateID();

    const data = {
      id: trackID,
      flag: reqTrackFlagContent,
      country: reqTrackCountryContent,
      name: reqTrackNameContent,
      duration: reqTrackLengthContent,
      image: reqTrackImageContent,
    };

    await insertTrackQuery(data);

    const embedAddedNewRaceTrackSuccessfully = new EmbedBuilder()
      .setColor(Config.colors.success)
      .setDescription(
        `### ${emoteComposer(
          Config.emotes.success
        )} Ajout du circuit avec succès !**`
      );

    await interaction.reply({
      embeds: [embedAddedNewRaceTrackSuccessfully],
      ephemeral: true,
    });
  },
};
