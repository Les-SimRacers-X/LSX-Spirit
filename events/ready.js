const loadSlashCommand = require('../handlers/loadSlashCommand');
const db = require('../handlers/loadDataBase');
const { Events } = require('discord.js');
const { getEventOfTheDay } = require('../components/jobs/eventOfTheDay');
const {
  updateTeamCategoryNumber,
  updateGeneralCategoryNumber,
  updatePlatformCategoriesNumber,
} = require('../components/jobs/updateCategoriesNumbers');

module.exports = {
  name: Events.ClientReady,
  async execute(bot) {
    async function connectToDataBase() {
      try {
        const connection = await db.getConnection();

        console.log('✅ Database connection established succesfully !');
        connection.release();

        db.on('error', async function (err) {
          console.log('❌ Database ERROR :', err);
          if (err.code === 'ECONNRESET') {
            try {
              const newConnection = await db.getConnection();
              console.log('✅ Database successfully reconnected !');
              newConnection.release();
            } catch (errDB) {
              console.error(
                '❌ Erreur lors de la reconnexion à la base de données :',
                errDB
              );
            }
          } else {
            throw err;
          }
        });
      } catch (error) {
        console.error(
          '❌ Erreur lors de la connexion à la base de données :',
          error
        );
      }
    }

    const interval = 10 * 60 * 1000;
    setInterval(getEventOfTheDay, interval);

    bot.on('guildMemberUpdate', async (oldMember, newMember) => {
      if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        await updateTeamCategoryNumber(newMember.guild);
      }
    });

    bot.on('guildMemberUpdate', async (oldMember, newMember) => {
      if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        await updatePlatformCategoriesNumber(newMember.guild);
      }
    });

    bot.on(
      'guildMemberAdd',
      async (member) => await updateGeneralCategoryNumber(member.guild)
    );
    bot.on(
      'guildMemberRemove',
      async (member) => await updateGeneralCategoryNumber(member.guild)
    );

    await getEventOfTheDay();

    await connectToDataBase();

    await loadSlashCommand(bot);

    console.log(`${bot.user.tag} is now ON !`);
  },
};
