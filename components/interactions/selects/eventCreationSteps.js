const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
} = require('discord.js');
const {
  fetchTracksQuery,
} = require('../../../context/data/data-tracks/queries');
const {
  fetchPresetsQuery,
} = require('../../../context/data/data-presets/queries');
const { chunkOptions } = require('../../../context/utils/chunkedSelector');
const { errorHandler } = require('../../../context/utils/errorHandling');
const { Config } = require('../../../context/config');

module.exports = {
  customId: 'eventCreationSteps',
  async execute(interaction) {
    const [action, eventId] = interaction.customId.split('_');
    const selectedValue = interaction.values[0];

    switch (selectedValue) {
      case '1': {
        const modalEventCreation = new ModalBuilder()
          .setCustomId(`modalEvent_${eventId}`)
          .setTitle('Description et horaire');

        const modalEventDescription = new TextInputBuilder()
          .setCustomId(`descriptionInput`)
          .setLabel('Entrez la description de votre événement :')
          .setPlaceholder('Exemple : Coucou comment ça va ?')
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        const modalEventDate = new TextInputBuilder()
          .setCustomId(`DateInput`)
          .setLabel('Entrez la date de votre événement :')
          .setPlaceholder('Exemple : 13/12/2024 (JJ/MM/AAAA)')
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        const modalEventHour = new TextInputBuilder()
          .setCustomId(`HourInput`)
          .setLabel("Entrez l'heure de votre l'event :")
          .setPlaceholder('Exemple : 21:30 (HH:mm)')
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        const reqModalEventDescription = new ActionRowBuilder().addComponents(
          modalEventDescription
        );
        const reqModalEventDateInput = new ActionRowBuilder().addComponents(
          modalEventDate
        );
        const reqModalEventHourInput = new ActionRowBuilder().addComponents(
          modalEventHour
        );

        modalEventCreation.addComponents(
          reqModalEventDescription,
          reqModalEventDateInput,
          reqModalEventHourInput
        );

        return await interaction.showModal(modalEventCreation);
      }

      case '2': {
        try {
          const tracks = await fetchTracksQuery();

          const options = tracks.map((track) => {
            const [flag, country] = track.nationality.split('-');
            return {
              emoji: flag,
              label: `${track.name}, ${country}`,
              description: track.duration,
              value: track.id,
            };
          });

          const chunkedOptions = chunkOptions(options);

          const components = chunkedOptions.map((group, index) => {
            return new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`tracksMenu_${eventId}_${index}`)
                .setPlaceholder(`📌 Sélectionner une option (${index + 1})...`)
                .addOptions(group)
            );
          });

          return await interaction.update({
            components,
            ephemeral: true,
          });
        } catch (error) {
          await errorHandler(interaction, error);
        }
      }

      case '3': {
        try {
          const presets = await fetchPresetsQuery();

          const options = presets.map((preset) => {
            const checkLicenceObligation =
              preset.licenceObligation === 'true'
                ? 'Licence Obligatoire'
                : 'Licence non obligatoire';
            return {
              label: preset.name,
              description: checkLicenceObligation,
              value: preset.id,
            };
          });

          const chunkedOptions = chunkOptions(options, 25, 2);

          const components = chunkedOptions.map((group, index) => {
            return new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`presetsMenu_${eventId}_${index}`)
                .setPlaceholder(`📌 Sélectionner une option (${index + 1})...`)
                .addOptions(group)
            );
          });

          return await interaction.update({
            components,
            ephemeral: true,
          });
        } catch (error) {
          await errorHandler(interaction, error);
        }
      }

      case '4': {
        try {
          const channels = interaction.guild.channels.cache.filter(
            (channel) =>
              channel.parentId &&
              Config.categories.events.includes(channel.parentId) &&
              channel.type === ChannelType.GuildAnnouncement
          );

          const options = channels.map((channel) => ({
            label: channel.name,
            value: channel.id,
          }));

          const chunkedOptions = chunkOptions(options, 25, 1);

          const components = chunkedOptions.map((group, index) => {
            return new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`channelsMenu_${eventId}_${index}`)
                .setPlaceholder('📌 Séléctionner une option...')
                .addOptions(group)
            );
          });

          return await interaction.update({
            components,
            ephemeral: true,
          });
        } catch (error) {
          await errorHandler(interaction, error);
        }
      }

      default:
        return;
    }
  },
};
