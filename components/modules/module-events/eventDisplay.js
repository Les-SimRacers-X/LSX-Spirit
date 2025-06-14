const {
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
} = require('discord.js');
const { Config } = require('../../../context/config');
const {
  getEventByIdQuery,
  getEventByMessageIdQuery,
} = require('../../../context/data/data-events/queries');
const {
  updateEventQuery,
} = require('../../../context/data/data-events/mutations');
const { emoteComposer } = require('../../../context/utils/utils');
const { errorHandler } = require('../../../context/utils/errorHandling');
const {
  fetchUserProfilByIdQuery,
} = require('../../../context/data/data-users/queries');
const { getDiscordUserInfos } = require('../../../context/utils/discordUtils');
const { validateGameConfiguration } = require('./validateGameConfig');

async function createEventEmbed(event, categories, registrations) {
  const [flag, country] = event?.trackNationality.split('-');

  const embedEventDisplay = new EmbedBuilder()
    .setColor(Config.colors.mainServerColor)
    .setDescription(
      `## ${flag} ${event?.trackName} (${event?.trackLength})\n${event?.description}\n- **📆 Date :** <t:${event?.timestamp}:D>\n- **⏰ Horaire :** <t:${event?.timestamp}:t>\n- **📍 Lieu :** ${event?.trackName}, ${country}`
    )
    .setImage(event?.trackImage);

  for (const { category, maxParticipants } of categories) {
    const confirmedParticipants = registrations.filter(
      (p) => p?.category === category && p?.waiting === false
    );

    const users = await Promise.all(
      confirmedParticipants.map((p) => bot.users.fetch(p?.id).catch(() => null))
    );

    const userList = users
      .filter((user) => user)
      .map((user) => `> ${user.globalName || user.username}`)
      .join('\n');

    embedEventDisplay.addFields({
      name: `Catégorie ${category} (${confirmedParticipants.length}/${maxParticipants})`,
      value: userList || '> Aucun participant.',
      inline: true,
    });
  }

  const waitingListParticipations = registrations.filter(
    (p) => p?.waiting === true
  );

  const waitlistDescription = await Promise.all(
    waitingListParticipations.map(async (p) => {
      try {
        const fetchedUser = await bot.users.fetch(p?.id);
        return `> ${fetchedUser.globalName || fetchedUser.username} (*${
          p?.category
        }*)`;
      } catch (error) {
        return null;
      }
    })
  ).then(
    (results) =>
      results.filter(Boolean).join('\n') || '> Aucun utilisateur en attente.'
  );

  embedEventDisplay.addFields({
    name: `Liste d'attente`,
    value: waitlistDescription,
    inline: false,
  });

  return {
    embeds: [embedEventDisplay],
  };
}

async function generateEvent(eventId) {
  const [event] = await getEventByIdQuery(eventId);

  const categoryEntries = event.presetCategory
    ? event.presetCategory.split(';').filter((entry) => entry)
    : [];

  const categories = categoryEntries.map((entry) => {
    const [category, maxParticipants] = entry.split('-');
    return {
      category,
      maxParticipants: parseInt(maxParticipants, 10),
    };
  });

  const participations = JSON.parse(event.registered);

  const { embeds } = await createEventEmbed(event, categories, participations);

  const getRandomButtonStyle = (() => {
    const styles = [
      ButtonStyle.Primary,
      ButtonStyle.Secondary,
      ButtonStyle.Success,
    ];

    return () => styles[Math.floor(Math.random() * styles.length)];
  })();

  const buttons = categories.map(({ category }, index) =>
    new ButtonBuilder()
      .setCustomId(`registerParticipation_${category}`)
      .setLabel(category)
      .setStyle(getRandomButtonStyle())
  );

  const actionRows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    actionRows.push(
      new ActionRowBuilder().addComponents(buttons.slice(i, i + 5))
    );
  }

  const sendMessageEvent = await bot.channels.cache.get(event.channelId).send({
    content: `<@&${Config.roles.member}>`,
    embeds,
    components: actionRows,
  });

  const data = {
    message_id: sendMessageEvent.id,
  };

  await updateEventQuery(eventId, data);

  const eventSentSuccess = new EmbedBuilder()
    .setColor(Config.colors.success)
    .setDescription(
      `### ${emoteComposer(
        Config.emotes.success
      )} Événement envoyé avec succès !`
    );

  return {
    embeds: [eventSentSuccess],
  };
}

async function updateEventMessage(interaction, category) {
  try {
    const [eventBeforeUpdate] = await getEventByMessageIdQuery(
      interaction.message.id
    );
    const [userProfil] = await fetchUserProfilByIdQuery(interaction.user.id);

    const gameConfigValidation = await validateGameConfiguration(
      interaction,
      userProfil?.gameConfig
    );

    const registrationRules = [
      {
        condition: eventBeforeUpdate.status === 'false',
        message: `Les inscriptions et modifications à l'événement sont actuellement fermé !`,
      },
      {
        condition:
          eventBeforeUpdate.presetLicence === 'true' && userProfil.length === 0,
        message: `Vous ne possédez pas de super-licence ! Pour vous inscrire ${emoteComposer(
          Config.emotes.nextArrow
        )} <#${Config.channels.licence}>`,
      },
      {
        condition: userProfil?.licencePoints === 0,
        message: `Vous n'avez plus de point sur votre licence, l'accès aux événements est indisponible !`,
      },
      {
        condition: userProfil?.gameConfig === '{}',
        message: `Vous n'avez pas configurer votre licence !`,
      },
      {
        condition: () => {
          if (eventBeforeUpdate.presetLicence === 'true') {
            return gameConfigValidation.isValid;
          }
        },
        message: gameConfigValidation.message,
      },
      {
        condition:
          category === 'Spectateur' &&
          !interaction.member.roles.cache.has(Config.roles.spectator),
        message: `Vous n'avez pas les permissions pour être spéctateur !`,
      },
    ];

    const failedMessage = registrationRules
      .filter((rule) => rule.condition)
      .map((rule) => rule.message);

    if (failedMessage.length > 0) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Config.colors.error)
            .setDescription(
              `### ${emoteComposer(Config.emotes.failure)} ${failedMessage.join(
                '\n\n'
              )}`
            ),
        ],
        ephemeral: true,
      });
    }

    const categoryEntries = eventBeforeUpdate?.presetCategory
      .split(';')
      .filter((entry) => entry);
    const categories = categoryEntries.map((entry) => {
      const [category, maxParticipants] = entry.split('-');
      return {
        category,
        maxParticipants: parseInt(maxParticipants, 10),
      };
    });

    const participants = JSON.parse(eventBeforeUpdate?.registered) || [];

    const categoryDetails = categories.find(
      (cat) => cat?.category === category
    );

    const userInCategory = participants.find(
      (p) =>
        p?.id === interaction.user.id &&
        p?.category === category &&
        (p?.waiting === true || p?.waiting === false)
    );

    const userAlreadyregistered = participants.some(
      (p) => p.id === interaction.user.id && p.category !== category
    );

    if (userAlreadyregistered) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Config.colors.warning)
            .setDescription(
              `### ${emoteComposer(
                Config.emotes.warning
              )} Vous êtes déjà inscrit dans une autre catégorie ou dans une wailist. Vous ne pouvez pas vous inscrire à la catégorie \`${category}\``
            ),
        ],
        ephemeral: true,
      });
    }

    if (userInCategory) {
      const updatedParticipantArray = participants.filter(
        (p) =>
          !(
            p.id === userInCategory?.id &&
            p.category === userInCategory?.category &&
            p.waiting === userInCategory?.waiting
          )
      );

      const updatedParticipantJson = JSON.stringify(updatedParticipantArray);
      if (userInCategory?.waiting === true) {
        const data = {
          users: updatedParticipantJson,
        };

        await updateEventQuery(eventBeforeUpdate.id, data);

        const [eventAfterUpdate] = await getEventByMessageIdQuery(
          interaction.user.id
        );

        const participantsAfterUpdate =
          JSON.parse(eventAfterUpdate?.registered) || [];

        const { embeds } = await createEventEmbed(
          eventAfterUpdate,
          categories,
          participantsAfterUpdate
        );

        const removeUserFromWaitlist = new EmbedBuilder()
          .setColor(Config.colors.success)
          .setDescription(
            `### ${emoteComposer(
              Config.emotes.success
            )} Vous avez été retiré de la liste d'attente pour la catégorie \`${category}\``
          );

        await interaction.reply({
          embeds: [removeUserFromWaitlist],
          ephemeral: true,
        });
        return {
          embeds,
        };
      }

      if (userInCategory?.waiting === false) {
        const updatedParticipantArray = participants.filter(
          (p) =>
            !(
              p?.id === userInCategory?.id &&
              p?.category === userInCategory?.category &&
              p?.waiting === userInCategory?.waiting
            )
        );

        const waitlistUserForCategory = updatedParticipantArray.find(
          (p) => p?.category === category && p?.waiting === true
        );

        let promotedUser = null;
        if (waitlistUserForCategory) {
          promotedUser = { ...waitlistUserForCategory, waiting: false };

          const indexToReplace = updatedParticipantArray.findIndex(
            (p) =>
              p?.id === waitlistUserForCategory?.id &&
              p?.category === waitlistUserForCategory?.category &&
              p?.waiting === true
          );
          if (indexToReplace !== -1) {
            updatedParticipantArray[indexToReplace] = promotedUser;
          }
        }

        const updatedParticipantJson = JSON.stringify(updatedParticipantArray);
        const data = {
          users: updatedParticipantJson,
        };

        await updateEventQuery(eventBeforeUpdate.id, data);

        if (promotedUser) {
          try {
            const promotedUserObject = getDiscordUserInfos(promotedUser?.id);
            const promotedEmbed = new EmbedBuilder()
              .setColor(Config.colors.success)
              .setDescription(
                `### 🎉 ${
                  promotedUserObject.globalName || promotedUserObject.username
                } a été promu de la liste d'attente à la catégorie \`${category}\``
              );

            await promotedUserObject.send({ embeds: [promotedEmbed] });
          } catch (error) {
            await errorHandler(interaction, error);
          }
        }

        const [eventAfterUpdate] = await getEventByMessageIdQuery(
          interaction.message.id
        );

        const participantsAfterUpdate =
          JSON.parse(eventAfterUpdate?.registered) || [];

        const { embeds } = await createEventEmbed(
          eventAfterUpdate,
          categories,
          participantsAfterUpdate
        );

        const removeUserFromCategory = new EmbedBuilder()
          .setColor(Config.colors.success)
          .setDescription(
            `### ${emoteComposer(
              Config.emotes.success
            )} Vous avez été retiré de l'événement pour la catégorie \`${category}\``
          );

        await interaction.reply({
          embeds: [removeUserFromCategory],
          ephemeral: true,
        });

        return {
          embeds,
        };
      }

      const data = {
        users: updatedParticipantJson,
      };

      await updateEventQuery(eventBeforeUpdate?.id, data);

      const [eventAfterUpdate] = await getEventByMessageIdQuery(
        interaction.message.id
      );

      const participantsAfterUpdate =
        JSON.parse(eventAfterUpdate?.registered) || [];

      const { embeds } = await createEventEmbed(
        eventAfterUpdate,
        categories,
        participantsAfterUpdate
      );

      const removedFromList = new EmbedBuilder()
        .setColor(Config.colors.success)
        .setDescription(
          `### ${emoteComposer(
            Config.emotes.success
          )} Vous avez été retiré de l'événement pour la catégorie \`${category}\``
        );

      await interaction.reply({
        embeds: [removedFromList],
        ephemeral: true,
      });
      return {
        embeds,
      };
    }

    const currentParticipants = participants.filter(
      (p) => p?.category === category && p?.waiting === false
    );

    if (currentParticipants.length >= categoryDetails?.maxParticipants) {
      const newParticipant = {
        id: interaction.user.id,
        category: category,
        waiting: true,
      };

      participants.push(newParticipant);

      const updatedParticipantJson = JSON.stringify(participants);
      const data = {
        users: updatedParticipantJson,
      };

      await updateEventQuery(eventBeforeUpdate?.id, data);

      const [eventAfterUpdate] = await getEventByMessageIdQuery(
        interaction.message.id
      );
      const participantsAfterUpdate =
        JSON.parse(eventAfterUpdate?.registered) || [];

      const { embeds } = await createEventEmbed(
        eventAfterUpdate,
        categories,
        participantsAfterUpdate
      );

      const addedToWaitingList = new EmbedBuilder()
        .setColor(Config.colors.warning)
        .setDescription(
          `### ${emoteComposer(
            Config.emotes.warning
          )} La catégorie \`${category}\` est pleine. Vous avez été ajouté à la liste d'attente.`
        );

      await interaction.reply({
        embeds: [addedToWaitingList],
        ephemeral: true,
      });
      return {
        embeds,
      };
    } else {
      const newParticipant = {
        id: interaction.user.id,
        category: category,
        waiting: false,
      };

      participants.push(newParticipant);

      const updatedParticipantJson = JSON.stringify(participants);
      const data = {
        users: updatedParticipantJson,
      };

      await updateEventQuery(eventBeforeUpdate?.id, data);

      const [eventAfterUpdate] = await getEventByMessageIdQuery(
        interaction.message.id
      );

      const participantsAfterUpdate =
        JSON.parse(eventAfterUpdate?.registered) || [];

      const { embeds } = await createEventEmbed(
        eventAfterUpdate,
        categories,
        participantsAfterUpdate
      );

      const added = new EmbedBuilder()
        .setColor(Config.colors.success)
        .setDescription(
          `### ${emoteComposer(
            Config.emotes.success
          )} Vous avez été inscrit avec succès à la catégorie \`${category}\``
        );

      await interaction.reply({
        embeds: [added],
        ephemeral: true,
      });

      return {
        embeds,
      };
    }
  } catch (error) {
    await errorHandler(interaction, error);
  }
}

module.exports = {
  generateEvent,
  updateEventMessage,
};
