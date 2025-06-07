const loadSlashCommand = require('../handlers/loadSlashCommand');
const db = require('../handlers/loadDataBase');
const { Events } = require('discord.js');

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

    await connectToDataBase();

    await loadSlashCommand(bot);

    console.log(`${bot.user.tag} is now ON !`);
  },
};
