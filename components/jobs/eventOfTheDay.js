const { ChannelType, EmbedBuilder } = require('discord.js');
const {
  getAllEventsQuery,
  getEventByIdQuery,
} = require('../../context/data/data-events/queries');
const { isSameDay } = require('../../context/utils/utils');
const { Config } = require('../../context/config');
const {
  updateEventQuery,
} = require('../../context/data/data-events/mutations');
const { errorHandler } = require('../../context/utils/errorHandling');

async function getEventOfTheDay() {
  try {
    const events = await getAllEventsQuery();
    const currentTimestamp = Date.now();

    const todaysEvents = events.filter((event) => {
      const eventTimestamp = Number(event.timestamp) * 1000;
      return isSameDay(currentTimestamp, eventTimestamp);
    });

    if (todaysEvents.length !== 0) {
      // console.log(`Événement aujourd'hui : `, todaysEvents);
      for (const event of todaysEvents) {
        const eventTimestamp = Number(event.timestamp) * 1000;
        const timeUntilEvent = eventTimestamp - currentTimestamp;

        const channel = await bot.channels.fetch(event.channelId);
        const message = await channel.messages.fetch(event.messageId);

        if (message) {
          try {
            if (timeUntilEvent > 15 * 60 * 1000) {
              setTimeout(
                async () => {
                  let targetThread = await channel.threads.fetch(message.id);

                  if (targetThread) {
                    console.log('Thread Already exists');
                    return;
                  }

                  targetThread = await channel.threads.create({
                    name: `Événement du jour !`,
                    type: ChannelType.PublicThread,
                    startMessage: message.id,
                  });

                  const [updatedEvent] = await getEventByIdQuery(event.id);

                  const participations = JSON.parse(updatedEvent.registered);
                  const usersID = participations
                    .filter((p) => !p?.waiting)
                    .map((p) => p?.id);
                  const users = await Promise.all(
                    usersID.map((userID) =>
                      bot.users.fetch(userID).catch(() => null)
                    )
                  );
                  const userList = users
                    .filter((user) => user)
                    .map((user) => `<@${user.id}>`)
                    .join(', ');

                  const embedRules = new EmbedBuilder().setColor(
                    Config.colors.default
                  )
                    .setDescription(`### 📌 Règlement de l'événement\n\n**__Rappels :__**
                  :one: Extrême vigilance au premier tour, encore plus au premier virage
                  :two: Le fair play en piste est primordial, autant dans le pilotage que dans l'attitude
                  :three: En cas de contact, si vous êtes fautif, ne prenez pas l'avantage et attendez votre victime
                  :four: Essayez toujours de réparer et repartir :wink: 
                  :five: Interdiction de quitter le serveur avant la fin
                  :six: En cas de retour au stand pour abandon, si vous provoquez un drapeau jaune faites 'Conduire' puis à nouveau 'Retour au garage'
                  `);

                  const data = {
                    status: 'false',
                  };

                  await updateEventQuery(event.id, data);

                  await targetThread.send({
                    content: `## 🟢 L'événement commence à <t:${Math.floor(
                      eventTimestamp / 1000
                    )}:t> (<t:${Math.floor(eventTimestamp / 1000)}:R>)\n${
                      userList || 'Aucun participant.'
                    }`,
                    embeds: [embedRules],
                  });
                },
                timeUntilEvent - 15 * 60 * 1000
              );
            }
          } catch (error) {
            await errorHandler('', error);
          }
        }
      }
    }
  } catch (error) {
    await errorHandler('', error);
  }
}

module.exports = {
  getEventOfTheDay,
};
